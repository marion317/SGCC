/**
 * Capa tipo "endpoint" para auditoría.
 * En esta arquitectura cliente + Firestore, estas funciones
 * representan los endpoints de backend y facilitan migrar luego a Cloud Functions.
 */
import {
  AuditLog,
  AuditLogFilters,
  createAuditLog,
  listAuditLogs,
} from "./auditService";

export async function postAuditLogEndpoint(payload: {
  action: string;
  module: "auth" | "users" | "courses" | "roles" | "instructors" | "reports" | "system";
  details: string;
}): Promise<{ ok: true }> {
  await createAuditLog(payload);
  return { ok: true };
}

export async function getAuditLogsEndpoint(
  filters: AuditLogFilters
): Promise<AuditLog[]> {
  return listAuditLogs(filters);
}
