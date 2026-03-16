// src/credentialTemplatesStorage.js

const STORAGE_KEY = "credentialTemplates";
const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function createDefaultTemplate() {
  const id = "tpl_iep_moderno";

  return [
    {
      id,
      name: "Plantilla básica",
      backgroundDataUrl: "",
      backBackgroundDataUrl: "",
      signatureImageDataUrl: "",
      isActive: true,
      // Campos del FRONTAL
      fields: [
        {
          id: "f_nombre",
          key: "fullName",
          x: 28,
          y: 43,
          fontSize: 16,
          bold: true,
        },
        {
          id: "f_rut",
          key: "rut",
          x: 28,
          y: 53,
          fontSize: 12,
          bold: false,
        },
        {
          id: "f_iglesia",
          key: "iglesia",
          x: 28,
          y: 61,
          fontSize: 12,
          bold: false,
        },
        {
          id: "f_degree",
          key: "degreeTitle",
          x: 28,
          y: 69,
          fontSize: 12,
          bold: false,
        },
        {
          id: "f_foto",
          key: "photo",
          x: 78,
          y: 42,
          fontSize: 12,
          bold: false,
        },
        {
          id: "f_pais",
          key: "countryFlag",
          x: 78,
          y: 69,
          fontSize: 10,
          bold: false,
        },
      ],
      // Campos del REVERSO (fecha + firma) – AHORA configurables
      backFields: [
        {
          id: "b_fecha",
          key: "expiryDate",
          x: 52,    // % horizontal
          y: 72,    // % vertical
          fontSize: 10,
          bold: true,
        },
        {
          id: "b_firma",
          key: "signature",
          x: 80,
          y: 25,
          fontSize: 12,
          bold: false,
        },
      ],
    },
  ];
}

export function loadTemplates() {
  if (!canUseStorage()) {
    return createDefaultTemplate();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultTemplate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = createDefaultTemplate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    // Si la plantilla vieja no tenía backFields, los agregamos
    const patched = parsed.map((tpl) => ({
      ...tpl,
      backFields:
        tpl.backFields && Array.isArray(tpl.backFields)
          ? tpl.backFields
          : createDefaultTemplate()[0].backFields,
    }));
    return patched;
  } catch (e) {
    console.error("Error cargando plantillas", e);
    const defaults = createDefaultTemplate();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveTemplates(templates) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Error guardando plantillas", e);
  }
}

export function getActiveTemplate() {
  const templates = loadTemplates();
  return templates.find((t) => t.isActive) || null;
}
