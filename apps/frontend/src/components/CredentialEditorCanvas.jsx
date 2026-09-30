"use client";
/**
 * CredentialEditorCanvas
 *
 * Renders front AND back faces of Elite / Elite-Azul credentials using
 * absolute positioning so every element can be dragged and resized.
 *
 * Exports:
 *   default  ─ CredentialEditorCanvas
 *   named    ─ CredentialControlPanel
 *   named    ─ defaultLayout(templateId)      (front)
 *   named    ─ defaultBackLayout(templateId)  (back)
 */

import JsBarcode from "jsbarcode";
import { useEffect, useRef, useState } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PrintCard, trackImageWork,
  COUNTRIES_BANNER_SRC, COUNTRIES_BANNER_RATIO, formatExpiry, parsePastor, hasCountriesBanner,
} from "@/lib/credentialShared";

const ACCENT = BRAND_BLUE;
const PHOTO_W_DEF = Math.round(CARD_W * 0.40); // 259
// Photo fades in from its left edge (same curve as the former white overlay)
const PHOTO_FADE_MASK = "linear-gradient(to right, transparent 0%, #000 48%)";
// When shrunk, its top edge no longer touches the header, so it fades in from the top too
const PHOTO_FADE_MASK_SHRUNK = `${PHOTO_FADE_MASK}, linear-gradient(to bottom, transparent 0%, #000 15%)`;
// The photo can only shrink (at 1 it already fills the height); it stays anchored bottom-right
const PHOTO_SCALE_MIN = 0.4;
const clampPhotoScale = (s) => Math.min(1, Math.max(PHOTO_SCALE_MIN, s));

// Text may run this far past the photo's left edge — the fade is still transparent there
const TEXT_INTO_PHOTO = 10;
const TEXT_RIGHT_MARGIN = 16;
const NAME_LINE_HEIGHT = 1.1;
const NAME_MIN_SCALE = 0.6;   // long names wrap to two lines, then shrink down to this
const CHURCH_MIN_SCALE = 0.7; // church names only shrink

/* ── Text measurement (canvas, client only) ──────────────────────── */
let measureCtx = null;
const canMeasure = () => typeof document !== "undefined";
function textWidth(text, font, letterSpacingEm = 0, fontSize = 0) {
  if (!canMeasure()) return 0;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  measureCtx.font = font;
  return measureCtx.measureText(text).width + letterSpacingEm * fontSize * Math.max(0, text.length - 1);
}

/**
 * Fits the name into maxWidth: one line if it fits, otherwise two balanced lines at the
 * same size, otherwise two lines shrunk (down to NAME_MIN_SCALE). Server-side it just
 * returns the text as-is (the pages that prerender only show short demo names).
 */
function layoutName(text, { fontSize, fontWeight, fontFamily }, letterSpacingEm, maxWidth) {
  const single = { lines: [text], fontSize };
  if (!canMeasure() || !text) return single;
  const width = (t, fs) => textWidth(t, `${fontWeight} ${fs}px ${fontFamily}`, letterSpacingEm, fs);
  if (width(text, fontSize) <= maxWidth) return single;

  const words = text.split(/\s+/).filter(Boolean);
  const bestSplit = (fs) => {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
      const w = Math.max(width(a, fs), width(b, fs));
      if (!best || w < best.w) best = { lines: [a, b], w };
    }
    return best;
  };
  const minSize = fontSize * NAME_MIN_SCALE;
  for (let fs = fontSize; fs >= minSize; fs -= 0.5) {
    if (words.length === 1) {
      if (width(text, fs) <= maxWidth) return { lines: [text], fontSize: fs };
      continue;
    }
    const split = bestSplit(fs);
    if (split.w <= maxWidth) return { lines: split.lines, fontSize: fs };
  }
  return words.length === 1 ? { lines: [text], fontSize: minSize } : { lines: bestSplit(minSize).lines, fontSize: minSize };
}

/** Shrinks a single-line text (down to minScale) so it fits maxWidth. */
function fitFontSize(text, { fontSize, fontWeight, fontFamily }, maxWidth, minScale) {
  if (!canMeasure() || !text) return fontSize;
  const w = textWidth(text, `${fontWeight} ${fontSize}px ${fontFamily}`);
  if (w <= maxWidth) return fontSize;
  return Math.max(fontSize * minScale, Math.floor((fontSize * maxWidth / w) * 2) / 2);
}

/* ── Photo: measure + bake the fade into the pixels ───────────────
   CSS/SVG masks are dropped by Chromium when printing, so the left-edge fade (and the
   top fade when the photo is shrunk) is baked into an image with real transparency.
   Results are cached per photo/box shape; cross-origin photos need CORS (Supabase Storage
   allows it) — if a photo can't be read, we fall back to the CSS mask (screen only). */
const PHOTO_FADE_X   = 0.48; // fully opaque from this fraction of the width
const PHOTO_FADE_TOP = 0.15; // fully opaque from this fraction of the height (shrunk only)
const BAKE_MAX_SIDE  = 900;  // px — plenty for a 34mm-wide printed photo

const photoCache = new Map();   // key → Promise<{ aspect, fadedSrc }>
const photoResults = new Map(); // key → resolved value (for synchronous first render)

