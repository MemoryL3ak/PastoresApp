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
import { useEffect, useRef } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PrintCard,
  PRESBYTER_COUNTRIES, formatExpiry, parsePastor, isPresbitero,
} from "@/lib/credentialShared";

const ACCENT = BRAND_BLUE;
const PHOTO_W_DEF = Math.round(CARD_W * 0.40); // 259

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
    presbyterBg: "#ddeaf8",
    presbyterBorderTop: `1px solid ${ACCENT}40`,
    presbyterImgBorder: "0.5px solid #c8d8ee",
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
    presbyterBg: ACCENT,
    presbyterBorderTop: "1px solid #2a5e9e",
    presbyterImgBorder: "0.5px solid rgba(255,255,255,0.35)",
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
function Draggable({ id, el, onUpdate, editMode, selected, onSelect, canResize = false, scale = 1, children }) {
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
        left: el.x, top: el.y,
        ...(el.w !== undefined ? { width: el.w } : {}),
        ...(el.h !== undefined ? { height: el.h } : {}),
        cursor: editMode ? "move" : "default",
        outline: isSelected
          ? `2px solid ${ACCENT}`
          : editMode ? "1px dashed rgba(56,120,190,0.35)" : "none",
        outlineOffset: isSelected ? 2 : 1,
        zIndex: isSelected ? 6 : 4,
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
   Editable front face
───────────────────────────────────────────────────────────────────── */
function EditableFront({ pastor, layout: L, onUpdate, editMode, selected, onSelect, templateId, scale }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const th = THEMES[templateId] ?? THEMES.elite;
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";

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
        <div style={{ marginLeft: 62 }}>
          <div style={{ fontSize: 10.5, fontWeight: th.headerOrgWeight, color: th.headerOrgColor, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.3 }}>
            Iglesia Evangélica Pentecostal
          </div>
          <div style={{ fontSize: 8, color: th.headerSubColor, fontWeight: th.headerSubWeight, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 2 }}>
            Credencial de Pastor {rawTitle}
          </div>
        </div>
      </div>

      <Deco templateId={templateId} />

      <div style={{
        position: "absolute", top: "50%", left: "30%",
        transform: "translate(-50%,-50%)",
        width: 160, height: 160, opacity: th.watermarkOpacity,
        pointerEvents: "none", zIndex: 1,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
        background: th.footerBg, borderTop: `1px solid ${th.footerBorder}`,
        padding: "4px 14px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        zIndex: 3,
      }}>
        <div style={{ fontSize: 6.5, color: th.footerMuted, textAlign: "center", lineHeight: 1.5, fontStyle: "italic" }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: 6.5, color: th.footerVerse, textAlign: "center", marginTop: 1.5, lineHeight: 1.4 }}>
          &quot;...Id por todo el mundo y predicad el evangelio a toda criatura.&quot; S. Marcos 16:15
        </div>
      </div>

      {isPresbitero(rawTitle) && (
        <div style={{
          position: "absolute", bottom: 32, left: 0, right: 0,
          background: th.presbyterBg, borderTop: th.presbyterBorderTop,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 3, padding: "5px 8px", zIndex: 3,
          flexWrap: "nowrap", overflow: "hidden",
        }}>
          {PRESBYTER_COUNTRIES.map(code => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={code} src={`https://flagcdn.com/w160/${code}.png`} alt={code}
              style={{ height: 20, width: "auto", borderRadius: 2, border: th.presbyterImgBorder, flexShrink: 0 }} />
          ))}
        </div>
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

      {/* ── Static photo strip — extends 40px left to eliminate hard boundary ── */}
      <div style={{
        position: "absolute",
        top: th.topBarH + th.headerH,
        left: CARD_W - PHOTO_W_DEF - 40,
        right: 0,
        bottom: 32,
        zIndex: 2,
        overflow: "hidden",
      }}>
        {photo ? (
          <>
            {/* Photo image anchored to the right */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={name} style={{
              position: "absolute",
              right: 0, top: 0, bottom: 0,
              width: PHOTO_W_DEF,
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }} />
            {/* Gradient overlay covering the full div — left 40px is pure white, then fades into photo */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to right, #ffffff 0%, #ffffff 12%, rgba(255,255,255,0) 55%)",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }} />
          </>
        ) : (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: PHOTO_W_DEF, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span style={{ fontSize: 8, color: "rgba(0,0,0,0.3)", textTransform: "uppercase" }}>Foto</span>
          </div>
        )}
      </div>

      <Draggable id="name" el={L.name} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: L.name.fontSize, fontWeight: L.name.fontWeight, fontFamily: L.name.fontFamily, color: th.dark, lineHeight: 1.1, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {name.toUpperCase() || "NOMBRE PASTOR"}
        </div>
      </Draggable>

      <div style={{
        position: "absolute",
        left: L.name.x, top: L.name.y + L.name.fontSize * 1.15 + 3,
        width: 50, height: 3, borderRadius: 2,
        background: th.ruleGrad,
        zIndex: 2, pointerEvents: "none",
      }} />

      <Draggable id="doc" el={L.doc} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: L.doc.fontSize, fontWeight: L.doc.fontWeight, fontFamily: L.doc.fontFamily, color: th.dark, whiteSpace: "nowrap" }}>
          {doc || "Nº Documento"}
        </div>
      </Draggable>

      <Draggable id="title" el={L.title} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
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

      <Draggable id="church" el={L.church} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
        <div style={{ fontSize: L.church.fontSize, fontWeight: L.church.fontWeight, fontFamily: L.church.fontFamily, color: th.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {church || "Nombre Iglesia"}
        </div>
      </Draggable>

      <Draggable id="country" el={L.country} onUpdate={onUpdate} editMode={editMode} selected={selected} onSelect={onSelect} scale={scale}>
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

      {el ? (
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
