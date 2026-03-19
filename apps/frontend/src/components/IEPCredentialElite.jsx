"use client";
/**
 * IEP Elite — Template 3
 *
 * Fondo blanco con geometría bold. División diagonal entre zona blanca (datos)
 * y zona azul (foto). Tipografía grande y aireada, líneas de acento, gran círculo
 * geométrico decorativo. Moderno, disruptivo, profesional.
 */
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PrintCard,
  PRESBYTER_COUNTRIES, formatExpiry, parsePastor, isPresbitero,
} from "@/lib/credentialShared";

const BG      = "#ffffff";
const ACCENT  = BRAND_BLUE;          // #3878be
const LIGHT   = "#ddeaf8";           // very light blue tint
const DARK    = "#0d1b2a";           // deep navy for text
const MUTED   = "#64748b";
const PHOTO_W = Math.round(CARD_W * 0.40);  // right photo strip width

/* ────────────────────────────────────────────────────────────
   Shared SVG decoration layer (geometric arcs + lines)
──────────────────────────────────────────────────────────── */
function Deco() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      width={CARD_W} height={CARD_H}
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      fill="none"
    >
      {/* Large background circles — bottom-left decorative */}
      <circle cx="-10" cy={CARD_H + 10} r="170" stroke={ACCENT} strokeWidth="1.2" strokeOpacity="0.18" />
      <circle cx="-10" cy={CARD_H + 10} r="130" stroke={ACCENT} strokeWidth="0.7" strokeOpacity="0.12" />

      {/* Small accent circle — top-right */}
      <circle cx={CARD_W - PHOTO_W / 2} cy="0" r="60" fill={ACCENT} fillOpacity="0.06" />

      {/* Dot grid — bottom-left */}
      {[0,1,2,3].map((col) =>
        [0,1,2].map((row) => (
          <circle
            key={`d-${col}-${row}`}
            cx={18 + col * 14}
            cy={CARD_H - 28 + row * 11}
            r="1.3"
            fill={ACCENT}
            fillOpacity="0.3"
          />
        ))
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────── */
function EliteFront({ pastor }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      background: BG,
      border: "1px solid #dbe4ef",
      borderRadius: 8,
      boxShadow: "0 8px 32px rgba(30,60,110,0.14)",
      position: "relative",
    }}>
      {/* ── Bold top accent bar ── */}
      <div style={{
        height: 5, flexShrink: 0,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #5fa0e8 70%, ${LIGHT} 100%)`,
        position: "relative", zIndex: 3,
      }} />

      {/* ── SVG decorations (behind content) ── */}
      <Deco />

      {/* ── Header row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 14px 5px",
        flexShrink: 0, position: "relative", zIndex: 2,
      }}>
        {/* Logo in light-blue circle */}
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: LIGHT,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
          border: `1.5px solid ${ACCENT}40`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="IEP" style={{ width: 42, height: 42, objectFit: "contain" }} />
        </div>

        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: DARK, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Iglesia Evangélica Pentecostal
          </div>
          <div style={{ fontSize: 7.5, color: ACCENT, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 1 }}>
            Credencial de Pastor {rawTitle}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Watermark in data zone */}
        <div style={{
          position: "absolute", top: "50%", left: "30%",
          transform: "translate(-50%, -50%)",
          width: 160, height: 160, opacity: 0.18,
          pointerEvents: "none", zIndex: 1,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        {/* Left: data */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "10px 10px 10px 18px",
          position: "relative", zIndex: 2, gap: 3,
        }}>
          {/* Name */}
          <div style={{ fontSize: 22, fontWeight: 900, color: DARK, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {name.toUpperCase()}
          </div>

          {/* Gradient rule */}
          <div style={{
            width: 50, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, ${ACCENT}, ${LIGHT})`,
            margin: "4px 0 6px",
          }} />

          {/* Document */}
          <div style={{ fontSize: 14, color: DARK, fontWeight: 600 }}>{doc}</div>

          {/* Title badge */}
          <div style={{
            display: "inline-flex", alignSelf: "flex-start",
            marginTop: 4,
            background: LIGHT,
            border: `1px solid ${ACCENT}50`,
            borderRadius: 3,
            padding: "2px 8px",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {displayTitle}
            </span>
          </div>

          {/* Church */}
          <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", marginTop: 3 }}>{church}</div>

          {/* Country + flag */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            {country.code && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={country.name}
                style={{ width: 24, height: "auto", borderRadius: 2, border: "0.5px solid #e2e8f0", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, color: MUTED, textTransform: "uppercase" }}>{country.name}</span>
          </div>
        </div>

        {/* Right: photo strip */}
        <div style={{
          width: PHOTO_W, flexShrink: 0,
          background: BG,
          overflow: "hidden", position: "relative", zIndex: 2,
        }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "top center", display: "block",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
                maskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 6,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Foto</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Presbítero flag banner ── */}
      {isPresbitero(rawTitle) && (
        <div style={{
          background: LIGHT, borderTop: `1px solid ${ACCENT}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 3, padding: "5px 8px",
          flexShrink: 0, flexWrap: "nowrap", overflow: "hidden",
          position: "relative", zIndex: 2,
        }}>
          {PRESBYTER_COUNTRIES.map((code) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={code} src={`https://flagcdn.com/w160/${code}.png`} alt={code}
              style={{ height: 20, width: "auto", borderRadius: 2,
                border: "0.5px solid #c8d8ee", flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* ── Legal footer ── */}
      <div style={{
        background: "#f5f8fd",
        borderTop: `1px solid #dde8f5`,
        padding: "4px 14px", flexShrink: 0,
        position: "relative", zIndex: 2,
      }}>
        <div style={{ fontSize: 6.5, color: MUTED, textAlign: "center", lineHeight: 1.5, fontStyle: "italic" }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: 6.5, color: "#8fa5be", textAlign: "center", marginTop: 1.5, lineHeight: 1.4 }}>
          "...Id por todo el mundo y predicad el evangelio a toda criatura." S. Marcos 16:15
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
function EliteBack({ pastor, superintendent, signatureUrl }) {
  const barcodeRef = useRef(null);
  const { doc, expiry } = parsePastor(pastor);

  useEffect(() => {
    if (!barcodeRef.current || !doc) return;
    try {
      JsBarcode(barcodeRef.current, doc, {
        format: "CODE128", displayValue: false,
        width: 1.8, height: 42, margin: 0,
        background: "#ffffff", lineColor: DARK,
      });
    } catch { /* invalid chars */ }
  }, [doc]);

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      background: BG,
      border: "1px solid #dbe4ef",
      borderRadius: 8,
      boxShadow: "0 8px 32px rgba(30,60,110,0.14)",
      position: "relative",
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 5, flexShrink: 0,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #5fa0e8 70%, ${LIGHT} 100%)`,
        position: "relative", zIndex: 3,
      }} />

      <Deco />

      {/* Watermark — centered */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 200, height: 200, opacity: 0.18,
        pointerEvents: "none", zIndex: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      {/* Legal text */}
      <div style={{
        flex: 1, padding: "18px 22px 6px",
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <p style={{
          fontSize: 11.5, lineHeight: 1.75, textAlign: "justify",
          color: DARK, margin: 0, textTransform: "uppercase",
        }}>
          El Superintendente, acredita que la persona identificada en esta
          credencial reviste la calidad de Pastor en la Iglesia Evangélica
          Pentecostal, Personalidad Jurídica Nº 14 de Derecho Público, conforme
          a la Ley Nº 19.638. Se extiende la presente credencial para ser
          reconocido ante las autoridades de gobierno, hospitales, centros de
          reclusión y donde sea necesario.
        </p>
        <p style={{ fontSize: 10.5, marginTop: 10, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>
          Esta tarjeta es personal e intransferible
        </p>
      </div>

      {/* Expiry + Signature */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        padding: "0 20px 8px", position: "relative", zIndex: 2,
      }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Fecha de vencimiento
          </div>
          <div style={{ width: 90, height: 2, background: `linear-gradient(90deg, ${ACCENT}, ${LIGHT})`, borderRadius: 1, marginTop: 3, marginBottom: 4 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{formatExpiry(expiry) || "—"}</div>
        </div>

        <div style={{ textAlign: "center" }}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="firma"
              style={{ height: 32, width: "auto", display: "block", margin: "0 auto 3px" }} />
          )}
          <div style={{ width: 140, height: 1.5, background: `${DARK}40`, marginBottom: 3 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: DARK, textTransform: "uppercase" }}>
            {superintendent || "Superintendente"}
          </div>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase" }}>Superintendente</div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{
        margin: "0 14px 10px",
        background: "#f5f8fd",
        border: `1px solid ${ACCENT}30`,
        borderRadius: 4, padding: "5px 8px",
        display: "flex", justifyContent: "center", alignItems: "center",
        position: "relative", zIndex: 2, flexShrink: 0,
      }}>
        {doc
          ? <svg ref={barcodeRef} style={{ maxWidth: "100%", display: "block" }} />
          : <div style={{ height: 44, display: "flex", alignItems: "center", color: "#94a3b8", fontSize: 9 }}>
              Sin documento registrado
            </div>
        }
      </div>
    </div>
  );
}

/* ── Public export ── */
export default function IEPCredentialElite({ pastor, superintendent, signatureUrl, printMode = false }) {
  if (!pastor) return null;

  if (printMode) {
    return (
      <>
        <PrintCard><EliteFront pastor={pastor} /></PrintCard>
        <PrintCard>
          <EliteBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
        </PrintCard>
      </>
    );
  }

  return (
    <div className="iep-credential-wrapper" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <EliteFront pastor={pastor} />
      <EliteBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
    </div>
  );
}
