"use client";
/**
 * IEP Moderno — Template 2
 *
 * Layout: photo ocupa el lado derecho de borde a borde (43% del ancho).
 * Izquierda: fondo blanco con acento azul izquierdo + tipografía limpia.
 * Header: delgada franja azul con logo + nombre institución.
 * Reverso: columna única, acento azul superior, código de barras ancho.
 */
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PRINT_W, PRINT_H,
  PRESBYTER_COUNTRIES, PrintCard,
  formatExpiry, parsePastor, isPresbitero,
} from "@/lib/credentialShared";

const ACCENT = BRAND_BLUE;
const DARK   = "#0f172a";
const MID    = "#334155";

/* ── Front ── */
function ModernFront({ pastor }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";

  const photoW = Math.round(CARD_W * 0.43);

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      border: "1px solid #d1d5db", borderRadius: 6,
      boxShadow: "0 6px 24px rgba(0,0,0,0.16)",
      background: "#fff",
    }}>
      {/* ── Top header strip ── */}
      <div style={{
        background: ACCENT,
        display: "flex", alignItems: "center", gap: 10,
        padding: "5px 12px", flexShrink: 0,
      }}>
        {/* Logo circle */}
        <div style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "#fff", flexShrink: 0, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="IEP" style={{ width: 42, height: 42, objectFit: "contain" }} />
        </div>
        {/* Text */}
        <div>
          <div style={{ color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Iglesia Evangélica Pentecostal
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Credencial de Pastor {rawTitle}
          </div>
        </div>
      </div>

      {/* ── Body: left data + right photo ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Left: data panel */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "12px 14px 10px 0",
          position: "relative",
          borderRight: `4px solid ${ACCENT}`,
        }}>
          {/* Watermark */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-40%, -50%)",
            width: 140, height: 140, opacity: 0.18,
            pointerEvents: "none", zIndex: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, paddingLeft: 16 }}>
            {/* Name */}
            <div style={{ fontSize: 21, fontWeight: 800, color: DARK, lineHeight: 1.15, marginBottom: 6 }}>
              {name.toUpperCase()}
            </div>

            {/* Blue accent rule */}
            <div style={{ width: 48, height: 2.5, background: ACCENT, borderRadius: 2, marginBottom: 9 }} />

            {/* Document */}
            <div style={{ fontSize: 14, fontWeight: 600, color: MID, marginBottom: 9 }}>{doc}</div>

            {/* Title */}
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 5 }}>
              {displayTitle}
            </div>

            {/* Church */}
            <div style={{ fontSize: 12, color: MID, textTransform: "uppercase", marginBottom: 6 }}>{church}</div>

            {/* Country + flag */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {country.code && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/w160/${country.code}.png`}
                  alt={country.name}
                  style={{ width: 26, height: "auto", borderRadius: 2, border: "0.5px solid #e2e8f0", flexShrink: 0 }}
                />
              )}
              <span style={{ fontSize: 12, color: MID, textTransform: "uppercase" }}>{country.name}</span>
            </div>
          </div>
        </div>

        {/* Right: photo — edge to edge, full height */}
        <div style={{ width: photoW, flexShrink: 0, background: "#cbd5e1", overflow: "hidden", position: "relative" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 6, color: "#94a3b8", fontSize: 9,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              FOTO
            </div>
          )}
          {/* Gradient overlay for elegance */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
            background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)",
          }} />
        </div>
      </div>

      {/* ── Presbítero flag banner ── */}
      {isPresbitero(rawTitle) && (
        <div style={{
          background: ACCENT, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 3, padding: "5px 8px",
          flexShrink: 0, flexWrap: "nowrap", overflow: "hidden",
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
        borderTop: `2px solid ${ACCENT}`,
        background: "#f8fafc", padding: "4px 14px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 6.5, color: "#64748b", textAlign: "center", lineHeight: 1.5, fontStyle: "italic" }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: 6.5, color: "#475569", textAlign: "center", marginTop: 1.5, lineHeight: 1.4 }}>
          "...Id por todo el mundo y predicad el evangelio a toda criatura." S. Marcos 16:15
        </div>
      </div>
    </div>
  );
}

/* ── Back ── */
function ModernBack({ pastor, superintendent, signatureUrl }) {
  const barcodeRef = useRef(null);
  const { doc, expiry } = parsePastor(pastor);

  useEffect(() => {
    if (!barcodeRef.current || !doc) return;
    try {
      JsBarcode(barcodeRef.current, doc, {
        format: "CODE128", displayValue: false,
        width: 1.8, height: 44, margin: 0,
        background: "#fff", lineColor: "#0f172a",
      });
    } catch { /* invalid chars */ }
  }, [doc]);

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      background: "#fff", border: "1px solid #d1d5db",
      borderRadius: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.16)",
      position: "relative",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 6, background: ACCENT, flexShrink: 0 }} />

      {/* Watermark */}
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
        flex: 1, padding: "18px 22px 8px",
        position: "relative", zIndex: 1,
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
        <p style={{ fontSize: 10.5, marginTop: 10, color: MID, textTransform: "uppercase", fontWeight: 600 }}>
          Esta tarjeta es personal e intransferible
        </p>
      </div>

      {/* Expiry + Signature row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        padding: "0 22px 10px", position: "relative", zIndex: 1,
      }}>
        {/* Expiry */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Fecha de vencimiento
          </div>
          <div style={{ width: 90, height: 1.5, background: ACCENT, borderRadius: 1, marginTop: 3, marginBottom: 4 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>
            {formatExpiry(expiry) || "—"}
          </div>
        </div>

        {/* Signature */}
        <div style={{ textAlign: "center" }}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="firma"
              style={{ height: 32, width: "auto", display: "block", margin: "0 auto 3px" }} />
          )}
          <div style={{ width: 140, height: 1.5, background: DARK, marginBottom: 3 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: DARK, textTransform: "uppercase" }}>
            {superintendent || "Superintendente"}
          </div>
          <div style={{ fontSize: 9, color: MID, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Superintendente
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{
        borderTop: `2px solid ${ACCENT}`,
        padding: "5px 14px 6px",
        display: "flex", justifyContent: "center", alignItems: "center",
        background: "#f8fafc", position: "relative", zIndex: 1, flexShrink: 0,
      }}>
        {doc
          ? <svg ref={barcodeRef} style={{ maxWidth: "100%" }} />
          : <div style={{ height: 48, display: "flex", alignItems: "center", color: "#94a3b8", fontSize: 9 }}>
              Sin documento registrado
            </div>
        }
      </div>
    </div>
  );
}

/* ── Public export ── */
export default function IEPCredentialModern({ pastor, superintendent, signatureUrl, printMode = false }) {
  if (!pastor) return null;

  if (printMode) {
    return (
      <>
        <PrintCard><ModernFront pastor={pastor} /></PrintCard>
        <PrintCard>
          <ModernBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
        </PrintCard>
      </>
    );
  }

  return (
    <div className="iep-credential-wrapper" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ModernFront pastor={pastor} />
      <ModernBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
    </div>
  );
}
