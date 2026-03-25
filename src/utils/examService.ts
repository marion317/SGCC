// examService.ts
// Servicio de gestión de exámenes teóricos y prácticos.
// Cualquier instructor asignado al curso (teórico o práctico) puede registrar
// y editar exámenes de ambos tipos (teórico y práctico).
// La unicidad de un examen es: estudiante + tipo + curso + instructor.
// Cada instructor puede dar UNA nota teórica y UNA nota práctica por estudiante.

import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { getCoursesByInstructorId, Course } from "./courseService";

/* ==========================
   CONSTANTES / TIPOS
========================== */

/** Tipo de examen: teórico o práctico */
export type ExamType = "theory" | "practice";

/** Estado del examen: aprobado, reprobado o pendiente */
export type ExamStatus = "approved" | "failed" | "pending";

/* ==========================
   INTERFACES
========================== */

/**
 * Representa un examen registrado en Firestore.
 * La separación teoría/práctica se maneja a través del campo `examType`.
 */
export interface Exam {
  id: string;

  /** ID del curso al que pertenece el examen */
  courseId: string;
  courseName: string;

  /** Datos del estudiante evaluado */
  studentId: string;
  studentName: string;
  studentUsername: string;

  /** Tipo de examen: teórico (theory) o práctico (practice) */
  examType: ExamType;

  /** Calificación numérica (0–100). null = aún no calificado */
  score: number | null;

  /** true = aprobado, false = reprobado, null = pendiente */
  passed: boolean | null;

  /** Estado derivado para mostrar en UI */
  status: ExamStatus;

  /** ID del instructor que registró / puede editar el examen */
  instructorId: string;
  instructorName: string;

  /** Fecha del examen (YYYY-MM-DD) */
  examDate: string;

  /** Observaciones opcionales */
  notes: string;

  createdAt: any;
  updatedAt: any;
}

/** Datos requeridos para crear un examen */
export type ExamInput = Omit<
  Exam,
  "id" | "status" | "passed" | "createdAt" | "updatedAt"
> & {
  score: number | null;
};

/* ==========================
   HELPERS INTERNOS
========================== */

/** Calcula el estado y resultado a partir de la calificación (aprobado >= 70) */
const resolveStatus = (
  score: number | null
): { passed: boolean | null; status: ExamStatus } => {
  if (score === null) return { passed: null, status: "pending" };
  const passed = score >= 70;
  return { passed, status: passed ? "approved" : "failed" };
};

/**
 * Determina los tipos de examen que puede gestionar un instructor en un curso.
 * Cualquier instructor asignado al curso (ya sea como teórico o práctico)
 * puede gestionar exámenes de AMBOS tipos.
 * Si no pertenece al curso → [].
 */
export const getInstructorExamTypes = (
  instructorId: string,
  course: Course
): ExamType[] => {
  const inCourse =
    course.theoryInstructors.some((i) => i.id === instructorId) ||
    course.practiceInstructors.some((i) => i.id === instructorId);
  return inCourse ? ["theory", "practice"] : [];
};

/**
 * Verifica que el instructor tenga permiso para gestionar exámenes
 * del tipo indicado en el curso indicado.
 * Lanza un Error si no tiene permiso.
 */
export const assertExamPermission = (
  instructorId: string,
  course: Course,
  examType: ExamType
): void => {
  const allowed = getInstructorExamTypes(instructorId, course);
  if (!allowed.includes(examType)) {
    const typeName = examType === "theory" ? "teórico" : "práctico";
    throw new Error(
      `No tienes permiso para gestionar el examen ${typeName} de este curso.`
    );
  }
};

/* ==========================
   OBTENER EXÁMENES
========================== */

/** Obtiene todos los exámenes de un curso */
export const getExamsByCourse = async (courseId: string): Promise<Exam[]> => {
  const q = query(collection(db, "exams"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exam, "id">) }));
};

/**
 * Obtiene los exámenes que un instructor puede ver:
 * solo del tipo que le corresponde en cada curso.
 */
export const getExamsByInstructor = async (
  instructorId: string
): Promise<Exam[]> => {
  // Traemos los cursos donde participa el instructor
  const courses = await getCoursesByInstructorId(instructorId);

  const results: Exam[] = [];

  for (const course of courses) {
    const allowedTypes = getInstructorExamTypes(instructorId, course);
    if (allowedTypes.length === 0) continue;

    const courseExams = await getExamsByCourse(course.id);

    // Filtra solo los exámenes del tipo que le corresponde
    const filtered = courseExams.filter((e) =>
      allowedTypes.includes(e.examType)
    );
    results.push(...filtered);
  }

  return results;
};

/** Obtiene los exámenes de un estudiante específico */
export const getExamsByStudent = async (studentId: string): Promise<Exam[]> => {
  const q = query(
    collection(db, "exams"),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exam, "id">) }));
};

/* ==========================
   CREAR EXAMEN
========================== */

/**
 * Registra un nuevo examen.
 * Valida que:
 * 1. El instructor tenga permiso para el tipo de examen.
 * 2. No exista ya un examen del mismo tipo para el mismo estudiante en el curso.
 */
export const createExam = async (
  data: ExamInput,
  course: Course
): Promise<Exam> => {
  // Validación de permisos
  assertExamPermission(data.instructorId, course, data.examType);

  // Evitar duplicados: mismo instructor, mismo alumno, mismo tipo, mismo curso.
  // (Diferentes instructores SÍ pueden registrar notas independientes para el mismo alumno.)
  const existing = await getExamsByCourse(data.courseId);
  const duplicate = existing.find(
    (e) =>
      e.studentId    === data.studentId &&
      e.examType     === data.examType  &&
      e.instructorId === data.instructorId
  );
  if (duplicate) {
    const typeName = data.examType === "theory" ? "teórico" : "práctico";
    throw new Error(
      `Ya registraste un examen ${typeName} para este estudiante en el curso. Usa la opción de editar.`
    );
  }

  const { passed, status } = resolveStatus(data.score);

  const payload = {
    ...data,
    passed,
    status,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, "exams"), payload);
  return { id: ref.id, ...payload };
};

/* ==========================
   ACTUALIZAR EXAMEN
========================== */

/**
 * Actualiza el resultado de un examen existente.
 * Valida que el instructor solicitante sea el mismo que lo registró
 * O que tenga permiso en el curso para ese tipo de examen.
 */
export const updateExam = async (
  examId: string,
  exam: Exam,
  updates: { score?: number | null; notes?: string; examDate?: string },
  requestingInstructorId: string,
  course: Course
): Promise<void> => {
  // Solo puede editar quien tenga permiso sobre ese tipo
  assertExamPermission(requestingInstructorId, course, exam.examType);

  const newScore = "score" in updates ? updates.score ?? null : exam.score;
  const { passed, status } = resolveStatus(newScore);

  await updateDoc(doc(db, "exams", examId), {
    ...(updates.score !== undefined && { score: updates.score }),
    ...(updates.notes  !== undefined && { notes:  updates.notes  }),
    ...(updates.examDate !== undefined && { examDate: updates.examDate }),
    passed,
    status,
    updatedAt: Timestamp.now(),
  });
};

/* ==========================
   ELIMINAR EXAMEN
========================== */

/**
 * Elimina un examen.
 * Solo lo puede hacer un instructor con permiso sobre ese tipo en el curso.
 */
export const deleteExam = async (
  examId: string,
  exam: Exam,
  requestingInstructorId: string,
  course: Course
): Promise<void> => {
  assertExamPermission(requestingInstructorId, course, exam.examType);
  await deleteDoc(doc(db, "exams", examId));
};