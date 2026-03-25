// src/components/NotificationBell.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from "../utils/notificationService";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";

/* ==============================
   HELPERS
============================== */
const TYPE_ICON: Record<Notification["type"], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
};

const formatRelative = (ts: any): string => {
  if (!ts) return "";
  const date: Date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Ahora mismo";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return date.toLocaleDateString("es-CO");
};

/* ==============================
   PROPS
============================== */
interface NotificationBellProps {
  userId: string;
}

/* ==============================
   COMPONENTE
============================== */
export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getNotifications(userId);
      setNotifications(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carga inicial y polling cada 30 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkOne = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("No se pudo marcar como leída.");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Todas las notificaciones marcadas como leídas.");
    } catch {
      toast.error("Error al marcar todas como leídas.");
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col max-h-[480px]">
          {/* Encabezado del panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-purple-600 hover:text-purple-700 h-7 px-2"
                onClick={handleMarkAll}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                    n.read ? "bg-white" : "bg-blue-50/60"
                  }`}
                >
                  <div className="mt-0.5">{TYPE_ICON[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        n.read ? "text-gray-600" : "text-gray-800 font-medium"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkOne(n.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
                      title="Marcar como leída"
                    >
                      <Check className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}