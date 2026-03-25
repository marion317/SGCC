// notificationService.ts
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

/* ==========================
   INTERFACES
========================== */
export interface Notification {
  id: string;
  userId: string;          // destinatario (uid o "all" para todos)
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: any;
  createdBy?: string;      // uid del remitente (admin)
  link?: string;           // vista a la que lleva al hacer clic
}

export type CreateNotificationData = Omit<Notification, "id" | "createdAt" | "read">;

const COLLECTION = "notifications";

/* ==========================
   OBTENER NOTIFICACIONES DEL USUARIO
========================== */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  // Trae las notificaciones dirigidas al usuario específico O a "all"
  const q = query(
    collection(db, COLLECTION),
    where("userId", "in", [userId, "all"]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
};

/* ==========================
   MARCAR UNA COMO LEÍDA
========================== */
export const markAsRead = async (notificationId: string): Promise<void> => {
  const ref = doc(db, COLLECTION, notificationId);
  await updateDoc(ref, { read: true });
};

/* ==========================
   MARCAR TODAS COMO LEÍDAS
========================== */
export const markAllAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "in", [userId, "all"]),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};

/* ==========================
   CREAR NOTIFICACIÓN (admin)
========================== */
export const createNotification = async (
  data: CreateNotificationData
): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    read: false,
    createdAt: Timestamp.now(),
  });
  return ref.id;
};

/* ==========================
   CREAR NOTIFICACIÓN PARA TODOS
========================== */
export const broadcastNotification = async (
  title: string,
  message: string,
  type: Notification["type"] = "info",
  createdBy?: string
): Promise<string> => {
  return createNotification({ userId: "all", title, message, type, createdBy });
};

/* ==========================
   OBTENER TODAS (solo admin)
========================== */
export const getAllNotifications = async (): Promise<Notification[]> => {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
};