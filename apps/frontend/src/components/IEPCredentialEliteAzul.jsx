"use client";
/**
 * IEP Elite Azul — Template 4
 *
 * Variante del Elite con mayor presencia del color celeste institucional.
 * Fondo general azul claro, panel de datos sobre tarjeta blanca elevada,
 * zona de foto con fondo azul sólido, header azul completo estilo premium.
 */
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PrintCard,
  PRESBYTER_COUNTRIES, formatExpiry, parsePastor, isPresbitero,
} from "@/lib/credentialShared";

const ACCENT  = BRAND_BLUE;        // #3878be
const LIGHT   = "#ddeaf8";         // celeste claro
const MID     = "#b8d4f0";         // celeste medio
const BASE    = "#ffffff";         // fondo general
const PHOTO_BG = "#ffffff";        // blanco detrás de la foto (igual que Elite)
const DARK    = "#0d1b2a";
const MUTED   = "#3a5a7c";
const PHOTO_W = Math.round(CARD_W * 0.40);

function Deco() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      width={CARD_W} height={CARD_H}
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      fill="none"
    >
      {/* Large decorative circles — top-right */}
      <circle cx={CARD_W + 20} cy="-20" r="180" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.20" />
      <circle cx={CARD_W + 20} cy="-20" r="130" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.14" />

      {/* Bottom-left arcs */}
      <circle cx="-20" cy={CARD_H + 20} r="140" stroke={ACCENT} strokeWidth="1" strokeOpacity="0.22" />

      {/* Dot grid — bottom-right */}
      {[0,1,2,3].map((col) =>
        [0,1,2].map((row) => (
          <circle
            key={`d-${col}-${row}`}
            cx={CARD_W - 22 - col * 13}
            cy={CARD_H - 24 + row * 10}
            r="1.3"
            fill="#fff"
            fillOpacity="0.35"
          />
        ))
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────── */
function EliteAzulFront({ pastor }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      background: BASE,
      border: "1px solid #a8c8e8",
      borderRadius: 8,
      boxShadow: "0 8px 32px rgba(20,60,120,0.18)",
      position: "relative",
    }}>
      <Deco />

      {/* ── Header — full blue ── */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT} 0%, #2d6eb0 100%)`,
        display: "flex", alignItems: "center", gap: 12,
        padding: "7px 14px", flexShrink: 0,
        position: "relative", zIndex: 3,
        borderBottom: `2px solid ${MID}`,
      }}>
        {/* Logo in white circle */}
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.25)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="IEP" style={{ width: 42, height: 42, objectFit: "contain" }} />
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.3 }}>
            Iglesia Evangélica Pentecostal
          </div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.82)", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 2 }}>
            Credencial de Pastor {rawTitle}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Watermark */}
        <div style={{
          position: "absolute", top: "50%", left: "30%",
          transform: "translate(-50%, -50%)",
          width: 160, height: 160, opacity: 0.28,
          pointerEvents: "none", zIndex: 1,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        {/* Left: white elevated card */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "12px 12px 12px 20px",
          position: "relative", zIndex: 2,
        }}>
          {/* Name */}
          <div style={{ fontSize: 25, fontWeight: 900, color: DARK, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {name.toUpperCase()}
          </div>

          {/* Accent rule */}
          <div style={{
            width: 50, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, ${ACCENT}, ${LIGHT})`,
            margin: "5px 0 7px",
          }} />

          {/* Document */}
          <div style={{ fontSize: 16, color: DARK, fontWeight: 600 }}>{doc}</div>

          {/* Title badge */}
          <div style={{
            display: "inline-flex", alignSelf: "flex-start",
            background: ACCENT,
            borderRadius: 3,
            padding: "2px 9px",
            marginTop: 4,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {displayTitle}
            </span>
          </div>

          {/* Church */}
          <div style={{ fontSize: 13, color: MUTED, textTransform: "uppercase", marginTop: 4 }}>{church}</div>

          {/* Country + flag */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            {country.code && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={country.name}
                style={{ width: 26, height: "auto", borderRadius: 2, border: "0.5px solid #c8daf0", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 13, color: MUTED, textTransform: "uppercase" }}>{country.name}</span>
          </div>
        </div>

        {/* Right: photo strip with solid blue bg */}
        <div style={{
          width: PHOTO_W, flexShrink: 0,
          background: PHOTO_BG,
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
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Foto</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Presbítero flag banner ── */}
      {isPresbitero(rawTitle) && (
        <div style={{
          background: ACCENT, borderTop: `1px solid #2a5e9e`,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 3, padding: "5px 8px",
          flexShrink: 0, flexWrap: "nowrap", overflow: "hidden",
          position: "relative", zIndex: 3,
        }}>
          {PRESBYTER_COUNTRIES.map((code) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={code} src={`https://flagcdn.com/w160/${code}.png`} alt={code}
              style={{ height: 20, width: "auto", borderRadius: 2,
                border: "0.5px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* ── Legal footer ── */}
      <div style={{
        background: MID,
        borderTop: `1px solid #9bbedd`,
        padding: "4px 14px", flexShrink: 0,
        position: "relative", zIndex: 3,
      }}>
        <div style={{ fontSize: 6.5, color: MUTED, textAlign: "center", lineHeight: 1.5, fontStyle: "italic" }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: 6.5, color: "#2e5c8a", textAlign: "center", marginTop: 1.5, lineHeight: 1.4 }}>
          "...Id por todo el mundo y predicad el evangelio a toda criatura." S. Marcos 16:15
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
function EliteAzulBack({ pastor, superintendent, signatureUrl }) {
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
      background: BASE,
      border: "1px solid #a8c8e8",
      borderRadius: 8,
      boxShadow: "0 8px 32px rgba(20,60,120,0.18)",
      position: "relative",
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 6, flexShrink: 0,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #2d6eb0 60%, ${MID} 100%)`,
        position: "relative", zIndex: 3,
      }} />

      <Deco />

      {/* Watermark */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 200, height: 200, opacity: 0.25,
        pointerEvents: "none", zIndex: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      {/* Legal text */}
      <div style={{
        flex: 1, padding: "18px 22px 8px",
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
          <p style={{ fontSize: 10.5, marginTop: 10, color: MUTED, textTransform: "uppercase", fontWeight: 600, marginBottom: 0 }}>
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
          <div style={{ width: 90, height: 2, background: `linear-gradient(90deg, ${ACCENT}, ${MID})`, borderRadius: 1, marginTop: 3, marginBottom: 4 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{formatExpiry(expiry) || "—"}</div>
        </div>

        <div style={{ textAlign: "center" }}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="firma"
              style={{ height: 32, width: "auto", display: "block", margin: "0 auto 3px" }} />
          )}
          <div style={{ width: 140, height: 1.5, background: `${DARK}50`, marginBottom: 3 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: DARK, textTransform: "uppercase" }}>
            {superintendent || "Superintendente"}
          </div>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase" }}>Superintendente</div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{
        margin: "0 14px 10px",
        background: "#fff",
        border: `1px solid ${MID}`,
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
export default function IEPCredentialEliteAzul({ pastor, superintendent, signatureUrl, printMode = false }) {
  if (!pastor) return null;

  if (printMode) {
    return (
      <>
        <PrintCard><EliteAzulFront pastor={pastor} /></PrintCard>
        <PrintCard>
          <EliteAzulBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
        </PrintCard>
      </>
    );
  }

  return (
    <div className="iep-credential-wrapper" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <EliteAzulFront pastor={pastor} />
      <EliteAzulBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
    </div>
  );
}
