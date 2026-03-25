import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { StudentReportItem } from "./reportService";
import { formatTimestamp } from "./reportService";

const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  completado: "Completado",
};

function toPdfRows(rows: StudentReportItem[]): string[][] {
  return rows.map((r) => [
    r.studentName,
    r.email,
    r.cedula ?? "—",
    r.courseName,
    r.courseCode,
    STATUS_LABELS[r.courseStatus] ?? r.courseStatus,
    r.modality,
    r.theorySchedule,
    formatTimestamp(r.enrolledAt),
  ]);
}

const PDF_HEADERS = [
  "Nombre",
  "Email",
  "Cédula",
  "Curso",
  "Código",
  "Estado",
  "Modalidad",
  "Horario Teoría",
  "Fecha Inscripción",
];

export function exportStudentReportPdf(
  rows: StudentReportItem[],
  title = "Reporte de estudiantes — SGCC"
): void {
  if (!rows.length) throw new Error("No hay datos para exportar.");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 22);

  autoTable(doc, {
    startY: 26,
    head: [PDF_HEADERS],
    body: toPdfRows(rows),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [124, 58, 237] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 14, right: 14 },
  });

  const safeName = `reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeName);
}

export function exportStudentReportExcel(rows: StudentReportItem[]): void {
  if (!rows.length) throw new Error("No hay datos para exportar.");

  const data = rows.map((r) => ({
    Nombre: r.studentName,
    Email: r.email,
    Cédula: r.cedula ?? "—",
    Curso: r.courseName,
    Código: r.courseCode,
    Estado: STATUS_LABELS[r.courseStatus] ?? r.courseStatus,
    Modalidad: r.modality,
    "Horario Teoría": r.theorySchedule,
    "Fecha Inscripción": formatTimestamp(r.enrolledAt),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
  const name = `reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}

