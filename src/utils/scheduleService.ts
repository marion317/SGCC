// scheduleService.ts
import { db } from "../firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, Timestamp,
} from "firebase/firestore";
import { getCoursesByStudentId, getCoursesByInstructorId } from "./courseService";

/* ==========================
   INTERFACES
========================== */
export interface ClassSession {
  id: string;
  courseId: string;
  courseName: string;   // "Clase A1"
  courseCode: string;
  date: string;         // "2025-07-14" (YYYY-MM-DD)
  startTime: string;    // "07:00"
  endTime: string;      // "09:00"
  type: "teoria" | "practica";
  topic: string;
  createdAt: any;
}

export type SessionInput = Omit<ClassSession, "id" | "createdAt">;

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  date: string;
  status: "presente" | "ausente" | "tardanza";
  markedAt: any;
}

export interface AttendanceSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  total: number;
  present: number;       // presente + tardanza
  absent: number;
  percentage: number;    // (present / total) * 100
  lowAlert: boolean;     // < 80%
}

/* ==========================
   SESIONES — CRUD
========================== */
export const createSession = async (data: SessionInput): Promise<void> => {
  await addDoc(collection(db, "classSessions"), {
    ...data,
    createdAt: Timestamp.now(),
  });
};

export const getSessions = async (): Promise<ClassSession[]> => {
  const snap = await getDocs(collection(db, "classSessions"));
  const sessions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassSession, "id">) }));
  return sessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
};

export const getSessionsByCourse = async (courseId: string): Promise<ClassSession[]> => {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where("courseId", "==", courseId))
  );
  const sessions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassSession, "id">) }));
  return sessions.sort((a, b) => a.date.localeCompare(b.date));
};

/** Busca una sesión existente para curso + fecha. Si no existe, la crea. */
export const findOrCreateSessionForCourseDate = async (
  course: { id: string; name: string; code: string },
  date: string
): Promise<ClassSession> => {
  const sessions = await getSessionsByCourse(course.id);
  const existing = sessions.find((s) => s.date === date);
  if (existing) return existing;

  const sessionInput: SessionInput = {
    courseId: course.id,
    courseName: `Clase ${course.name}`,
    courseCode: course.code,
    date,
    startTime: "08:00",
    endTime: "10:00",
    type: "teoria",
    topic: "Clase",
  };
  await createSession(sessionInput);
  const updated = await getSessionsByCourse(course.id);
  const created = updated.find((s) => s.date === date);
  if (!created) throw new Error("No se pudo crear la sesión");
  return created;
};

export const deleteSession = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "classSessions", id));
};

/* ==========================
   SESIONES POR ESTUDIANTE
   (cursos en los que está inscrito)
========================== */
export const getSessionsByStudent = async (studentId: string): Promise<ClassSession[]> => {
  const courses = await getCoursesByStudentId(studentId);
  if (courses.length === 0) return [];
  const courseIds = courses.map((c) => c.id);

  // Firestore no permite "in" con más de 30 elementos, pero es suficiente
  const allSnap = await getDocs(collection(db, "classSessions"));
  const sessions = allSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ClassSession, "id">) }))
    .filter((s) => courseIds.includes(s.courseId));
  return sessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
};

/* ==========================
   SESIONES POR INSTRUCTOR
========================== */
export const getSessionsByInstructor = async (instructorId: string): Promise<ClassSession[]> => {
  const courses = await getCoursesByInstructorId(instructorId);
  if (courses.length === 0) return [];
  const courseIds = courses.map((c) => c.id);

  const allSnap = await getDocs(collection(db, "classSessions"));
  const sessions = allSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ClassSession, "id">) }))
    .filter((s) => courseIds.includes(s.courseId));
  return sessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
};

/* ==========================
   ASISTENCIA
========================== */
export const markAttendance = async (
  session: ClassSession,
  studentId: string,
  studentName: string,
  status: AttendanceRecord["status"]
): Promise<void> => {
  // Verificar si ya existe un registro para esta sesión y estudiante
  const existing = await getDocs(
    query(
      collection(db, "attendance"),
      where("sessionId", "==", session.id),
      where("studentId", "==", studentId)
    )
  );

  const data = {
    sessionId: session.id,
    courseId: session.courseId,
    courseName: session.courseName,
    studentId,
    studentName,
    date: session.date,
    status,
    markedAt: Timestamp.now(),
  };

  if (!existing.empty) {
    // Actualizar registro existente
    await updateDoc(doc(db, "attendance", existing.docs[0].id), data);
  } else {
    await addDoc(collection(db, "attendance"), data);
  }
};

export const getAttendanceByStudent = async (studentId: string): Promise<AttendanceRecord[]> => {
  const snap = await getDocs(
    query(collection(db, "attendance"), where("studentId", "==", studentId))
  );
  const records = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, "id">) }));
  return records.sort((a, b) => a.date.localeCompare(b.date));
};

export const getAttendanceBySession = async (sessionId: string): Promise<AttendanceRecord[]> => {
  const snap = await getDocs(
    query(collection(db, "attendance"), where("sessionId", "==", sessionId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, "id">) }));
};

/* ==========================
   RESUMEN DE ASISTENCIA POR ESTUDIANTE
   Calcula % por curso y emite alerta si < 80%
========================== */
export const getAttendanceSummaryByStudent = async (
  studentId: string
): Promise<AttendanceSummary[]> => {
  const [sessions, records, courses] = await Promise.all([
    getSessionsByStudent(studentId),
    getAttendanceByStudent(studentId),
    getCoursesByStudentId(studentId),
  ]);

  const ALERT_THRESHOLD = 80;

  return courses.map((course) => {
    const courseSessions = sessions.filter((s) => s.courseId === course.id);
    const courseRecords  = records.filter((r) => r.courseId === course.id);

    // Solo contar sesiones pasadas o de hoy
    const today = new Date().toISOString().split("T")[0];
    const past  = courseSessions.filter((s) => s.date <= today);

    const total   = past.length;
    const present = courseRecords.filter(
      (r) => r.status === "presente" || r.status === "tardanza"
    ).length;
    const absent     = total - present;
    const percentage = total === 0 ? 100 : Math.round((present / total) * 100);

    return {
      courseId:   course.id,
      courseName: `Clase ${course.name}`,
      courseCode: course.code,
      total,
      present,
      absent,
      percentage,
      lowAlert: total > 0 && percentage < ALERT_THRESHOLD,
    };
  });
};
