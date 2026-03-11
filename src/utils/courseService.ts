// courseService.ts
import { db } from "../firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, Timestamp, query, where,
} from "firebase/firestore";

/* ==========================
   CONSTANTES
========================== */
export const COURSE_NAMES = [
  "A1","A2","A3","B1","B2","B3",
  "C1","C2","C3","D1","D2","E1","E2",
] as const;
export type CourseName = (typeof COURSE_NAMES)[number];

export const MAX_CAPACITY             = 50;
export const MAX_THEORY_INSTRUCTORS   = 5;
export const MAX_PRACTICE_INSTRUCTORS = 10;

/* ==========================
   SLOTS DE PRÁCTICA (7am–7pm, sin 12–14)
========================== */
export const PRACTICE_TIME_SLOTS = [
  "07:00 - 08:00","08:00 - 09:00","09:00 - 10:00",
  "10:00 - 11:00","11:00 - 12:00",
  "14:00 - 15:00","15:00 - 16:00",
  "16:00 - 17:00","17:00 - 18:00","18:00 - 19:00",
] as const;
export type PracticeSlot = (typeof PRACTICE_TIME_SLOTS)[number];

/* ==========================
   HORARIOS TEORÍA
========================== */
export interface ScheduleOption {
  value: string; label: string; days: string; time: string; note?: string;
}
export const THEORY_SCHEDULES: ScheduleOption[] = [
  { value:"lv-m-a", label:"Lun-Vie · Mañana A", days:"Lunes a Viernes", time:"7:00 a.m. – 9:00 a.m."  },
  { value:"lv-m-b", label:"Lun-Vie · Mañana B", days:"Lunes a Viernes", time:"10:00 a.m. – 12:00 m." },
  { value:"lv-t",   label:"Lun-Vie · Tarde",    days:"Lunes a Viernes", time:"2:00 p.m. – 6:00 p.m."  },
  { value:"lv-n",   label:"Lun-Vie · Noche",    days:"Lunes a Viernes", time:"6:30 p.m. – 9:00 p.m.", note:"Trabajadores" },
  { value:"ls-m-a", label:"Lun-Sáb · Mañana A", days:"Lunes a Sábado",  time:"7:00 a.m. – 9:00 a.m."  },
  { value:"ls-m-b", label:"Lun-Sáb · Mañana B", days:"Lunes a Sábado",  time:"10:00 a.m. – 12:00 m." },
  { value:"ls-t",   label:"Lun-Sáb · Tarde",    days:"Lunes a Sábado",  time:"2:00 p.m. – 6:00 p.m."  },
  { value:"ls-n",   label:"Lun-Sáb · Noche",    days:"Lunes a Sábado",  time:"6:30 p.m. – 9:00 p.m.", note:"Trabajadores" },
  { value:"sab-int",label:"Sábado · Intensivo",  days:"Sábados",         time:"8:00 a.m. – 1:00 p.m.", note:"Jornada intensiva" },
];

/* ==========================
   MODALIDADES
========================== */
export interface ModalityOption { value:string; label:string; description:string; }
export const MODALITIES: ModalityOption[] = [
  { value:"normal",     label:"Curso Normal",    description:"1–2 h/día · 3–4 semanas" },
  { value:"intensivo",  label:"Curso Intensivo", description:"Máx. diario · 15–20 días" },
  { value:"pedagogico", label:"Pedagógico",      description:"Lun-Vie · 8:00 a.m. – 6:00 p.m." },
];

/* ==========================
   INTERFACES
========================== */
export interface CourseInstructor {
  id: string; uid: string; name: string; email: string; username: string;
  practiceSlots?: string[];
}
export interface CourseStudent {
  id: string; uid: string; name: string; email: string; username: string;
}
export interface Course {
  id: string;
  name: CourseName | string;
  code: string;
  description: string;
  theorySchedule: string;
  modality: string;
  theoryInstructors: CourseInstructor[];
  practiceInstructors: CourseInstructor[];
  students: CourseStudent[];
  capacity: number;
  status: "activo" | "inactivo" | "completado";
  createdAt: any;
  updatedAt: any;
}
export type CourseInput = Omit<
  Course,"id"|"code"|"createdAt"|"updatedAt"|
  "theoryInstructors"|"practiceInstructors"|"students"
