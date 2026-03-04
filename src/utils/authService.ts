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
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

/* ==========================
   INTERFACE
========================== */
export interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: "student" | "admin" | "instructor";
  firstName: string;
  lastName: string;
  createdAt: any;
}

/* ==========================
   OBTENER USUARIOS
========================== */
export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<User, "id">),
  }));
};

/* ==========================
   REGISTRAR ADMIN
========================== */
export const registerAdmin = async (data: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const { email, password, username, firstName, lastName } = data;

  // 🔥 1. Crear usuario en Firebase Auth
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // 🔥 2. Guardar datos en Firestore (SIN contraseña)
  await addDoc(collection(db, "users"), {
    uid: cred.user.uid,
    email,
    username,
    firstName,
    lastName,
    role: "admin",
    createdAt: Timestamp.now(),
  });

  return { success: true, message: "Administrador registrado" };
};

/* ==========================
   REGISTRAR INSTRUCTOR
========================== */
export const registerInstructor = async (data: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const { email, password, username, firstName, lastName } = data;

  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await addDoc(collection(db, "users"), {
    uid: cred.user.uid,
    email,
    username,
    firstName,
    lastName,
    role: "instructor",
    createdAt: Timestamp.now(),
  });

  return { success: true, message: "Instructor registrado" };
};

/* ==========================
   ELIMINAR USUARIO (Firestore)
========================== */
export const deleteUser = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
  return { success: true, message: "Usuario eliminado" };
};

/* ==========================
   RECUPERAR CONTRASEÑA (EMAIL)
========================== */
export const requestPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);

  return {
    success: true,
    message: "Correo de recuperación enviado. Revisa tu email.",
  };
};