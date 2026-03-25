import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ShieldAlert, RefreshCw, FileSearch } from "lucide-react";
import {
  AuditLog,
  AuditLogFilters,
  AuditModule,
  listAuditLogs,
} from "../utils/auditService";

interface AuditLogsProps {
  userRole: "student" | "admin" | "instructor";
}

const MODULE_OPTIONS: Array<{ value: AuditModule | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "auth", label: "Autenticación" },
  { value: "users", label: "Usuarios" },
  { value: "roles", label: "Roles" },
  { value: "courses", label: "Cursos" },
  { value: "instructors", label: "Instructores" },
  { value: "reports", label: "Reportes" },
  { value: "system", label: "Sistema" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "login", label: "Inicio de sesión" },
  { value: "logout", label: "Cierre de sesión" },
  { value: "create_user_admin", label: "Crear admin" },
  { value: "create_user_instructor", label: "Crear instructor" },
  { value: "create_user_student", label: "Crear estudiante" },
  { value: "change_user_role", label: "Cambio de rol" },
  { value: "delete_user", label: "Eliminar usuario" },
  { value: "create_course", label: "Crear curso" },
  { value: "update_course", label: "Actualizar curso" },
  { value: "delete_course", label: "Eliminar curso" },
  { value: "assign_instructor", label: "Asignar instructor" },
  { value: "remove_instructor", label: "Remover instructor" },
  { value: "update_instructor_slots", label: "Actualizar horarios instructor" },
];

function formatDate(ts: any): string {
  if (!ts) return "—";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("es-CO");
}

export function AuditLogs({ userRole }: AuditLogsProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    actorEmail: "",
    action: "",
    module: "all",
    fromDate: "",
    toDate: "",
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAuditLogs({
        actorEmail: filters.actorEmail?.trim() || undefined,
        action: filters.action?.trim() || undefined,
        module: (filters.module || "all") as AuditModule | "all",
        fromDate: filters.fromDate?.trim() || undefined,
        toDate: filters.toDate?.trim() || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      toast.error(err?.message || "No se pudieron cargar los logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (userRole === "admin") {
      void loadLogs();
    }
  }, [userRole]);

  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm">Solo administradores pueden ver auditoría.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoría del sistema</h1>
        <p className="text-gray-500 text-sm mt-1">
          Registro detallado para trazabilidad, seguridad y detección de cambios no autorizados.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filtros de consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Email usuario</Label>
              <Input
                placeholder="admin@correo.com"
                value={filters.actorEmail || ""}
                onChange={(e) => setFilters((f) => ({ ...f, actorEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Acción</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, action: v === "all" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Módulo</Label>
              <Select
                value={(filters.module as string) || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, module: v as AuditModule | "all" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input
                type="date"
                value={filters.fromDate || ""}
                onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filters.toDate || ""}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => void loadLogs()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Buscar logs
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFilters({
                  actorEmail: "",
                  action: "",
                  module: "all",
                  fromDate: "",
                  toDate: "",
                })
              }
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <p className="text-center py-12 text-gray-400">Cargando...</p>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
              <FileSearch className="w-10 h-10 opacity-30" />
              <p>No se encontraron logs con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDate(l.createdAt)}</TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{l.actorName || "Usuario"}</p>
                        <p className="text-gray-500">{l.actorEmail}</p>
                      </TableCell>
                      <TableCell>{l.actorRole}</TableCell>
                      <TableCell className="font-mono text-xs">{l.action}</TableCell>
                      <TableCell>{l.module}</TableCell>
                      <TableCell className="text-sm text-gray-700">{l.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
