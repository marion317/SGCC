// src/components/NotificationManager.tsx
import { useState, useEffect, useCallback } from "react";
import {
  getAllNotifications,
  createNotification,
  Notification,
} from "../utils/notificationService";
import { getUsers } from "../utils/authService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
import { Badge } from "./ui/badge";
import { Bell, Send, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

/* ==============================
   HELPERS
============================== */
const TYPE_LABELS: Record<Notification["type"], string> = {
  info: "Información",
  success: "Éxito",
  warning: "Advertencia",
  error: "Error",
};

const TYPE_VARIANTS: Record<
  Notification["type"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  info: "default",
  success: "secondary",
  warning: "outline",
  error: "destructive",
};

const formatDate = (ts: any): string => {
  if (!ts) return "—";
  const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};

/* ==============================
   COMPONENTE
============================== */
interface NotificationManagerProps {
  currentUserId: string;
}

export function NotificationManager({ currentUserId }: NotificationManagerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      uid: string;
      firstName: string;
      lastName: string;
      email: string;
      role: "student" | "admin" | "instructor";
    }>
  >([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<Notification["type"]>("info");
  const [targetRole, setTargetRole] = useState<
    "students" | "instructors" | "both" | "individual"
  >("students");
  const [targetUid, setTargetUid] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const [notifs, userList] = await Promise.all([
        getAllNotifications(),
        getUsers(),
      ]);
      setNotifications(notifs);
      setUsers(userList);
    } catch (err: any) {
      toast.error("Error al cargar datos: " + (err?.message ?? ""));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (targetRole !== "individual") return;
    if (targetUid) return;
    const first = users.find((u) => u.role === "student" || u.role === "instructor");
    if (first) setTargetUid(first.uid);
  }, [targetRole, targetUid, users]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("El título y el mensaje son obligatorios.");
      return;
    }
    setSending(true);
    try {
      let recipients: string[] = [];

      if (targetRole === "individual") {
        const selected = users.find((u) => u.uid === targetUid);
        if (!selected || (selected.role !== "student" && selected.role !== "instructor")) {
          toast.error("Selecciona un usuario válido (estudiante o instructor).");
          return;
        }
        recipients = [selected.uid];
      } else {
        recipients = (users as any[])
          .filter((u) => u.role === "student" || u.role === "instructor")
          .filter((u) => {
            if (targetRole === "students") return u.role === "student";
            if (targetRole === "instructors") return u.role === "instructor";
            return u.role === "student" || u.role === "instructor";
          })
          .map((u) => u.uid as string);
      }

      if (recipients.length === 0) {
        toast.error("No hay usuarios con el/los rol(es) seleccionado(s).");
        return;
      }

      // En vez de 'broadcast' (que manda a admin también), creamos una notificación por usuario.
      await Promise.all(
        recipients.map((uid) =>
          createNotification({
            userId: uid,
            title: title.trim(),
            message: message.trim(),
            type,
            createdBy: currentUserId,
          })
        )
      );
      toast.success(
        `Notificación enviada ${
          targetRole === "individual"
            ? "al usuario seleccionado."
            : `a ${recipients.length} usuario(s) (${targetRole === "both" ? "estudiantes e instructores" : targetRole === "students" ? "estudiantes" : "instructores"}).`
        }`
      );

      setTitle("");
      setMessage("");
      setType("info");
      setTargetRole("students");
      setTargetUid("");
      await fetchAll();
    } catch (err: any) {
      toast.error("Error al enviar: " + (err?.message ?? ""));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Bell className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl">Gestión de Notificaciones</h2>
          <p className="text-sm text-gray-500">
            Envía notificaciones internas a usuarios del sistema
          </p>
        </div>
      </div>

      {/* Formulario de envío */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" />
            Nueva notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Destinatario por rol */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Destinatario
              </Label>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destinatario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Solo estudiantes</SelectItem>
                  <SelectItem value="instructors">Solo instructores</SelectItem>
                  <SelectItem value="both">Estudiantes e instructores</SelectItem>
                  <SelectItem value="individual">Usuario individual</SelectItem>
                </SelectContent>
              </Select>

              {targetRole === "individual" && (
                <div className="space-y-2 mt-4">
                  <Label>Usuario</Label>
                  <Select value={targetUid} onValueChange={setTargetUid}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => u.role === "student" || u.role === "instructor")
                        .map((u) => (
                          <SelectItem key={u.uid} value={u.uid}>
                            {u.firstName} {u.lastName} — {u.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de notificación</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as Notification["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Información</SelectItem>
                  <SelectItem value="success">✅ Éxito</SelectItem>
                  <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                  <SelectItem value="error">❌ Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Ej: Actualización del sistema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              placeholder="Escribe el mensaje de la notificación..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right">
              {message.length}/500
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sending ? "Enviando..." : "Enviar notificación"}
          </Button>
        </CardContent>
      </Card>

      {/* Historial de notificaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Historial ({notifications.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loadingList}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loadingList ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No hay notificaciones registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => {
                    const user = users.find((u) => u.uid === n.userId);
                    return (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium text-sm">
                          {n.title}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                          {n.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant={TYPE_VARIANTS[n.type]}>
                            {TYPE_LABELS[n.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {n.userId === "all"
                            ? "Todos"
                            : user
                            ? `${user.firstName} ${user.lastName}`
                            : n.userId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={n.read ? "secondary" : "outline"}
                            className={
                              n.read ? "" : "text-blue-600 border-blue-300"
                            }
                          >
                            {n.read ? "Leída" : "Sin leer"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(n.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}