// src/components/CredentialTemplates.jsx
import { useState } from "react";
import { loadTemplates, saveTemplates } from "../credentialTemplatesStorage";

const FIELD_OPTIONS_FRONT = [
  { key: "fullName", label: "Nombre completo" },
  { key: "rut", label: "RUT" },
  { key: "iglesia", label: "Iglesia" },
  { key: "degreeTitle", label: "Grado / Título" },
  { key: "photo", label: "Foto del pastor" },
  { key: "countryFlag", label: "Bandera / País" },
];

const FIELD_OPTIONS_BACK = [
  { key: "expiryDate", label: "Fecha de vencimiento" },
  { key: "signature", label: "Firma del superintendente" },
];

export default function CredentialTemplates() {
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [selectedId, setSelectedId] = useState(() => {
    const initialTemplates = loadTemplates();
    return initialTemplates.length > 0 ? initialTemplates[0].id : null;
  });
  const [side, setSide] = useState("front"); // "front" | "back"

  const selected = templates.find((t) => t.id === selectedId) || null;

  // ---------- Uploads ----------

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const updated = templates.map((t) =>
        t.id === selectedId ? { ...t, backgroundDataUrl: dataUrl } : t
      );
      setTemplates(updated);
      saveTemplates(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleBackBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const updated = templates.map((t) =>
        t.id === selectedId ? { ...t, backBackgroundDataUrl: dataUrl } : t
      );
      setTemplates(updated);
      saveTemplates(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const updated = templates.map((t) =>
        t.id === selectedId ? { ...t, signatureImageDataUrl: dataUrl } : t
      );
      setTemplates(updated);
      saveTemplates(updated);
    };
    reader.readAsDataURL(file);
  };

  // ---------- Gestión plantillas ----------

  const handleAddTemplate = () => {
    const id = `tpl_${Date.now()}`;
    const newTemplate = {
      id,
      name: `Plantilla ${templates.length + 1}`,
      backgroundDataUrl: "",
      backBackgroundDataUrl: "",
      signatureImageDataUrl: "",
      isActive: false,
      fields: [
        {
          id: `f_${id}_nombre`,
          key: "fullName",
          x: 28,
          y: 43,
          fontSize: 16,
          bold: true,
        },
        {
          id: `f_${id}_rut`,
          key: "rut",
          x: 28,
          y: 53,
          fontSize: 12,
          bold: false,
        },
        {
          id: `f_${id}_iglesia`,
          key: "iglesia",
          x: 28,
          y: 61,
          fontSize: 12,
          bold: false,
        },
        {
          id: `f_${id}_degree`,
          key: "degreeTitle",
          x: 28,
          y: 69,
          fontSize: 12,
          bold: false,
        },
        {
          id: `f_${id}_foto`,
          key: "photo",
          x: 78,
          y: 42,
          fontSize: 12,
          bold: false,
        },
        {
          id: `f_${id}_pais`,
          key: "countryFlag",
          x: 78,
          y: 69,
          fontSize: 10,
          bold: false,
        },
      ],
      backFields: [
        {
          id: `b_${id}_fecha`,
          key: "expiryDate",
          x: 52,
          y: 72,
          fontSize: 10,
          bold: true,
        },
        {
          id: `b_${id}_firma`,
          key: "signature",
          x: 80,
          y: 25,
          fontSize: 12,
          bold: false,
        },
      ],
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
    setSelectedId(id);
  };

  const handleTemplateFieldChange = (fieldId, changes, sideToEdit) => {
    const updated = templates.map((t) => {
      if (t.id !== selectedId) return t;
      if (sideToEdit === "front") {
        return {
          ...t,
          fields: t.fields.map((f) =>
            f.id === fieldId ? { ...f, ...changes } : f
          ),
        };
      }
      return {
        ...t,
        backFields: t.backFields.map((f) =>
          f.id === fieldId ? { ...f, ...changes } : f
        ),
      };
    });
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleTemplateNameChange = (name) => {
    const updated = templates.map((t) =>
      t.id === selectedId ? { ...t, name } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleSetActive = (id) => {
    const updated = templates.map((t) => ({
      ...t,
      isActive: t.id === id,
    }));
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleAddField = () => {
    if (!selected) return;
    const id = `f_${Date.now()}`;

    if (side === "front") {
      const newField = {
        id,
        key: "fullName",
        x: 10,
        y: 10,
        fontSize: 12,
        bold: false,
      };
      const updated = templates.map((t) =>
        t.id === selectedId ? { ...t, fields: [...t.fields, newField] } : t
      );
      setTemplates(updated);
      saveTemplates(updated);
    } else {
      const newField = {
        id,
        key: "expiryDate",
        x: 52,
        y: 72,
        fontSize: 10,
        bold: true,
      };
      const updated = templates.map((t) =>
        t.id === selectedId
          ? { ...t, backFields: [...t.backFields, newField] }
          : t
      );
      setTemplates(updated);
      saveTemplates(updated);
    }
  };

  if (!selected && templates.length === 0) {
    return (
      <div>
        <div className="view-header">
          <h2 className="view-title">Plantillas de Credenciales</h2>
        </div>
        <div className="card space-y-4">
          <p className="text-sm text-slate-600">
            Aún no tienes plantillas definidas. Crea una para diseñar el
            formato de la credencial (fondo + posición de campos).
          </p>
          <button className="btn-primary" onClick={handleAddTemplate}>
            Crear primera plantilla
          </button>
        </div>
      </div>
    );
  }

  const activeFieldList =
    side === "front" ? selected?.fields ?? [] : selected?.backFields ?? [];

  const fieldOptions =
    side === "front" ? FIELD_OPTIONS_FRONT : FIELD_OPTIONS_BACK;

  const frontButtonStyle =
    side === "front"
      ? { backgroundColor: "#111827", color: "#fff" }
      : { backgroundColor: "#e5e7eb", color: "#111827" };

  const backButtonStyle =
    side === "back"
      ? { backgroundColor: "#111827", color: "#fff" }
      : { backgroundColor: "#e5e7eb", color: "#111827" };

  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Plantillas de Credenciales</h2>
        <button className="btn-primary" onClick={handleAddTemplate}>
          Nueva plantilla
        </button>
      </div>

      <div className="filters-row" style={{ marginBottom: 16 }}>
        <select
          className="field-input"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.isActive ? "(Activa)" : ""}
            </option>
          ))}
        </select>
        {selected && (
          <>
            <button
              className="btn-secondary"
              style={frontButtonStyle}
              onClick={() => setSide("front")}
            >
              Frontal
            </button>
            <button
              className="btn-secondary"
              style={backButtonStyle}
              onClick={() => setSide("back")}
            >
              Reverso
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleSetActive(selected.id)}
            >
              Marcar como activa
            </button>
          </>
        )}
      </div>

      {selected && (
        <div className="credential-layout">
          {/* Panel de configuración */}
          <div className="credential-config panel">
            <label className="field-label" style={{ marginBottom: 12 }}>
              Nombre de la plantilla
              <input
                className="field-input"
                value={selected.name}
                onChange={(e) => handleTemplateNameChange(e.target.value)}
              />
            </label>

            <div style={{ marginBottom: 12 }}>
              <p className="text-sm text-slate-600" style={{ marginBottom: 4 }}>
                Plantilla frontal (imagen PNG/JPG)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <p className="text-sm text-slate-600" style={{ marginBottom: 4 }}>
                Plantilla reverso (imagen PNG/JPG)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackBackgroundUpload}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <p className="text-sm text-slate-600" style={{ marginBottom: 4 }}>
                Firma del Superintendente (PNG, ideal fondo transparente)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p className="text-sm text-slate-600" style={{ margin: 0 }}>
                Campos del {side === "front" ? "frontal" : "reverso"}
              </p>
              <button className="btn-secondary" onClick={handleAddField}>
                Agregar campo
              </button>
            </div>

            <div style={{ maxHeight: 260, overflow: "auto" }}>
              {activeFieldList.map((f) => (
                <div
                  key={f.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 8,
                    marginBottom: 8,
                  }}
                >
                  <label className="field-label">
                    Tipo de campo
                    <select
                      className="field-input"
                      value={f.key}
                      onChange={(e) =>
                        handleTemplateFieldChange(
                          f.id,
                          { key: e.target.value },
                          side
                        )
                      }
                    >
                      {fieldOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="filters-row" style={{ marginTop: 8 }}>
                    <label className="field-label">
                      X (%)
                      <input
                        className="field-input"
                        type="number"
                        min="0"
                        max="100"
                        value={f.x}
                        onChange={(e) =>
                          handleTemplateFieldChange(
                            f.id,
                            { x: Number(e.target.value) },
                            side
                          )
                        }
                      />
                    </label>
                    <label className="field-label">
                      Y (%)
                      <input
                        className="field-input"
                        type="number"
                        min="0"
                        max="100"
                        value={f.y}
                        onChange={(e) =>
                          handleTemplateFieldChange(
                            f.id,
                            { y: Number(e.target.value) },
                            side
                          )
                        }
                      />
                    </label>
                    <label className="field-label">
                      Tamaño
                      <input
                        className="field-input"
                        type="number"
                        min="8"
                        max="32"
                        value={f.fontSize}
                        onChange={(e) =>
                          handleTemplateFieldChange(
                            f.id,
                            { fontSize: Number(e.target.value) },
                            side
                          )
                        }
                      />
                    </label>
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                      fontSize: "0.8rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={f.bold}
                      onChange={(e) =>
                        handleTemplateFieldChange(
                          f.id,
                          { bold: e.target.checked },
                          side
                        )
                      }
                    />
                    Negrita
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW ÚNICO: muestra solo el lado seleccionado */}
          <div className="credential-preview panel">
            <p className="text-sm text-slate-600" style={{ marginBottom: 8 }}>
              Vista previa ({side === "front" ? "FRONTAL" : "REVERSO"})
            </p>

            <div className="credential-card">
              {side === "front" && selected.backgroundDataUrl && (
                <div
                  className="credential-bg"
                  style={{
                    backgroundImage: `url(${selected.backgroundDataUrl})`,
                  }}
                />
              )}

              {side === "back" && selected.backBackgroundDataUrl && (
                <div
                  className="credential-bg"
                  style={{
                    backgroundImage: `url(${selected.backBackgroundDataUrl})`,
                  }}
                />
              )}

              {side === "front" &&
                selected.fields.map((f) => {
                  const exampleText =
                    f.key === "fullName"
                      ? "Carlos Pérez González"
                      : f.key === "rut"
                      ? "12.345.678-9"
                      : f.key === "iglesia"
                      ? "Iglesia Central"
                      : f.key === "degreeTitle"
                      ? "Pastor Honorario"
                      : null;

                  return (
                    <div
                      key={f.id}
                      className="credential-field"
                      style={{
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        fontSize: f.fontSize,
                        fontWeight: f.bold ? 700 : 400,
                      }}
                    >
                      {f.key === "photo" ? (
                        <div
                          style={{
                            width: 80,
                            height: 100,
                            borderRadius: 8,
                            background: "#d1d5db",
                          }}
                        />
                      ) : f.key === "countryFlag" ? (
                        <div
                          style={{
                            width: 40,
                            height: 28,
                            borderRadius: 4,
                            background: "#d1d5db",
                          }}
                        />
                      ) : (
                        exampleText
                      )}
                    </div>
                  );
                })}

              {side === "back" &&
                (selected.backFields || []).map((f) => {
                  if (f.key === "signature") {
                    return selected.signatureImageDataUrl ? (
                      <img
                        key={f.id}
                        src={selected.signatureImageDataUrl}
                        alt="Firma"
                        style={{
                          position: "absolute",
                          width: "120px",
                          height: "40px",
                          left: `${f.x}%`,
                          top: `${f.y}%`,
                          transform: "translate(-50%, -50%)",
                          objectFit: "contain",
                          opacity: 0.9,
                        }}
                      />
                    ) : (
                      <div
                        key={f.id}
                        style={{
                          position: "absolute",
                          width: "120px",
                          height: "40px",
                          left: `${f.x}%`,
                          top: `${f.y}%`,
                          transform: "translate(-50%, -50%)",
                          background: "#d1d5db",
                          borderRadius: 6,
                        }}
                      />
                    );
                  }

                  // expiryDate
                  const exampleDate = "31-12-2025";

                  return (
                    <div
                      key={f.id}
                      style={{
                        position: "absolute",
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontSize: f.fontSize,
                        fontWeight: f.bold ? 700 : 400,
                        color: "#111827",
                      }}
                    >
                      {exampleDate}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
