// courseService.ts
import { db } from "../firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, Timestamp, query, where,
} from "firebase/firestore";
import { createAuditLog, getCurrentAuditActor } from "./auditService";

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
/* ==========================
   VALIDAR NOMBRE ÚNICO
========================== */
const assertUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const normalize = (s: string) => s.trim().toLowerCase();
  const target = normalize(name);
  const snap = await getDocs(collection(db, "courses"));
  const duplicate = snap.docs.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    const existing = d.data().name as string;
    return normalize(existing) === target;
  });
  if (duplicate) throw new Error(`Ya existe un curso con el nombre "${name}". Elige otro nombre.`);
};

/**
 * Evita que una persona quede en dos grupos con el mismo horario teórico.
 */
const assertNoScheduleConflict = async (
  personId: string,
  personRole: "student" | "instructor",
  targetCourse: Course
): Promise<void> => {
  const all = await getCourses();
  const collisions = all.filter((c) => {
    if (c.id === targetCourse.id) return false;
    if (c.theorySchedule !== targetCourse.theorySchedule) return false;
    if (personRole === "student") {
      return c.students.some((s) => s.id === personId);
    }
    return (
      c.theoryInstructors.some((i) => i.id === personId) ||
      c.practiceInstructors.some((i) => i.id === personId)
    );
  });

  if (collisions.length === 0) return;
  const label = personRole === "student" ? "estudiante" : "instructor";
  const groups = collisions.map((c) => `Clase ${c.name} (${c.code})`).join(", ");
  throw new Error(
    `Conflicto de horario: este ${label} ya está asignado en otro grupo con el mismo horario (${groups}).`
  );
};

/**
 * Evita que un estudiante quede inscrito en más de un curso.
 * Si intenta inscribirse en un segundo curso, se bloquea.
 */
const assertStudentSingleCourse = async (
  studentId: string,
  targetCourseId: string
): Promise<void> => {
  const all = await getCourses();
  const otherCourses = all.filter((c) => {
    if (c.id === targetCourseId) return false;
    return c.students.some((s) => s.id === studentId);
  });

  if (otherCourses.length > 0) {
    const other = otherCourses[0];
    throw new Error(
      `El estudiante ya está inscrito en otro curso (${other.name} · ${other.code}).`
    );
  }
};

export const createCourse = async (data: CourseInput): Promise<Course> => {
  const actor = getCurrentAuditActor();
  await assertUniqueName(data.name);
  const capacity = Math.min(data.capacity, MAX_CAPACITY);
  const code = await generateCourseCode();
  const ref = await addDoc(collection(db, "courses"), {
    ...data, capacity, code,
    theoryInstructors: [], practiceInstructors: [], students: [],
    createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
  void createAuditLog({
    action: "create_course",
    module: "courses",
    details: `Se creó curso ${data.name} (${code})`,
    actorOverride: actor,
  }).catch(() => {});
  return { id: ref.id, ...data, capacity, code,
    theoryInstructors: [], practiceInstructors: [], students: [],
    createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
};

export const updateCourse = async (id: string, data: Partial<CourseInput>): Promise<void> => {
  const actor = getCurrentAuditActor();
  if (data.name) await assertUniqueName(data.name, id);
  const payload: any = { ...data, updatedAt: Timestamp.now() };
  if (payload.capacity) payload.capacity = Math.min(payload.capacity, MAX_CAPACITY);
  await updateDoc(doc(db, "courses", id), payload);
  void createAuditLog({
    action: "update_course",
    module: "courses",
    details: `Se actualizó curso ${id}`,
    actorOverride: actor,
  }).catch(() => {});
};

export const deleteCourse = async (id: string): Promise<void> => {
  const actor = getCurrentAuditActor();
  await deleteDoc(doc(db, "courses", id));
  void createAuditLog({
    action: "delete_course",
    module: "courses",
    details: `Se eliminó curso ${id}`,
    actorOverride: actor,
  }).catch(() => {});
};

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
  const actor = getCurrentAuditActor();
  const user = await findUserByUsername(username, "instructor");
  if (!user) throw new Error(`No existe un instructor con el código "${username}"`);

  // Regla: una clase/práctica solo puede tener un profesor específico (único)
  if (type === "practice" && course.practiceInstructors.length > 0) {
    throw new Error("Este curso ya tiene un profesor de práctica asignado. Debe ser único.");
  }

  const listKey  = type === "theory" ? "theoryInstructors" : "practiceInstructors";
  const maxLimit = type === "theory" ? MAX_THEORY_INSTRUCTORS : MAX_PRACTICE_INSTRUCTORS;
  const list: CourseInstructor[] = type === "theory"
    ? course.theoryInstructors : course.practiceInstructors;

  const inAny = course.theoryInstructors.some((i) => i.id === user.id) ||
    course.practiceInstructors.some((i) => i.id === user.id);
  if (inAny) throw new Error("Este instructor ya está asignado al curso");
  await assertNoScheduleConflict(user.id, "instructor", course);
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
  void createAuditLog({
    action: "assign_instructor",
    module: "instructors",
    details: `Asignado instructor ${instructor.name} a curso ${courseId} (${type})`,
    actorOverride: actor,
  }).catch(() => {});
  return instructor;
};

export const updatePracticeSlots = async (
  courseId: string, course: Course, instructorId: string, slots: string[]
): Promise<void> => {
  const actor = getCurrentAuditActor();
  const updated = course.practiceInstructors.map((i) =>
    i.id === instructorId ? { ...i, practiceSlots: slots } : i
  );
  await updateDoc(doc(db, "courses", courseId), {
    practiceInstructors: updated, updatedAt: Timestamp.now(),
  });
  void createAuditLog({
    action: "update_instructor_slots",
    module: "instructors",
    details: `Actualizados horarios de práctica para instructor ${instructorId} en curso ${courseId}`,
    actorOverride: actor,
  }).catch(() => {});
};

export const removeInstructorFromCourse = async (
  courseId: string, course: Course, instructorId: string, type: "theory"|"practice"
): Promise<void> => {
  const actor = getCurrentAuditActor();
  const listKey = type === "theory" ? "theoryInstructors" : "practiceInstructors";
  const list    = type === "theory" ? course.theoryInstructors : course.practiceInstructors;
  await updateDoc(doc(db, "courses", courseId), {
    [listKey]: list.filter((i) => i.id !== instructorId), updatedAt: Timestamp.now(),
  });
  void createAuditLog({
    action: "remove_instructor",
    module: "instructors",
    details: `Removido instructor ${instructorId} de curso ${courseId} (${type})`,
    actorOverride: actor,
  }).catch(() => {});
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

  // Regla: una clase práctica únicamente puede tener un alumno
  // (en este modelo, la práctica depende de que el curso tenga profesor de práctica asignado)
  if (course.practiceInstructors.length > 0 && course.students.length >= 1) {
    throw new Error("Este curso tiene práctica asignada y solo permite un estudiante.");
  }

  await assertNoScheduleConflict(user.id, "student", course);
  await assertStudentSingleCourse(user.id, courseId);
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

  if (course.practiceInstructors.length > 0 && course.students.length >= 1) {
    throw new Error("Este curso tiene práctica asignada y solo permite un estudiante.");
  }

  await assertNoScheduleConflict(student.id, "student", course);
  await assertStudentSingleCourse(student.id, d.id);
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