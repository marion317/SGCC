// authService.ts
// authService.ts
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

/* ==========================
   INTERFACES
========================== */
export interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: "student" | "admin" | "instructor";
  firstName: string;
  lastName: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: string;
  createdAt: any;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: string;
}

/* ==========================
   GENERAR CONTRASEÑA
========================== */
export const generatePassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

/* ==========================
   OBTENER TODOS LOS USUARIOS
========================== */
export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<User, "id">),
  }));
};

/* ==========================
   VERIFICAR USERNAME ÚNICO
========================== */
export const isUsernameAvailable = async (
  username: string,
  excludeId?: string
): Promise<boolean> => {
  const q = query(
    collection(db, "users"),
    where("username", "==", username.trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId)
    return true;
  return false;
};

/* ==========================
   REGISTRAR ADMIN
========================== */
export const registerAdmin = async (data: RegisterData) => {
  const { email, password, username, firstName, lastName } = data;
  if (!(await isUsernameAvailable(username)))
    throw new Error("El código de usuario ya está en uso");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await addDoc(collection(db, "users"), {
    uid: cred.user.uid,
    email, username, firstName, lastName,
    role: "admin",
    createdAt: Timestamp.now(),
  });
  return { success: true };
};

/* ==========================
   REGISTRAR INSTRUCTOR
========================== */
export const registerInstructor = async (data: RegisterData) => {
  const { email, password, username, firstName, lastName } = data;
  if (!(await isUsernameAvailable(username)))
    throw new Error("El código de usuario ya está en uso");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await addDoc(collection(db, "users"), {
    uid: cred.user.uid,
    email, username, firstName, lastName,
    role: "instructor",
    createdAt: Timestamp.now(),
  });
  return { success: true };
};

/* ==========================
   REGISTRAR ESTUDIANTE
========================== */
export const registerStudent = async (data: RegisterData) => {
  const {
    email, password, username, firstName, lastName,
    cedula, telefono, direccion, fechaNacimiento, genero,
  } = data;
  if (!(await isUsernameAvailable(username)))
    throw new Error("El código de usuario ya está en uso");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await addDoc(collection(db, "users"), {
    uid: cred.user.uid,
    email, username, firstName, lastName,
    cedula:          cedula          || "",
    telefono:        telefono        || "",
    direccion:       direccion       || "",
    fechaNacimiento: fechaNacimiento || "",
    genero:          genero          || "",
    role: "student",
    createdAt: Timestamp.now(),
  });
  return { success: true, password };
};

/* ==========================
   CAMBIAR ROL
========================== */
export const changeUserRole = async (
  id: string,
  newRole: "student" | "admin" | "instructor"
): Promise<void> => {
  await updateDoc(doc(db, "users", id), {
    role: newRole,
    updatedAt: Timestamp.now(),
  });
};

/* ==========================
   ELIMINAR USUARIO
========================== */
export const deleteUser = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
  return { success: true };
};

/* ==========================
   RECUPERAR CONTRASEÑA
========================== */
export const requestPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
  return { success: true, message: "Correo de recuperación enviado." };
};