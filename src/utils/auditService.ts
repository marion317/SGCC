import { auth, db } from "../firebase";
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export interface AuditActor {
  id: string;
  email: string;
  role: "student" | "admin" | "instructor" | "unknown";
  displayName: string;
}

export type AuditModule =
  | "auth"
  | "users"
  | "courses"
  | "roles"
  | "instructors"
  | "reports"
  | "system";

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  actorName: string;
  action: string;
  module: AuditModule;
  details: string;
  createdAt: any;
}

export interface AuditLogFilters {
  actorEmail?: string;
  action?: string;
  module?: AuditModule | "all";
  fromDate?: string;
  toDate?: string;
}

const STORAGE_KEY = "sgcc_audit_actor";
let actorContext: AuditActor | null = null;

export function setAuditActorContext(actor: AuditActor): void {
  actorContext = actor;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actor));
  } catch {
    // ignore storage failures
  }
}

export function clearAuditActorContext(): void {
  actorContext = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

function getStoredActor(): AuditActor | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuditActor;
  } catch {
    return null;
  }
}

export function getCurrentAuditActor(): AuditActor {
  const cached = actorContext || getStoredActor();
  if (cached) return cached;

  const current = auth.currentUser;
  return {
    id: current?.uid ?? "anonymous",
    email: current?.email ?? "desconocido",
    role: "unknown",
    displayName: current?.displayName || current?.email || "Usuario",
  };
}

export async function createAuditLog(params: {
  action: string;
  module: AuditModule;
  details: string;
  actorOverride?: AuditActor;
}): Promise<void> {
  const actor = params.actorOverride || getCurrentAuditActor();
  await addDoc(collection(db, "auditLogs"), {
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    actorName: actor.displayName,
    action: params.action,
    module: params.module,
    details: params.details,
    createdAt: Timestamp.now(),
  });
}

export async function listAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLog[]> {
  const base = collection(db, "auditLogs");
  const clauses: any[] = [];

  if (filters.actorEmail?.trim()) {
    clauses.push(where("actorEmail", "==", filters.actorEmail.trim()));
  }
  if (filters.action?.trim()) {
    clauses.push(where("action", "==", filters.action.trim()));
  }
  if (filters.module && filters.module !== "all") {
    clauses.push(where("module", "==", filters.module));
  }

  const snap = clauses.length > 0 ? await getDocs(query(base, ...clauses)) : await getDocs(base);
  let logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, "id">) }));

  if (filters.fromDate?.trim()) {
    logs = logs.filter((l) => {
      const date = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      const ymd = date.toISOString().slice(0, 10);
      return ymd >= filters.fromDate!;
    });
  }
  if (filters.toDate?.trim()) {
    logs = logs.filter((l) => {
      const date = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      const ymd = date.toISOString().slice(0, 10);
      return ymd <= filters.toDate!;
    });
  }

  logs.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const db = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return db - da;
  });

  return logs;
}
