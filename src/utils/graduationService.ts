// src/utils/graduationService.ts  ← MODIFICADO
// Cambio clave: buildStudentGraduationData ahora lee theoryExamScore y
// practiceExamScore desde la colección "exams" (registrada por el instructor)
// en lugar de depender exclusivamente del campo manual en graduation_data.

import { db } from "../firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import {
  getAttendanceByStudent,
  getSessionsByStudent,
  getAttendanceSummaryByStudent,
} from "./scheduleService";
import { getExamsByStudent } from "./examService"; // ← NUEVO

/* ============================================================
   CONSTANTES — ajustar aquí los umbrales mínimos
   ============================================================ */
export const GRADUATION_REQUIREMENTS = {
  MIN_THEORY_HOURS: 2,
  MIN_THEORY_EXAM_SCORE: 60,
  MIN_PRACTICE_EXAM_SCORE: 60,
} as const;

/* ============================================================
   INTERFACES
   ============================================================ */

/**
 * Campos que administración registra manualmente en Firestore.
 * Colección: graduation_data/{userId}
 * Nota: theoryExamScore y practiceExamScore aquí son el fallback manual.
 * Si existen registros en la colección "exams", esos tienen prioridad.
 */
export interface GraduationAdminData {
  cedula: string;
  licenseType: string;
  theoryExamScore: number | null;
  practiceExamScore: number | null;
  hasPendingSanctions: boolean;
}

export interface StudentGraduationData extends GraduationAdminData {
  userId: string;
  fullName: string;
  theoryHoursCompleted: number;
  practiceHoursCompleted: number;
  attendancePercent: number;
}

export interface ValidationItem {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface GraduationValidationResult {
  studentId: string;
  eligible: boolean;
  items: ValidationItem[];
  summary: string;
  evaluatedAt: Date;
}

/* ============================================================
   UTILIDAD: horas entre dos strings "HH:MM"
   ============================================================ */
const hoursBetween = (start: string, end: string): number => {
  if (!start || !end) return 1;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh + em / 60) - (sh + sm / 60));
};

/* ============================================================
   CONSTRUIR DATOS COMBINANDO FIRESTORE + ASISTENCIA REAL + EXÁMENES
   ============================================================ */
export const buildStudentGraduationData = async (
  userId: string,
  fullName: string
): Promise<StudentGraduationData> => {

  // ── 1. Datos admin (estado financiero, documentos, sanciones, etc.) ──
  const adminSnap = await getDoc(doc(db, "graduation_data", userId));
  const adminData: GraduationAdminData = adminSnap.exists()
    ? (adminSnap.data() as GraduationAdminData)
    : {
        cedula: "—",
        licenseType: "—",
        theoryExamScore: null,
        practiceExamScore: null,
        hasPendingSanctions: false,
      };

  // ── 2. Horas desde asistencia real ──
  const [records, sessions, summaries] = await Promise.all([
    getAttendanceByStudent(userId),
    getSessionsByStudent(userId),
    getAttendanceSummaryByStudent(userId),
  ]);

  const attendedSessionIds = new Set(
    records
      .filter((r) => r.status === "presente" || r.status === "tardanza")
      .map((r) => r.sessionId)
  );

  let theoryHours = 0;
  let practiceHours = 0;

  sessions.forEach((s) => {
    if (!attendedSessionIds.has(s.id)) return;
    const hrs = hoursBetween(s.startTime, s.endTime);
    if (s.type === "teoria") theoryHours += hrs;
    else practiceHours += hrs;
  });

  const avgAttendance =
    summaries.length === 0
      ? 0
      : Math.round(
          summaries.reduce((sum, s) => sum + s.percentage, 0) / summaries.length
        );

  // ── 3. NUEVO: Leer notas de exámenes registradas por el instructor ──
  //    Si hay un examen aprobado registrado en la colección "exams",
  //    ese valor tiene prioridad sobre el campo manual del admin.
  const examRecords = await getExamsByStudent(userId);

  // Para cada tipo tomamos la nota más reciente (último por fecha).
  const latestExam = (type: "theory" | "practice") => {
    const filtered = examRecords
      .filter((e) => e.examType === type && e.score !== null)
      .sort((a, b) => (a.examDate > b.examDate ? -1 : 1)); // más reciente primero
    return filtered.length > 0 ? filtered[0].score : null;
  };

  const theoryExamScore =
    latestExam("theory") !== null
      ? latestExam("theory")
      : adminData.theoryExamScore;

  const practiceExamScore =
    latestExam("practice") !== null
      ? latestExam("practice")
      : adminData.practiceExamScore;

  return {
    userId,
    fullName,
    ...adminData,
    // Los scores reales del instructor sobreescriben los del admin si existen
    theoryExamScore,
    practiceExamScore,
    theoryHoursCompleted: Math.round(theoryHours * 10) / 10,
    practiceHoursCompleted: Math.round(practiceHours * 10) / 10,
    attendancePercent: avgAttendance,
  };
};

