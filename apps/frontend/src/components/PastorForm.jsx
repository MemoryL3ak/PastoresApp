// src/components/PastorForm.jsx
import { useState } from "react";
import { getActiveTemplate } from "../credentialTemplatesStorage";
import { generateCredentialPdf } from "../generateCredentialPdf";

export default function PastorForm({ pastor, onBack, onSave }) {
  const isEdit = Boolean(pastor);

  const [nombre, setNombre] = useState(pastor?.nombre ?? pastor?.fullName ?? "");
  const [iglesia, setIglesia] = useState(pastor?.iglesia ?? "");
  const [rut, setRut] = useState(pastor?.rut ?? "");
  const [degreeTitle, setDegreeTitle] = useState(
    pastor?.degreeTitle ?? ""
  );
  const [estado, setEstado] = useState(pastor?.estado ?? "Activo");
  const [photoUrl, setPhotoUrl] = useState(pastor?.photoUrl ?? "");
  const [countryImageUrl, setCountryImageUrl] = useState(
    pastor?.countryImageUrl ?? ""
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    pastor?.fechaVencimiento ?? ""
  );

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCountryImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCountryImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePdf = async () => {
    const tpl = getActiveTemplate();
    if (!tpl) {
      alert(
        "No hay plantilla activa. Ve a Configuración → Plantillas de credenciales y marca una como activa."
      );
      return;
    }

    const pastorData = {
      id: pastor?.id,
      fullName: nombre,
      nombre,
      rut,
      iglesia,
      degreeTitle,
      estado,
      photoUrl,
      countryImageUrl,
      fechaVencimiento,
    };

    try {
      await generateCredentialPdf(tpl, pastorData);
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al generar la credencial.");
    }
  };

  const handleSave = () => {
    const pastorData = {
      id: pastor?.id,
      nombre,
      rut,
      iglesia,
      degreeTitle,
      estado,
      photoUrl,
      countryImageUrl,
      fechaVencimiento,
    };
    onSave(pastorData);
  };

  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">
          {isEdit ? "Editar Pastor" : "Agregar Pastor"}
        </h2>
        <button className="btn-secondary" onClick={onBack}>
          Volver a listado
        </button>
      </div>

      <div className="form-grid">
        <label className="field-label">
          Nombre
          <input
            className="field-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>

        <label className="field-label">
          Iglesia
          <input
            className="field-input"
            value={iglesia}
            onChange={(e) => setIglesia(e.target.value)}
          />
        </label>

        <label className="field-label">
          RUT
          <input
            className="field-input"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
          />
        </label>

        <label className="field-label">
          Grado / Título
          <input
            className="field-input"
            value={degreeTitle}
            onChange={(e) => setDegreeTitle(e.target.value)}
          />
        </label>

        <label className="field-label">
          Estado
          <select
            className="field-input"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </label>

        <label className="field-label">
          Fecha de vencimiento
          <input
            className="field-input"
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
        </label>

        <label className="field-label">
          Foto del pastor
          <input
            className="field-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {photoUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={photoUrl}
                alt="Preview pastor"
                style={{
                  width: 100,
                  height: 120,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </label>

        <label className="field-label">
          Bandera / País
          <input
            className="field-input"
            type="file"
            accept="image/*"
            onChange={handleCountryImageChange}
          />
          {countryImageUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={countryImageUrl}
                alt="Bandera"
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 4,
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </label>
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={handleGeneratePdf}>
          Generar Credencial PDF
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </div>
  );
}
