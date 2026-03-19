"use client";
/**
 * IEP Clásico — Template 1
 * Diseño tradicional con header azul completo y logo en círculo.
 */
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import {
  BRAND_BLUE, CARD_W, CARD_H, PrintCard,
  PRESBYTER_COUNTRIES, formatExpiry, parsePastor, isPresbitero,
} from "@/lib/credentialShared";

/* ── Watermark ── */
function Watermark({ size }) {
  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%,-50%)",
      width: size, height: size, opacity: 0.13,
      pointerEvents: "none", zIndex: 0,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

/* ── Header ── */
function Header({ rawTitle }) {
  return (
    <div style={{
      background: BRAND_BLUE, padding: "6px 10px",
      display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, overflow: "hidden",
        boxShadow: "0 0 0 2px rgba(255,255,255,0.4)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="IEP" style={{ width: 34, height: 34, objectFit: "contain" }} />
      </div>
      <div style={{ flex: 1, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", lineHeight: 1.3, textTransform: "uppercase" }}>
          Iglesia Evangélica Pentecostal
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.10em", marginTop: 1, lineHeight: 1.3, textTransform: "uppercase" }}>
          Credencial de Pastor {rawTitle || ""}
        </div>
      </div>
      <div style={{ width: 38, height: 38, flexShrink: 0 }} />
    </div>
  );
}

/* ── Front ── */
function ClassicFront({ pastor }) {
  const { name, doc, rawTitle, church, country, photo } = parsePastor(pastor);
  const displayTitle = rawTitle
    ? (rawTitle.toUpperCase().startsWith("PASTOR") ? rawTitle : `PASTOR ${rawTitle}`)
    : "PASTOR";

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      border: "1px solid #bbb", borderRadius: 6,
      boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
    }}>
      <Header rawTitle={rawTitle} />

      <div style={{ flex: 1, position: "relative", display: "flex", background: "#fff", overflow: "hidden" }}>
        <Watermark size={150} />

        {/* Left: data */}
        <div style={{
          flex: 1, padding: "14px 10px 10px 16px",
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 3,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15, color: "#0d0d0d", marginBottom: 3 }}>
            {name.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111", letterSpacing: "0.02em" }}>{doc}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginTop: 6, textTransform: "uppercase" }}>
            {displayTitle}
          </div>
          <div style={{ fontSize: 12.5, color: "#222", textTransform: "uppercase" }}>{church}</div>
          <div style={{ fontSize: 12.5, color: "#222", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {country.code && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={country.name}
                style={{ width: 22, height: "auto", borderRadius: 2, border: "0.5px solid #ddd", flexShrink: 0 }} />
            )}
            <span style={{ textTransform: "uppercase" }}>{country.name}</span>
          </div>
        </div>

        {/* Right: photo */}
        <div style={{
          width: Math.round(CARD_W * 0.38), flexShrink: 0,
          background: "#d8d8d8", overflow: "hidden", position: "relative", zIndex: 1,
        }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", flexDirection: "column", gap: 6, color: "#aaa", fontSize: 9,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              FOTO
            </div>
          )}
        </div>
      </div>

      {/* Presbítero flag banner */}
      {isPresbitero(rawTitle) && (
        <div style={{
          background: BRAND_BLUE, display: "flex", alignItems: "center",
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

      {/* Legal footer */}
      <div style={{ borderTop: "0.5px solid #ccc", background: "#fff", padding: "4px 10px", flexShrink: 0 }}>
        <div style={{ fontSize: 7, fontStyle: "italic", textAlign: "center", color: "#333", lineHeight: 1.5 }}>
          PERSONALIDAD JURÍDICA DE DERECHO PÚBLICO Nº 14 — LEY 19.638 DE LA REPÚBLICA DE CHILE.
        </div>
        <div style={{ fontSize: 7, textAlign: "center", color: "#444", marginTop: 2, lineHeight: 1.4 }}>
          "...Id por todo el mundo y predicad el evangelio a toda criatura." S. Marcos 16:15
        </div>
      </div>
    </div>
  );
}

/* ── Back ── */
function ClassicBack({ pastor, superintendent, signatureUrl }) {
  const barcodeRef = useRef(null);
  const { doc, expiry } = parsePastor(pastor);

  useEffect(() => {
    if (!barcodeRef.current || !doc) return;
    try {
      JsBarcode(barcodeRef.current, doc, {
        format: "CODE128", displayValue: false,
        width: 1.6, height: 40, margin: 0,
        background: "#fff", lineColor: "#000",
      });
    } catch { /* invalid chars */ }
  }, [doc]);

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'Arial',sans-serif",
      background: "#fff", border: "1px solid #bbb", borderRadius: 6,
      boxShadow: "0 4px 18px rgba(0,0,0,0.18)", position: "relative",
    }}>
      <Watermark size={200} />

      <div style={{
        flex: 1, padding: "18px 20px 8px",
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <p style={{ fontSize: 11.5, lineHeight: 1.75, textAlign: "justify", color: "#111", margin: 0, textTransform: "uppercase" }}>
          El Superintendente, acredita que la persona identificada en esta
          credencial reviste la calidad de Pastor en la Iglesia Evangélica
          Pentecostal, Personalidad Jurídica Nº 14 de Derecho Público, conforme
          a la Ley Nº 19.638. Se extiende la presente credencial para ser
          reconocido ante las autoridades de gobierno, hospitales, centros de
          reclusión y donde sea necesario.
        </p>
        <p style={{ fontSize: 10.5, marginTop: 10, color: "#111", textTransform: "uppercase", fontWeight: 600 }}>
          Esta tarjeta es personal e intransferible
        </p>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        padding: "0 20px 10px", position: "relative", zIndex: 1,
      }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#111", textTransform: "uppercase" }}>
            Fecha de vencimiento:
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>{formatExpiry(expiry) || "—"}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="firma"
              style={{ height: 34, width: "auto", display: "block", margin: "0 auto 3px" }} />
          )}
          <div style={{ width: 140, borderTop: "0.5px solid #555", marginBottom: 3 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "#111", textTransform: "uppercase" }}>
            {superintendent || "Superintendente"}
          </div>
          <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase" }}>Superintendente</div>
        </div>
      </div>

      <div style={{
        borderTop: "0.5px solid #ddd", padding: "5px 10px 6px",
        display: "flex", justifyContent: "center",
        background: "#fff", position: "relative", zIndex: 1, flexShrink: 0,
      }}>
        {doc
          ? <svg ref={barcodeRef} style={{ maxWidth: "100%" }} />
          : <div style={{ height: 48, display: "flex", alignItems: "center", color: "#bbb", fontSize: 9 }}>
              Sin documento registrado
            </div>
        }
      </div>
    </div>
  );
}

/* ── Public export ── */
export default function IEPCredential({ pastor, superintendent, signatureUrl, printMode = false }) {
  if (!pastor) return null;

  if (printMode) {
    return (
      <>
        <PrintCard><ClassicFront pastor={pastor} /></PrintCard>
        <PrintCard>
          <ClassicBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
        </PrintCard>
      </>
    );
  }

  return (
    <div className="iep-credential-wrapper" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ClassicFront pastor={pastor} />
      <ClassicBack pastor={pastor} superintendent={superintendent} signatureUrl={signatureUrl} />
    </div>
  );
}