function loadImage(src, withCors) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (withCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function toBlobUrl(canvas) {
  return new Promise((resolve) => {
    const done = (blob) => resolve(blob ? URL.createObjectURL(blob) : null);
    // WebP keeps alpha at a fraction of PNG's size; browsers without WebP encoding return PNG
    canvas.toBlob(done, "image/webp", 0.9);
  });
}

async function renderPhoto(src, maxBoxAspect, fadeTop) {
  const isData = src.startsWith("data:");
  let img;
  try {
    img = await loadImage(src, !isData);
  } catch {
    img = await loadImage(src, false); // no CORS: aspect only, no bake
    return { aspect: img.naturalWidth / img.naturalHeight, fadedSrc: null };
  }
  const aspect = img.naturalWidth / img.naturalHeight;
  const boxAspect = Math.min(aspect, maxBoxAspect); // wider photos get their sides cropped

  const scale = Math.min(1, BAKE_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const H = Math.round(img.naturalHeight * scale);
  const W = Math.round(H * boxAspect);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  // object-fit: cover, object-position: top center
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.drawImage(img, (W - dw) / 2, 0, dw, dh);

  ctx.globalCompositeOperation = "destination-in";
  const gx = ctx.createLinearGradient(0, 0, W, 0);
  gx.addColorStop(0, "rgba(0,0,0,0)"); gx.addColorStop(PHOTO_FADE_X, "rgba(0,0,0,1)");
  ctx.fillStyle = gx; ctx.fillRect(0, 0, W, H);
  if (fadeTop) {
    const gy = ctx.createLinearGradient(0, 0, 0, H);
    gy.addColorStop(0, "rgba(0,0,0,0)"); gy.addColorStop(PHOTO_FADE_TOP, "rgba(0,0,0,1)");
    ctx.fillStyle = gy; ctx.fillRect(0, 0, W, H);
  }
  try {
    return { aspect, fadedSrc: await toBlobUrl(canvas) };
  } catch {
    return { aspect, fadedSrc: null }; // tainted canvas → CSS mask fallback
  }
}

function usePhoto(src, maxBoxAspect, fadeTop) {
  const key = src ? `${src}|${maxBoxAspect.toFixed(4)}|${fadeTop ? 1 : 0}` : null;
  const [state, setState] = useState(() => (key && photoResults.get(key)) || null);
  useEffect(() => {
    if (!key) { setState(null); return; }
    const ready = photoResults.get(key);
    setState(ready ?? null);
    if (ready) return;
    let promise = photoCache.get(key);
    if (!promise) {
      promise = renderPhoto(src, maxBoxAspect, fadeTop)
        .then((r) => { photoResults.set(key, r); return r; })
        .catch(() => { const r = { aspect: null, fadedSrc: null }; photoResults.set(key, r); return r; });
      photoCache.set(key, promise);
      trackImageWork(promise);
    }
    let cancelled = false;
    promise.then((r) => { if (!cancelled) setState(r); });
    return () => { cancelled = true; };
  }, [key, src, maxBoxAspect, fadeTop]);
  return state ?? { aspect: null, fadedSrc: null };
}

// Header/footer texts can only grow: min is the original size, max keeps them inside the card
const GROW_ONLY_LIMITS = {
  headerText: { min: 10.5, max: 20 },
  footerText: { min: 6.5,  max: 11 },
};
const HEADER_SUB_RATIO = 8 / 10.5; // subtitle keeps its original proportion to the org name
// Big background logo: originally centered at 30% / 50% of the card, 160×160
const WATERMARK_DEFAULT = { x: Math.round(CARD_W * 0.3 - 80), y: CARD_H / 2 - 80, w: 160, h: 160 };
const FOOTER_H_MIN = 32;

function growOnlySize(L, key) {
  const { min, max } = GROW_ONLY_LIMITS[key];
  return Math.min(max, Math.max(min, L[key]?.fontSize ?? min));
}

// Stored layouts may predate newer elements — fill any missing keys from the defaults
export function withLayoutDefaults(layout, defaults) {
  return { ...defaults, ...(layout ?? {}) };
}

/* ─────────────────────────────────────────────────────────────────────
   Theme config per template
───────────────────────────────────────────────────────────────────── */
const THEMES = {
  "elite": {
    topBarH: 5,
    topBarBg: `linear-gradient(90deg,${ACCENT} 0%,#5fa0e8 70%,#ddeaf8 100%)`,
    headerH: 62,
    headerBg: "#ffffff",
    headerOrgColor: "#0d1b2a",
    headerSubColor: ACCENT,
    headerOrgWeight: 800,
    headerSubWeight: 600,
    headerBorderBottom: null,
    logoBg: "#ddeaf8",
    logoBorder: `${ACCENT}40`,
    logoShadow: null,
    dark: "#0d1b2a",
    muted: "#64748b",
    light: "#ddeaf8",
    badgeBg: "#ddeaf8",
    badgeBorder: `${ACCENT}50`,
    badgeColor: ACCENT,
    ruleGrad: `linear-gradient(90deg,${ACCENT},#ddeaf8)`,
    footerBg: "#f5f8fd",
    footerBorder: "#dde8f5",
    footerMuted: "#64748b",
    footerVerse: "#8fa5be",
    cardBorder: "1px solid #dbe4ef",
    cardShadow: "0 8px 32px rgba(30,60,110,0.14)",
    barcodeBoxBg: "#f5f8fd",
    barcodeBoxBorder: `${ACCENT}30`,
    watermarkOpacity: 0.18,
    backWatermarkOpacity: 0.18,
  },
  "elite-azul": {
    topBarH: 0,
    topBarBg: null,
    headerH: 66,
    headerBg: `linear-gradient(135deg,${ACCENT} 0%,#2d6eb0 100%)`,
    headerOrgColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.82)",
    headerOrgWeight: 800,
    headerSubWeight: 500,
    headerBorderBottom: "2px solid #b8d4f0",
    logoBg: "#ffffff",
    logoBorder: null,
    logoShadow: "0 0 0 3px rgba(255,255,255,0.25)",
    dark: "#0d1b2a",
    muted: "#3a5a7c",
    light: "#ddeaf8",
    badgeBg: ACCENT,
    badgeBorder: null,
    badgeColor: "#ffffff",
    ruleGrad: `linear-gradient(90deg,${ACCENT},#ddeaf8)`,
    footerBg: "#b8d4f0",
    footerBorder: "#9bbedd",
    footerMuted: "#3a5a7c",
    footerVerse: "#2e5c8a",
    cardBorder: "1px solid #a8c8e8",
    cardShadow: "0 8px 32px rgba(20,60,120,0.18)",
    barcodeBoxBg: "#ffffff",
    barcodeBoxBorder: "#b8d4f0",
    watermarkOpacity: 0.28,
    backWatermarkOpacity: 0.25,
  },
};

/* ─────────────────────────────────────────────────────────────────────
   Default layouts (pixel coordinates on 648×408 canvas)
   Coordinates are calculated to match the original flex-centered templates.
   v2 — bumped to discard any old localStorage layouts.
───────────────────────────────────────────────────────────────────── */
export function defaultLayout(templateId) {
  const th = THEMES[templateId] ?? THEMES.elite;
  const isAzul = templateId === "elite-azul";

  if (isAzul) {
    // elite-azul: topBar=0, header=66, footer=32, body=310, padding=12
    // content height ≈ 124px → top of content at y ≈ 66+12+(286-124)/2 = 159
    return {
      logo:    { x: 14, y: 7,   w: 48, h: 48 },
      name:    { x: 20, y: 159, fontSize: 25, fontWeight: 900, fontFamily: "Arial, sans-serif" },
      doc:     { x: 20, y: 202, fontSize: 16, fontWeight: 600, fontFamily: "Arial, sans-serif" },
      title:   { x: 20, y: 224, fontSize: 14, fontWeight: 700, fontFamily: "Arial, sans-serif" },
      church:  { x: 20, y: 250, fontSize: 13, fontWeight: 400, fontFamily: "Arial, sans-serif" },
      country: { x: 20, y: 268, fontSize: 13, fontWeight: 400, fontFamily: "Arial, sans-serif" },
      headerText: { fontSize: GROW_ONLY_LIMITS.headerText.min },
      footerText: { fontSize: GROW_ONLY_LIMITS.footerText.min },
      watermark:  { ...WATERMARK_DEFAULT },
      photo:      { scale: 1 },
    };
  }

  // elite: topBar=5, header=62, footer=32, body=309, padding=10
  // content height ≈ 125px → top of content at y ≈ 67+10+(289-125)/2 = 159
  return {
    logo:    { x: 14, y: th.topBarH + 7, w: 48, h: 48 },
    name:    { x: 18, y: 159, fontSize: 22, fontWeight: 900, fontFamily: "Arial, sans-serif" },
    doc:     { x: 18, y: 202, fontSize: 14, fontWeight: 600, fontFamily: "Arial, sans-serif" },
    title:   { x: 18, y: 225, fontSize: 12, fontWeight: 700, fontFamily: "Arial, sans-serif" },
    church:  { x: 18, y: 251, fontSize: 12, fontWeight: 400, fontFamily: "Arial, sans-serif" },
    country: { x: 18, y: 270, fontSize: 12, fontWeight: 400, fontFamily: "Arial, sans-serif" },
    headerText: { fontSize: GROW_ONLY_LIMITS.headerText.min },
    footerText: { fontSize: GROW_ONLY_LIMITS.footerText.min },
    watermark:  { ...WATERMARK_DEFAULT },
    photo:      { scale: 1 },
  };
}

export function defaultBackLayout(templateId) {
  const isAzul = templateId === "elite-azul";
  const topH = isAzul ? 6 : 5;
  return {
    legalText:      { x: 22, y: topH + 18, w: CARD_W - 44, fontSize: 11.5, fontWeight: 400, fontFamily: "Arial, sans-serif" },
    expiryBlock:    { x: 20, y: 292 },
    signatureBlock: { x: CARD_W - 175, y: 278 },
    barcode:        { x: 14, y: 352, w: CARD_W - 28, h: 46 },
  };
}

/* ─────────────────────────────────────────────────────────────────────
   SVG decorations
───────────────────────────────────────────────────────────────────── */
function Deco({ templateId }) {
  const style = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 };
  if (templateId === "elite-azul") {
    return (
      <svg style={style} width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} fill="none">
        <circle cx={CARD_W + 20} cy="-20" r="180" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.20" />
        <circle cx={CARD_W + 20} cy="-20" r="130" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.14" />
        <circle cx="-20" cy={CARD_H + 20} r="140" stroke={ACCENT} strokeWidth="1" strokeOpacity="0.22" />
        {[0,1,2,3].flatMap(col => [0,1,2].map(row => (
          <circle key={`d-${col}-${row}`} cx={CARD_W-22-col*13} cy={CARD_H-24+row*10} r="1.3" fill="#fff" fillOpacity="0.35" />
        )))}
      </svg>
    );
  }
  return (
    <svg style={style} width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} fill="none">
      <circle cx="-10" cy={CARD_H + 10} r="170" stroke={ACCENT} strokeWidth="1.2" strokeOpacity="0.18" />
      <circle cx="-10" cy={CARD_H + 10} r="130" stroke={ACCENT} strokeWidth="0.7" strokeOpacity="0.12" />
      <circle cx={CARD_W - PHOTO_W_DEF / 2} cy="0" r="60" fill={ACCENT} fillOpacity="0.06" />
      {[0,1,2,3].flatMap(col => [0,1,2].map(row => (
        <circle key={`d-${col}-${row}`} cx={18+col*14} cy={CARD_H-28+row*11} r="1.3" fill={ACCENT} fillOpacity="0.3" />
      )))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Draggable wrapper — handles move + corner resize
───────────────────────────────────────────────────────────────────── */
function Draggable({ id, el, onUpdate, editMode, selected, onSelect, canResize = false, scale = 1, zIndex = 4, offsetY = 0, children }) {
  const isSelected = editMode && selected === id;

  const startDrag = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    const sx = e.clientX, sy = e.clientY;
    const ox = el.x, oy = el.y;
    const onMove = (me) => {
      onUpdate(id, { ...el, x: Math.max(0, ox + (me.clientX - sx) / scale), y: Math.max(0, oy + (me.clientY - sy) / scale) });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const { x: ox, y: oy, w: ow, h: oh } = el;
    const onMove = (me) => {
      const dx = (me.clientX - sx) / scale;
      const dy = (me.clientY - sy) / scale;
      let x = ox, y = oy, w = ow, h = oh;
      if (corner.includes("e")) w = Math.max(30, ow + dx);
      if (corner.includes("s")) h = Math.max(30, oh + dy);
      if (corner.includes("w")) { x = ox + dx; w = Math.max(30, ow - dx); }
      if (corner.includes("n")) { y = oy + dy; h = Math.max(30, oh - dy); }
      onUpdate(id, { ...el, x, y, w, h });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: el.x, top: el.y + offsetY,
        ...(el.w !== undefined ? { width: el.w } : {}),
        ...(el.h !== undefined ? { height: el.h } : {}),
        cursor: editMode ? "move" : "default",
        outline: isSelected
          ? `2px solid ${ACCENT}`
          : editMode ? "1px dashed rgba(56,120,190,0.35)" : "none",
        outlineOffset: isSelected ? 2 : 1,
        zIndex: isSelected ? 6 : zIndex,
        userSelect: "none",
        boxSizing: "border-box",
      }}
      onMouseDown={startDrag}
    >
      {children}
      {canResize && el.w !== undefined && isSelected && (
        ["nw","ne","sw","se"].map(c => (
          <div
            key={c}
            onMouseDown={(e) => startResize(e, c)}
            style={{
              position: "absolute",
              width: 10, height: 10,
              background: "#fff",
              border: `2px solid ${ACCENT}`,
              borderRadius: 2,
              cursor: `${c}-resize`,
              zIndex: 10,
              ...(c.includes("n") ? { top: -5 } : { bottom: -5 }),
              ...(c.includes("w") ? { left: -5 } : { right: -5 }),
            }}
          />
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Selectable wrapper — fixed position, click to select (no drag / resize)
───────────────────────────────────────────────────────────────────── */
function Selectable({ id, editMode, selected, onSelect, style, children }) {
  const isSelected = editMode && selected === id;
  return (
    <div
      style={{
        ...style,
        cursor: editMode ? "pointer" : "default",
        outline: isSelected
          ? `2px solid ${ACCENT}`
          : editMode ? "1px dashed rgba(56,120,190,0.35)" : "none",
        outlineOffset: isSelected ? 2 : 1,
      }}
      onMouseDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Editable front face
───────────────────────────────────────────────────────────────────── */
function EditableFront({ pastor, layout: L, onUpdate, editMode, selected, onSelect, templateId, scale }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const th = THEMES[templateId] ?? THEMES.elite;
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";
  const headerFs = growOnlySize(L, "headerText");
  const footerFs = growOnlySize(L, "footerText");
  // two lines (line-height 1.5 + 1.4, 1.5px gap) + 4px vertical padding + 1px top border
  const footerH = Math.max(FOOTER_H_MIN, Math.ceil(footerFs * 2.9 + 1.5 + 8 + 1));
  const bannerH = hasCountriesBanner(rawTitle) ? Math.round(CARD_W / COUNTRIES_BANNER_RATIO) : 0;
  const wm = L.watermark ?? WATERMARK_DEFAULT;
  const photoScale = clampPhotoScale(L.photo?.scale ?? 1);
  const photoMaxH  = CARD_H - (th.topBarH + th.headerH) - footerH - bannerH;
  // The photo box follows the image's own proportion so portraits are never cropped;
  // wider images keep the default strip width and lose only their sides.
  const { aspect: photoAspect, fadedSrc } = usePhoto(photo, PHOTO_W_DEF / photoMaxH, photoScale < 1);
  const photoBaseW = photoAspect ? Math.min(PHOTO_W_DEF, photoMaxH * photoAspect) : PHOTO_W_DEF;
  const photoW = photoBaseW * photoScale;
  const photoH = photoMaxH * photoScale;
  const photoLeft = CARD_W - photoW;
  const photoTop  = CARD_H - footerH - bannerH - photoH;

  // Right limit for a text block: the photo's edge if the block sits beside it, else the card edge
  const textLimit = (top, height) =>
    (top < photoTop + photoH && top + height > photoTop ? photoLeft + TEXT_INTO_PHOTO : CARD_W - TEXT_RIGHT_MARGIN);

  const nameText = name.toUpperCase() || "NOMBRE PASTOR";
  const nameEl = L.name;
  const nameLayout = layoutName(
    nameText, nameEl, -0.01,
    textLimit(nameEl.y, 2 * nameEl.fontSize * NAME_LINE_HEIGHT) - nameEl.x
  );
  const nameLineH = nameLayout.fontSize * NAME_LINE_HEIGHT;
  // Rule sits under the last line; everything below the name moves down by the extra height
  const ruleTop = nameEl.y + (nameLayout.lines.length - 1) * nameLineH + nameLayout.fontSize * 1.15 + 3;
  const nameShift = Math.max(0, ruleTop - (nameEl.y + nameEl.fontSize * 1.15 + 3));
  const shiftFor = (el) => (el.y > nameEl.y ? nameShift : 0);

  const churchText = (church || "Nombre Iglesia").toUpperCase();
  const churchFs = fitFontSize(
    churchText, L.church,
    textLimit(L.church.y + shiftFor(L.church), L.church.fontSize * 1.3) - L.church.x,
    CHURCH_MIN_SCALE
  );

  // Dragging the photo's top-left corner inward shrinks it (it stays anchored bottom-right)
  const startPhotoResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const onMove = (me) => {
      const dx = (me.clientX - sx) / scale;
      const dy = (me.clientY - sy) / scale;
      const next = photoScale - (dx / photoBaseW + dy / photoMaxH) / 2;
      onUpdate("photo", { ...L.photo, scale: clampPhotoScale(next) });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{
        width: CARD_W, height: CARD_H,
        position: "relative", overflow: "hidden",
        fontFamily: "'Arial', sans-serif",
        background: "#ffffff",
        border: th.cardBorder, borderRadius: 8, boxShadow: th.cardShadow,
      }}
      onMouseDown={() => { if (editMode) onSelect(null); }}
    >
      {th.topBarH > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: th.topBarH, background: th.topBarBg, zIndex: 3 }} />
      )}

      <div style={{
        position: "absolute",
        top: th.topBarH, left: 0, right: 0, height: th.headerH,
        background: th.headerBg,
        display: "flex", alignItems: "center",
        padding: "7px 14px",
        zIndex: 3,
        ...(th.headerBorderBottom ? { borderBottom: th.headerBorderBottom } : {}),
      }}>
        <Selectable id="headerText" editMode={editMode} selected={selected} onSelect={onSelect} style={{ marginLeft: 62 }}>
          <div style={{ fontSize: headerFs, fontWeight: th.headerOrgWeight, color: th.headerOrgColor, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.3, whiteSpace: "nowrap" }}>
            Iglesia Evangélica Pentecostal
          </div>
          <div style={{ fontSize: headerFs * HEADER_SUB_RATIO, color: th.headerSubColor, fontWeight: th.headerSubWeight, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 2, whiteSpace: "nowrap" }}>
            Credencial de Pastor {rawTitle}
          </div>
        </Selectable>
      </div>

      <Deco templateId={templateId} />

      <Draggable id="watermark" el={wm} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} canResize scale={scale} zIndex={1}>
        <div style={{ width: wm.w, height: wm.h, opacity: th.watermarkOpacity, pointerEvents: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      </Draggable>

      <Selectable id="footerText" editMode={editMode} selected={selected} onSelect={onSelect} style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: footerH,
        background: th.footerBg, borderTop: `1px solid ${th.footerBorder}`,
        padding: "4px 14px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        zIndex: 3,
        boxSizing: "border-box",
      }}>
        <div style={{ fontSize: footerFs, color: th.footerMuted, textAlign: "center", lineHeight: 1.5, fontStyle: "italic", whiteSpace: "nowrap" }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: footerFs, color: th.footerVerse, textAlign: "center", marginTop: 1.5, lineHeight: 1.4, whiteSpace: "nowrap" }}>
          &quot;...Id por todo el mundo y predicad el evangelio a toda criatura.&quot; S. Marcos 16:15
        </div>
      </Selectable>

      {bannerH > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={COUNTRIES_BANNER_SRC} alt="Países IEP" style={{
          position: "absolute", bottom: footerH, left: 0,
          width: CARD_W, height: bannerH,
          display: "block", zIndex: 3,
        }} />
      )}

      {/* ── Draggable elements ── */}

      <Draggable id="logo" el={L.logo} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} canResize scale={scale}>
        <div style={{
          width: L.logo.w, height: L.logo.h, borderRadius: "50%",
          background: th.logoBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          ...(th.logoBorder ? { border: `1.5px solid ${th.logoBorder}` } : {}),
          ...(th.logoShadow ? { boxShadow: th.logoShadow } : {}),
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="IEP" style={{ width: L.logo.w - 6, height: L.logo.h - 6, objectFit: "contain" }} />
        </div>
      </Draggable>

      {/* ── Static photo strip ──
          The photo fades out toward its left edge with a mask (not a white overlay), so
          anything behind it — like the big logo — stays visible through the fade. */}
      <Selectable id="photo" editMode={editMode} selected={selected} onSelect={onSelect} style={{
        position: "absolute",
        right: 0,
        bottom: footerH + bannerH,
        width: photoW,
        height: photoH,
        zIndex: 2,
        overflow: "hidden",
      }}>
        {editMode && selected === "photo" && (
          <div
            onMouseDown={startPhotoResize}
            title="Arrastra para achicar la foto"
            style={{
              position: "absolute", top: 0, left: 0, zIndex: 10,
              width: 12, height: 12,
              background: "#fff", border: `2px solid ${ACCENT}`, borderRadius: 2,
              cursor: "nwse-resize",
            }}
          />
        )}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fadedSrc ?? photo} alt={name} style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
            // Fallback while the baked image isn't ready (or couldn't be made): CSS mask, screen only
            ...(fadedSrc ? {} : photoScale < 1
              ? {
                  WebkitMaskImage: PHOTO_FADE_MASK_SHRUNK, maskImage: PHOTO_FADE_MASK_SHRUNK,
                  WebkitMaskComposite: "source-in", maskComposite: "intersect", // both fades apply
                }
              : { WebkitMaskImage: PHOTO_FADE_MASK, maskImage: PHOTO_FADE_MASK }),
          }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span style={{ fontSize: 8, color: "rgba(0,0,0,0.3)", textTransform: "uppercase" }}>Foto</span>
          </div>
        )}
      </Selectable>

      <Draggable id="name" el={L.name} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: nameLayout.fontSize, fontWeight: L.name.fontWeight, fontFamily: L.name.fontFamily, color: th.dark, lineHeight: NAME_LINE_HEIGHT, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {nameLayout.lines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </Draggable>

      <div style={{
        position: "absolute",
        left: L.name.x, top: ruleTop,
        width: 50, height: 3, borderRadius: 2,
        background: th.ruleGrad,
        zIndex: 2, pointerEvents: "none",
      }} />

      <Draggable id="doc" el={L.doc} offsetY={shiftFor(L.doc)} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: L.doc.fontSize, fontWeight: L.doc.fontWeight, fontFamily: L.doc.fontFamily, color: th.dark, whiteSpace: "nowrap" }}>
          {doc || "Nº Documento"}
        </div>
      </Draggable>

      <Draggable id="title" el={L.title} offsetY={shiftFor(L.title)} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{
          display: "inline-flex",
          background: th.badgeBg,
          ...(th.badgeBorder ? { border: `1px solid ${th.badgeBorder}` } : {}),
          borderRadius: 3, padding: "2px 8px",
        }}>
          <span style={{ fontSize: L.title.fontSize, fontWeight: L.title.fontWeight, fontFamily: L.title.fontFamily, color: th.badgeColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {displayTitle}
          </span>
        </div>
      </Draggable>

      <Draggable id="church" el={L.church} offsetY={shiftFor(L.church)} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: churchFs, fontWeight: L.church.fontWeight, fontFamily: L.church.fontFamily, color: th.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {church || "Nombre Iglesia"}
        </div>
      </Draggable>

      <Draggable id="country" el={L.country} offsetY={shiftFor(L.country)} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {country.code && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={country.name}
              style={{ width: 24, height: "auto", borderRadius: 2, border: "0.5px solid #e2e8f0", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: L.country.fontSize, fontFamily: L.country.fontFamily, color: th.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {country.name || "País"}
          </span>
        </div>
      </Draggable>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Editable back face
───────────────────────────────────────────────────────────────────── */
function EditableBack({ pastor, backLayout: L, superintendent, signatureUrl, onUpdate, editMode, selected, onSelect, templateId, scale }) {
  const { doc, expiry } = parsePastor(pastor);
  const th = THEMES[templateId] ?? THEMES.elite;
  const barcodeRef = useRef(null);
  const isAzul = templateId === "elite-azul";
  const topH = isAzul ? 6 : 5;

  useEffect(() => {
    if (!barcodeRef.current || !doc) return;
    try {
      JsBarcode(barcodeRef.current, doc, {
        format: "CODE128", displayValue: false,
        width: 1.8, height: 42, margin: 0,
        background: "#ffffff", lineColor: th.dark,
      });
    } catch { /* invalid chars */ }
  }, [doc, th.dark]);

  return (
    <div
      style={{
        width: CARD_W, height: CARD_H,
        position: "relative", overflow: "hidden",
        fontFamily: "'Arial', sans-serif",
        background: "#ffffff",
        border: th.cardBorder, borderRadius: 8, boxShadow: th.cardShadow,
      }}
      onMouseDown={() => { if (editMode) onSelect(null); }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: topH,
        background: isAzul
          ? `linear-gradient(90deg,${ACCENT} 0%,#2d6eb0 60%,#b8d4f0 100%)`
          : th.topBarBg,
        zIndex: 3,
      }} />

      <Deco templateId={templateId} />

      {/* Watermark */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 200, height: 200, opacity: th.backWatermarkOpacity,
        pointerEvents: "none", zIndex: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      {/* ── Draggable back elements ── */}

      {/* Legal text */}
      <Draggable id="legalText" el={L.legalText} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ width: L.legalText.w }}>
          <p style={{
            fontSize: L.legalText.fontSize,
            fontWeight: L.legalText.fontWeight,
            fontFamily: L.legalText.fontFamily,
            lineHeight: 1.75, textAlign: "justify",
            color: th.dark, margin: 0, textTransform: "uppercase",
          }}>
            El Superintendente, acredita que la persona identificada en esta
            credencial reviste la calidad de Pastor en la Iglesia Evangélica
            Pentecostal, Personalidad Jurídica Nº 14 de Derecho Público, conforme
            a la Ley Nº 19.638. Se extiende la presente credencial para ser
            reconocido ante las autoridades de gobierno, hospitales, centros de
            reclusión y donde sea necesario.
          </p>
          <p style={{ fontSize: 10.5, marginTop: 10, color: th.muted, textTransform: "uppercase", fontWeight: 600, marginBottom: 0 }}>
            Esta tarjeta es personal e intransferible
          </p>
        </div>
      </Draggable>

      {/* Expiry block */}
      <Draggable id="expiryBlock" el={L.expiryBlock} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Fecha de vencimiento
          </div>
          <div style={{ width: 90, height: 2, background: th.ruleGrad, borderRadius: 1, marginTop: 3, marginBottom: 4 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: th.dark }}>{formatExpiry(expiry) || "—"}</div>
        </div>
      </Draggable>

      {/* Signature block */}
      <Draggable id="signatureBlock" el={L.signatureBlock} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ textAlign: "center" }}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="firma" style={{ height: 32, width: "auto", display: "block", margin: "0 auto 3px" }} />
          )}
          <div style={{ width: 140, height: 1.5, background: `${th.dark}40`, marginBottom: 3 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: th.dark, textTransform: "uppercase" }}>
            {superintendent || "Superintendente"}
          </div>
          <div style={{ fontSize: 9, color: th.muted, textTransform: "uppercase" }}>Superintendente</div>
        </div>
      </Draggable>

      {/* Barcode */}
      <Draggable id="barcode" el={L.barcode} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} canResize scale={scale}>
        <div style={{
          width: "100%", height: "100%",
          background: th.barcodeBoxBg, border: `1px solid ${th.barcodeBoxBorder}`,
          borderRadius: 4, padding: "5px 8px",
          display: "flex", justifyContent: "center", alignItems: "center",
        }}>
          {doc
            ? <svg ref={barcodeRef} style={{ maxWidth: "100%", display: "block" }} />
            : <div style={{ display: "flex", alignItems: "center", color: "#94a3b8", fontSize: 9 }}>Sin documento registrado</div>
          }
        </div>
      </Draggable>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Main component
   - printMode:          front + back (PrintCard wrappers, no handles)
   - editMode + "front": EditableFront with handles
   - editMode + "back":  EditableBack with handles
   - preview:            EditableFront + EditableBack (no handles)