/* ============================================================
   CLASE GraduationValidator — sin cambios
   ============================================================ */
export class GraduationValidator {
  private d: StudentGraduationData;
  private req: typeof GRADUATION_REQUIREMENTS;

  constructor(
    data: StudentGraduationData,
    req: typeof GRADUATION_REQUIREMENTS = GRADUATION_REQUIREMENTS
  ) {
    this.d = data;
    this.req = req;
  }

  private checkTheoryHours(): ValidationItem {
    const { MIN_THEORY_HOURS: min } = this.req;
    const val = this.d.theoryHoursCompleted;
    const passed = val >= min;
    return {
      key: "theory_hours",
      label: "Horas Teóricas",
      passed,
      detail: passed
        ? `Completadas: ${val} h (mínimo ${min} h) ✓`
        : `Faltan ${(min - val).toFixed(1)} h teóricas. Completadas: ${val}/${min}`,
    };
  }

  private checkTheoryExam(): ValidationItem {
    const { theoryExamScore } = this.d;
    const { MIN_THEORY_EXAM_SCORE: min } = this.req;
    if (theoryExamScore === null)
      return {
        key: "theory_exam",
        label: "Examen Teórico",
        passed: false,
        detail: "Examen teórico no presentado aún",
      };
    const passed = theoryExamScore >= min;
    return {
      key: "theory_exam",
      label: "Examen Teórico",
      passed,
      detail: passed
        ? `Nota: ${theoryExamScore}/100 (mínimo ${min}) ✓`
        : `Nota insuficiente: ${theoryExamScore}/100. Mínimo: ${min}/100`,
    };
  }

  private checkPracticeExam(): ValidationItem {
    const { practiceExamScore } = this.d;
    const { MIN_PRACTICE_EXAM_SCORE: min } = this.req;
    if (practiceExamScore === null)
      return {
        key: "practice_exam",
        label: "Examen Práctico",
        passed: false,
        detail: "Examen práctico no presentado aún",
      };
    const passed = practiceExamScore >= min;
    return {
      key: "practice_exam",
      label: "Examen Práctico",
      passed,
      detail: passed
        ? `Nota: ${practiceExamScore}/100 (mínimo ${min}) ✓`
        : `Nota insuficiente: ${practiceExamScore}/100. Mínimo: ${min}/100`,
    };
  }

  private checkSanctions(): ValidationItem {
    const passed = !this.d.hasPendingSanctions;
    return {
      key: "sanctions",
      label: "Sin Sanciones Pendientes",
      passed,
      detail: passed
        ? "Sin sanciones registradas ✓"
        : "Tiene sanciones disciplinarias pendientes por resolver",
    };
  }

  validate(): GraduationValidationResult {
    const rules = [
      () => this.checkTheoryHours(),
      () => this.checkTheoryExam(),
      () => this.checkPracticeExam(),
      () => this.checkSanctions(),
    ];

    const items = rules.map((r) => r());
    const eligible = items.every((i) => i.passed);
    const failedCount = items.filter((i) => !i.passed).length;

    return {
      studentId: this.d.userId,
      eligible,
      items,
      summary: eligible
        ? "✅ Cumples todos los requisitos de graduación."
        : `❌ Tienes ${failedCount} requisito(s) pendiente(s).`,
      evaluatedAt: new Date(),
    };
  }
}

export const saveGraduationValidation = async (
  result: GraduationValidationResult
): Promise<void> => {
  await setDoc(doc(db, "graduation_validations", result.studentId), {
    eligible: result.eligible,
    items: result.items,
    summary: result.summary,
    evaluatedAt: Timestamp.fromDate(result.evaluatedAt),
  });
};

export const validateAndSaveGraduation = async (
  userId: string,
  fullName: string
): Promise<{ result: GraduationValidationResult; data: StudentGraduationData }> => {
  const data = await buildStudentGraduationData(userId, fullName);
  const validator = new GraduationValidator(data);
  const result = validator.validate();
  await saveGraduationValidation(result);
  return { result, data };
};