>;

/* ==========================
   HELPERS
========================== */
export const getScheduleLabel = (value: string): string => {
  const s = THEORY_SCHEDULES.find((x) => x.value === value);
  return s ? `${s.days} · ${s.time}` : value;
};
export const getModalityLabel = (value: string): string =>
  MODALITIES.find((m) => m.value === value)?.label ?? value;

/* ==========================
   OBTENER CURSOS
========================== */
export const getCourses = async (): Promise<Course[]> => {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Course,"id">),
    theoryInstructors:   (d.data().theoryInstructors   as CourseInstructor[]) ?? [],
    practiceInstructors: (d.data().practiceInstructors as CourseInstructor[]) ?? [],
    students:            (d.data().students            as CourseStudent[])    ?? [],
  }));
};

/* ==========================
   GENERAR CÓDIGO 230-YYYY-NNN
========================== */
const generateCourseCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const snap = await getDocs(collection(db, "courses"));
  const count = snap.docs.filter((d) =>
    ((d.data().code as string) ?? "").startsWith(`230${year}`)
  ).length;
  return `230${year}${String(count + 1).padStart(3,"0")}`;
};

/* ==========================
   CREAR / ACTUALIZAR / ELIMINAR
========================== */
export const createCourse = async (data: CourseInput): Promise<Course> => {
  const capacity = Math.min(data.capacity, MAX_CAPACITY);
  const code = await generateCourseCode();
  const ref = await addDoc(collection(db, "courses"), {
    ...data, capacity, code,
    theoryInstructors: [], practiceInstructors: [], students: [],
    createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
  return { id: ref.id, ...data, capacity, code,
    theoryInstructors: [], practiceInstructors: [], students: [],
    createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
};

export const updateCourse = async (id: string, data: Partial<CourseInput>): Promise<void> => {
  const payload: any = { ...data, updatedAt: Timestamp.now() };
  if (payload.capacity) payload.capacity = Math.min(payload.capacity, MAX_CAPACITY);
  await updateDoc(doc(db, "courses", id), payload);
};

export const deleteCourse = async (id: string): Promise<void> =>
  deleteDoc(doc(db, "courses", id));

/* ==========================
   BUSCAR USUARIO POR USERNAME
========================== */
export const findUserByUsername = async (username: string, role: "instructor"|"student") => {
  const q = query(
    collection(db, "users"),
    where("username", "==", username.trim()),
    where("role", "==", role)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) };
};

/* ==========================
   INSTRUCTORES
========================== */
export const addInstructorByCode = async (
  courseId: string, course: Course,
  username: string, type: "theory"|"practice",
  practiceSlots?: string[]
): Promise<CourseInstructor> => {
  const user = await findUserByUsername(username, "instructor");
  if (!user) throw new Error(`No existe un instructor con el código "${username}"`);

  const listKey  = type === "theory" ? "theoryInstructors" : "practiceInstructors";
  const maxLimit = type === "theory" ? MAX_THEORY_INSTRUCTORS : MAX_PRACTICE_INSTRUCTORS;
  const list: CourseInstructor[] = type === "theory"
    ? course.theoryInstructors : course.practiceInstructors;

  const inAny = course.theoryInstructors.some((i) => i.id === user.id) ||
    course.practiceInstructors.some((i) => i.id === user.id);
  if (inAny) throw new Error("Este instructor ya está asignado al curso");
  if (list.length >= maxLimit)
    throw new Error(`Límite de ${maxLimit} profesores de ${type === "theory" ? "teoría" : "práctica"} alcanzado`);

  const instructor: CourseInstructor = {
    id: user.id, uid: user.uid,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email, username: user.username,
    ...(type === "practice" && practiceSlots ? { practiceSlots } : {}),
  };
  await updateDoc(doc(db, "courses", courseId), {
    [listKey]: [...list, instructor], updatedAt: Timestamp.now(),
  });
  return instructor;
};

export const updatePracticeSlots = async (
  courseId: string, course: Course, instructorId: string, slots: string[]
): Promise<void> => {
  const updated = course.practiceInstructors.map((i) =>
    i.id === instructorId ? { ...i, practiceSlots: slots } : i
  );
  await updateDoc(doc(db, "courses", courseId), {
    practiceInstructors: updated, updatedAt: Timestamp.now(),
  });
};

export const removeInstructorFromCourse = async (
  courseId: string, course: Course, instructorId: string, type: "theory"|"practice"
): Promise<void> => {
  const listKey = type === "theory" ? "theoryInstructors" : "practiceInstructors";
  const list    = type === "theory" ? course.theoryInstructors : course.practiceInstructors;
  await updateDoc(doc(db, "courses", courseId), {
    [listKey]: list.filter((i) => i.id !== instructorId), updatedAt: Timestamp.now(),
  });
};

/* ==========================
   ESTUDIANTES
========================== */
export const addStudentByCode = async (
  courseId: string, course: Course, username: string
): Promise<CourseStudent> => {
  const user = await findUserByUsername(username, "student");
  if (!user) throw new Error(`No existe un estudiante con el código "${username}"`);
  if (course.students.some((s) => s.id === user.id))
    throw new Error("El estudiante ya está inscrito en este curso");
  if (course.students.length >= course.capacity)
    throw new Error(`El curso alcanzó su capacidad máxima (${course.capacity})`);

  const student: CourseStudent = {
    id: user.id, uid: user.uid,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email, username: user.username,
  };
  await updateDoc(doc(db, "courses", courseId), {
    students: [...course.students, student], updatedAt: Timestamp.now(),
  });
  return student;
};

export const removeStudentFromCourse = async (
  courseId: string, course: Course, studentId: string
): Promise<void> => {
  await updateDoc(doc(db, "courses", courseId), {
    students: course.students.filter((s) => s.id !== studentId),
    updatedAt: Timestamp.now(),
  });
};

/* ==========================
   AUTO-MATRÍCULA POR CÓDIGO DE CURSO
========================== */
export const enrollStudentByCourseCode = async (
  courseCode: string, student: CourseStudent
): Promise<Course> => {
  const snap = await getDocs(query(
    collection(db, "courses"), where("code", "==", courseCode.trim())
  ));
  if (snap.empty) throw new Error(`No existe un curso con el código "${courseCode}"`);

  const d = snap.docs[0];
  const data = d.data();
  const course: Course = {
    id: d.id, ...(data as Omit<Course,"id">),
    theoryInstructors:   (data.theoryInstructors   as CourseInstructor[]) ?? [],
    practiceInstructors: (data.practiceInstructors as CourseInstructor[]) ?? [],
    students:            (data.students            as CourseStudent[])    ?? [],
  };
  if (course.status !== "activo")  throw new Error("Este curso no está activo");
  if (course.students.some((s) => s.id === student.id))
    throw new Error("Ya estás inscrito en este curso");
  if (course.students.length >= course.capacity)
    throw new Error("El curso está lleno");

  await updateDoc(doc(db, "courses", d.id), {
    students: [...course.students, student], updatedAt: Timestamp.now(),
  });
  return { ...course, students: [...course.students, student] };
};

/* ==========================
   CURSOS POR ESTUDIANTE / INSTRUCTOR
========================== */
export const getCoursesByStudentId = async (studentId: string): Promise<Course[]> => {
  const all = await getCourses();
  return all.filter((c) => c.students.some((s) => s.id === studentId));
};

export const getCoursesByInstructorId = async (instructorId: string): Promise<Course[]> => {
  const all = await getCourses();
  return all.filter((c) =>
    c.theoryInstructors.some((i) => i.id === instructorId) ||
    c.practiceInstructors.some((i) => i.id === instructorId)
  );
};