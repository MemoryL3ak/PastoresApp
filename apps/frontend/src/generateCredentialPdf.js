// src/generateCredentialPdf.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Embebe PNG o JPG desde un dataURL
async function embedImage(pdfDoc, dataUrl) {
  if (!dataUrl) return null;

  const header = dataUrl.split(";")[0]; // "data:image/png"
  const mime = header.replace("data:", ""); // "image/png"

  const arr = await fetch(dataUrl).then((r) => r.arrayBuffer());

  if (mime === "image/png") {
    return await pdfDoc.embedPng(arr);
  }
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return await pdfDoc.embedJpg(arr);
  }

  try {
    return await pdfDoc.embedPng(arr);
  } catch {
    return null;
  }
}

function formatFecha(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`; // dd-mm-aaaa
}

export async function generateCredentialPdf(template, pastor) {
  const pdfDoc = await PDFDocument.create();
  const width = 360;
  const height = 220;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const getValueForKey = (key) => {
    switch (key) {
      case "fullName":
        return pastor?.fullName || pastor?.nombre || "";
      case "rut":
        return pastor?.rut || "";
      case "iglesia":
        return pastor?.iglesia || "";
      case "degreeTitle":
        return pastor?.degreeTitle || pastor?.titulo || "";
      case "expiryDate":
        return formatFecha(pastor?.fechaVencimiento || "");
      default:
        return "";
    }
  };

  const getImageUrlForKey = (key) => {
    switch (key) {
      case "photo":
        return pastor?.photoUrl || "";
      case "countryFlag":
        return pastor?.countryImageUrl || "";
      case "signature":
        // la firma no viene del pastor, viene de la plantilla
        return template?.signatureImageDataUrl || "";
      default:
        return "";
    }
  };

  // -------------------------
  // CARA FRONTAL
  // -------------------------
  const pageFront = pdfDoc.addPage([width, height]);

  if (template.backgroundDataUrl) {
    const bgImage = await embedImage(pdfDoc, template.backgroundDataUrl);
    if (bgImage) {
      pageFront.drawImage(bgImage, { x: 0, y: 0, width, height });
    }
  }

  const frontFields = template.fields || [];

  for (const field of frontFields) {
    const x = (field.x / 100) * width;
    const y = height - (field.y / 100) * height;

    // Imágenes (foto pastor / bandera)
    if (field.key === "photo" || field.key === "countryFlag") {
      const imgUrl = getImageUrlForKey(field.key);
      if (!imgUrl) continue;

      const img = await embedImage(pdfDoc, imgUrl);
      if (!img) continue;

      let imgW = 80;
      let imgH = 100;
      if (field.key === "countryFlag") {
        imgW = 40;
        imgH = 28;
      }

      pageFront.drawImage(img, {
        x: x - imgW / 2,
        y: y - imgH / 2,
        width: imgW,
        height: imgH,
      });

      continue;
    }

    // Texto frontal (nombre, rut, iglesia, grado)
    const value = getValueForKey(field.key);
    if (!value) continue;

    pageFront.drawText(value, {
      x,
      y,
      size: field.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // -------------------------
  // CARA REVERSO
  // -------------------------
  const pageBack = pdfDoc.addPage([width, height]);

  if (template.backBackgroundDataUrl) {
    const backImg = await embedImage(pdfDoc, template.backBackgroundDataUrl);
    if (backImg) {
      pageBack.drawImage(backImg, { x: 0, y: 0, width, height });
    } else {
      pageBack.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
      });
    }
  } else {
    pageBack.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });
  }

  const backFields = template.backFields || [];

  for (const field of backFields) {
    const x = (field.x / 100) * width;
    const y = height - (field.y / 100) * height;

    if (field.key === "signature") {
      const imgUrl = getImageUrlForKey("signature");
      if (!imgUrl) continue;

      const firmaImg = await embedImage(pdfDoc, imgUrl);
      if (!firmaImg) continue;

      const firmaW = 120;
      const firmaH = 40;

      pageBack.drawImage(firmaImg, {
        x: x - firmaW / 2,
        y: y - firmaH / 2,
        width: firmaW,
        height: firmaH,
      });

      continue;
    }

    if (field.key === "expiryDate") {
      const fecha = getValueForKey("expiryDate");
      if (!fecha) continue;

      pageBack.drawText(fecha, {
        x,
        y,
        size: field.fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      continue;
    }
  }

  const fullName = getValueForKey("fullName");

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fullName || "credencial"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
