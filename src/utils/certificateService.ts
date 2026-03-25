// src/utils/certificateService.ts
// ARCHIVO NUEVO → src/utils/certificateService.ts
//
// INSTALAR: npm install jspdf

import jsPDF from "jspdf";
import { db } from "../firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import type { GraduationValidationResult, StudentGraduationData } from "./graduationService";

/* ============================================================
   INTERFACES
   ============================================================ */
export interface CertificateData {
  studentName: string;
  cedula: string;
  graduationDate: string;
  schoolName: string;
  licenseType: string;
  certificateId: string;
}

export interface CertificateRecord {
  userId: string;
  certificateId: string;
  issuedAt: any;
  studentName: string;
  licenseType: string;
  downloadCount: number;
}

/* ============================================================
   CÓDIGO ÚNICO — formato SGCC-YYYYMMDD-XXXXXX
   ============================================================ */
const generateCertificateId = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 8);
  return `SGCC-${datePart}-${randomPart}`;
};

/* ============================================================
   GENERADOR PDF (jsPDF, landscape A4)
   ============================================================ */
const buildCertificatePDF = (data: CertificateData): jsPDF => {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  // Fondo
  pdf.setFillColor(254, 252, 243);
  pdf.rect(0, 0, W, H, "F");

  // Bordes dorados
  pdf.setDrawColor(180, 140, 30);
  pdf.setLineWidth(4);
  pdf.rect(8, 8, W - 16, H - 16, "S");
  pdf.setLineWidth(1);
  pdf.setDrawColor(200, 165, 50);
  pdf.rect(12, 12, W - 24, H - 24, "S");

  // Encabezado
  pdf.setFont("times", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(100, 70, 10);
  pdf.text(data.schoolName.toUpperCase(), W / 2, 30, { align: "center" });

  pdf.setFontSize(9);
  pdf.setFont("times", "normal");
  pdf.setTextColor(120, 90, 20);
  pdf.text("Sistema de Gestión de Cursos de Conducción", W / 2, 38, { align: "center" });

  pdf.setDrawColor(180, 140, 30);
  pdf.setLineWidth(0.8);
  pdf.line(40, 43, W - 40, 43);

  // Título
  pdf.setFont("times", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(60, 40, 5);
  pdf.text("CERTIFICADO DE GRADUACIÓN", W / 2, 62, { align: "center" });

  // Subtítulo
  pdf.setFontSize(11);
  pdf.setFont("times", "italic");
  pdf.setTextColor(100, 70, 10);
  pdf.text("La institución certifica que:", W / 2, 76, { align: "center" });

  // Nombre
  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(30, 20, 60);
  pdf.text(data.studentName.toUpperCase(), W / 2, 92, { align: "center" });

  const nameWidth = pdf.getTextWidth(data.studentName.toUpperCase());
  const nameX = (W - nameWidth) / 2;
  pdf.setDrawColor(30, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(nameX, 95, nameX + nameWidth, 95);

  // Cédula
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(80, 60, 10);
  pdf.text(`C.C. / ID: ${data.cedula}`, W / 2, 103, { align: "center" });

  // Cuerpo
  pdf.setFontSize(11);
  pdf.setTextColor(50, 40, 10);
  const bodyLines = pdf.splitTextToSize(
    "ha cumplido satisfactoriamente todos los requisitos académicos, teóricos y prácticos " +
    "establecidos por esta institución para la obtención de:",
    W - 80
  );
  pdf.text(bodyLines, W / 2, 113, { align: "center" });

  // Licencia
  pdf.setFont("times", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(20, 60, 20);
  pdf.text(`Licencia Tipo: ${data.licenseType}`, W / 2, 130, { align: "center" });

  // Separador
  pdf.setDrawColor(180, 140, 30);
  pdf.setLineWidth(0.5);
  pdf.line(40, 137, W - 40, 137);

  // Fecha
  pdf.setFont("times", "italic");
  pdf.setFontSize(10);
  pdf.setTextColor(80, 60, 10);
  pdf.text(`Expedido el ${data.graduationDate}`, W / 2, 145, { align: "center" });

  // Firmas
  pdf.setDrawColor(80, 60, 10);
  pdf.setLineWidth(0.5);
  pdf.line(55, 172, 130, 172);
  pdf.setFont("times", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 60, 10);
  pdf.text("Director Académico", 92, 178, { align: "center" });
  pdf.text(data.schoolName, 92, 183, { align: "center" });

  pdf.line(167, 172, 242, 172);
  pdf.text("Instructor Responsable", 204, 178, { align: "center" });
  pdf.text("Escuela de Conducción", 204, 183, { align: "center" });

  // Pie
  pdf.setFillColor(240, 230, 200);
  pdf.rect(0, H - 22, W, 22, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 70, 10);
  pdf.text(`Código de certificado: ${data.certificateId}`, W / 2, H - 13, { align: "center" });
  pdf.text(
    "Este documento tiene validez oficial. Para verificación, contáctese con la institución.",
    W / 2, H - 7, { align: "center" }
  );

  return pdf;
};

/* ============================================================
   FUNCIÓN PÚBLICA: generar + descargar
   ============================================================ */
export const generateAndDownloadCertificate = async (
  userId: string,
  validationResult: GraduationValidationResult,
  studentData: StudentGraduationData,
  schoolName = "Escuela de Conducción SGCC"
): Promise<CertificateData> => {
  if (!validationResult.eligible) {
    throw new Error(
      "No se puede generar el certificado: el estudiante no cumple todos los requisitos."
    );
  }

  // Reutilizar ID si ya existe
  let certificateId: string;
  try {
    const existing = await getDoc(doc(db, "certificates", userId));
    certificateId = existing.exists()
      ? (existing.data() as CertificateRecord).certificateId
      : generateCertificateId();
  } catch {
    certificateId = generateCertificateId();
  }

  const graduationDate = new Date().toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const certData: CertificateData = {
    studentName: studentData.fullName,
    cedula: studentData.cedula || "—",
    graduationDate,
    schoolName,
    licenseType: studentData.licenseType || "—",
    certificateId,
  };

  // Construir y descargar PDF
  let pdf: jsPDF;
  try {
    pdf = buildCertificatePDF(certData);
  } catch (err) {
    console.error("Error construyendo PDF:", err);
    throw new Error("Ocurrió un error al generar el PDF.");
  }

  // Guardar registro en Firestore
  try {
    const existing = await getDoc(doc(db, "certificates", userId));
    const prevCount = existing.exists()
      ? ((existing.data() as CertificateRecord).downloadCount ?? 0)
      : 0;
    await setDoc(doc(db, "certificates", userId), {
      userId, certificateId,
      issuedAt: Timestamp.now(),
      studentName: studentData.fullName,
      licenseType: studentData.licenseType,
      downloadCount: prevCount + 1,
    } as CertificateRecord);
  } catch (err) {
    console.warn("No se pudo guardar el registro del certificado.", err);
  }

  pdf.save(`Certificado_${studentData.fullName.replace(/\s+/g, "_")}_${certificateId}.pdf`);
  return certData;
};

export const getCertificateRecord = async (
  userId: string
): Promise<CertificateRecord | null> => {
  try {
    const snap = await getDoc(doc(db, "certificates", userId));
    if (!snap.exists()) return null;
    return { userId, ...(snap.data() as Omit<CertificateRecord, "userId">) };
  } catch {
    return null;
  }
};