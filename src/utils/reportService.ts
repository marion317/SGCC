// reportService.ts
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

/* ==========================
   INTERFACES
========================== */
export interface StudentReportItem {
  studentId: string;
  studentName: string;
  email: string;
  cedula?: string;
  courseName: string;
  courseCode: string;
  courseStatus: "activo" | "inactivo" | "completado";
  enrolledAt: any;
  theorySchedule: string;
  modality: string;
}

export interface ReportFilters {
  courseName?: string;   // nombre del curso, e.g. "A1"
  status?: "activo" | "inactivo" | "completado" | "";
  dateFrom?: string;     // ISO date string "YYYY-MM-DD"
  dateTo?: string;       // ISO date string "YYYY-MM-DD"
}

/* ==========================
   GENERAR REPORTE
========================== */
export const generateStudentReport = async (
  filters: ReportFilters
): Promise<StudentReportItem[]> => {
  // 1. Construir query para cursos según filtros de nombre y estado
  let coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"));

  if (filters.status) {
    coursesQuery = query(
      collection(db, "courses"),
      where("status", "==", filters.status),
      orderBy("createdAt", "desc")
    );
  }

  const coursesSnap = await getDocs(coursesQuery);
  const results: StudentReportItem[] = [];

  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const dateTo = filters.dateTo
    ? new Date(filters.dateTo + "T23:59:59")
    : null;

  for (const courseDoc of coursesSnap.docs) {
    const course = courseDoc.data();

    // Filtro por nombre de curso
    if (filters.courseName && course.name !== filters.courseName) continue;

    const students: Array<{
      uid: string;
      id: string;
      name: string;
      email: string;
      username: string;
    }> = course.students ?? [];

    for (const student of students) {
      // Filtro por rango de fechas (usamos createdAt del curso como proxy
      // de inscripción — si tienes enrolledAt por estudiante, úsalo aquí)
      if (dateFrom || dateTo) {
        const courseCreated: Date =
          course.createdAt instanceof Timestamp
            ? course.createdAt.toDate()
            : new Date(course.createdAt);
        if (dateFrom && courseCreated < dateFrom) continue;
        if (dateTo && courseCreated > dateTo) continue;
      }

      // Obtener datos adicionales del usuario desde la colección "users"
      const usersQ = query(
        collection(db, "users"),
        where("uid", "==", student.uid)
      );
      const userSnap = await getDocs(usersQ);
      const userData = userSnap.docs[0]?.data();

      results.push({
        studentId: student.uid,
        studentName: student.name,
        email: student.email,
        cedula: userData?.cedula ?? "—",
        courseName: course.name,
        courseCode: course.code,
        courseStatus: course.status,
        enrolledAt: course.createdAt,
        theorySchedule: course.theorySchedule,
        modality: course.modality,
      });
    }
  }

  return results;
};

/* ==========================
   HELPER: Timestamp → string
========================== */
export const formatTimestamp = (ts: any): string => {
  if (!ts) return "—";
  const date: Date =
    ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};