───────────────────────────────────────────────────────────────────── */
export default function CredentialEditorCanvas({
  pastor,
  superintendent,
  signatureUrl,
  templateId = "elite",
  layout,
  backLayout,
  onUpdate,
  onBackUpdate,
  editMode = false,
  editFace = "front",
  selected,
  onSelect,
  printMode = false,
  scale = 1,
}) {
  if (!pastor) return null;

  if (printMode) {
    return (
      <>
        <PrintCard>
          <EditableFront
            pastor={pastor} layout={layout}
            onUpdate={() => {}} editMode={false} selected={null} onSelect={() => {}}
            templateId={templateId} scale={0.5}
          />
        </PrintCard>
        <PrintCard>
          <EditableBack
            pastor={pastor} backLayout={backLayout}
            superintendent={superintendent} signatureUrl={signatureUrl}
            onUpdate={() => {}} editMode={false} selected={null} onSelect={() => {}}
            templateId={templateId} scale={0.5}
          />
        </PrintCard>
      </>
    );
  }

  if (editMode) {
    if (editFace === "back") {
      return (
        <EditableBack
          pastor={pastor} backLayout={backLayout}
          superintendent={superintendent} signatureUrl={signatureUrl}
          onUpdate={onBackUpdate} editMode selected={selected} onSelect={onSelect}
          templateId={templateId} scale={scale}
        />
      );
    }
    return (
      <EditableFront
        pastor={pastor} layout={layout}
        onUpdate={onUpdate} editMode selected={selected} onSelect={onSelect}
        templateId={templateId} scale={scale}
      />
    );
  }

  // Preview mode: front + back, no handles
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <EditableFront
        pastor={pastor} layout={layout}
        onUpdate={() => {}} editMode={false} selected={null} onSelect={() => {}}
        templateId={templateId} scale={scale}
      />
      <EditableBack
        pastor={pastor} backLayout={backLayout}
        superintendent={superintendent} signatureUrl={signatureUrl}
        onUpdate={() => {}} editMode={false} selected={null} onSelect={() => {}}
        templateId={templateId} scale={scale}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Controls panel (sidebar) — shared for front and back faces
───────────────────────────────────────────────────────────────────── */
const FRONT_ELEMENT_LABELS = {
  logo:    "Logo",
  name:    "Nombre",
  doc:     "Documento",
  title:   "Título",
  church:  "Iglesia",
  country: "País",
  headerText: "Encabezado",
  footerText: "Pie",
  watermark:  "Logo grande",
  photo:      "Foto",
};

const BACK_ELEMENT_LABELS = {
  legalText:      "Texto legal",
  expiryBlock:    "Vencimiento",
  signatureBlock: "Firma",
  barcode:        "Código barras",
};

const FRONT_TEXT_KEYS = ["name", "doc", "title", "church", "country"];
const BACK_TEXT_KEYS  = ["legalText"];

const FONT_OPTIONS = [
  { label: "Arial",           value: "Arial, sans-serif" },
  { label: "Georgia",         value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Verdana",         value: "Verdana, sans-serif" },
  { label: "Trebuchet MS",    value: '"Trebuchet MS", sans-serif' },
  { label: "Courier New",     value: '"Courier New", monospace' },
];

export function CredentialControlPanel({ selected, layout, onUpdate, onSelect, onResetElement, onResetAll, face = "front" }) {
  const elementLabels = face === "front" ? FRONT_ELEMENT_LABELS : BACK_ELEMENT_LABELS;
  const textKeys      = face === "front" ? FRONT_TEXT_KEYS      : BACK_TEXT_KEYS;

  const el = selected ? layout[selected] : null;
  const isText = textKeys.includes(selected);
  const hasExplicitSize = el?.w !== undefined && el?.h !== undefined;
  const growOnly = face === "front" ? GROW_ONLY_LIMITS[selected] : null;

  function patch(key, value) {
    onUpdate(selected, { ...el, [key]: value });
  }

  return (
    <div className="space-y-3">
      {/* Element picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Elemento</span>
          <button onClick={onResetAll} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
            Restablecer todo
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {Object.entries(elementLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`text-xs px-1 py-1.5 rounded-lg border transition-colors text-center truncate ${
                selected === key
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {selected && (
          <button onClick={() => onResetElement(selected)} className="text-xs text-brand-600 hover:text-brand-800 transition-colors">
            ↺ Restablecer &quot;{elementLabels[selected]}&quot;
          </button>
        )}
      </div>

      {face === "front" && selected === "photo" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamaño</span>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-500">Tamaño de la foto</label>
              <span className="text-xs font-medium text-slate-700">{Math.round(clampPhotoScale(el?.scale ?? 1) * 100)}%</span>
            </div>
            <input
              type="range" min={PHOTO_SCALE_MIN} max="1" step="0.01"
              value={clampPhotoScale(el?.scale ?? 1)}
              onChange={e => patch("scale", clampPhotoScale(Number(e.target.value)))}
              className="w-full accent-brand-600"
            />
          </div>
          <p className="text-[11px] text-slate-400">Solo se puede achicar. La foto se mantiene abajo a la derecha. También puedes arrastrar su esquina superior izquierda.</p>
        </div>
      ) : growOnly ? (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipografía</span>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-500">Tamaño</label>
              <span className="text-xs font-medium text-slate-700">{growOnlySize(layout, selected)}px</span>
            </div>
            <input
              type="range" min={growOnly.min} max={growOnly.max} step="0.5"
              value={growOnlySize(layout, selected)}
              onChange={e => patch("fontSize", Math.max(growOnly.min, Number(e.target.value)))}
              className="w-full accent-brand-600"
            />
          </div>
          <p className="text-[11px] text-slate-400">Solo se puede agrandar desde el tamaño original.</p>
        </div>
      ) : el ? (
        <>
          {/* Position */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Posición</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">X (px)</label>
                <input
                  type="number" value={Math.round(el.x)}
                  onChange={e => patch("x", Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Y (px)</label>
                <input
                  type="number" value={Math.round(el.y)}
                  onChange={e => patch("y", Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          </div>

          {/* Size (photo, logo, barcode) */}
          {hasExplicitSize && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamaño</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ancho (px)</label>
                  <input
                    type="number" value={Math.round(el.w)}
                    onChange={e => patch("w", Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Alto (px)</label>
                  <input
                    type="number" value={Math.round(el.h)}
                    onChange={e => patch("h", Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Typography */}
          {isText && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipografía</span>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-slate-500">Tamaño</label>
                  <span className="text-xs font-medium text-slate-700">{el.fontSize}px</span>
                </div>
                <input
                  type="range" min="6" max="42" step="0.5"
                  value={el.fontSize}
                  onChange={e => patch("fontSize", Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Peso</label>
                <div className="flex gap-1">
                  {[300, 400, 600, 700, 900].map(w => (
                    <button
                      key={w}
                      onClick={() => patch("fontWeight", w)}
                      className={`flex-1 text-xs py-1 rounded border transition-colors ${
                        el.fontWeight === w
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                      style={{ fontWeight: w }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Fuente</label>
                <select
                  value={el.fontFamily}
                  onChange={e => patch("fontFamily", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400">
          Haz clic en un elemento de la credencial para editar sus propiedades
        </div>
      )}
    </div>
  );
}
