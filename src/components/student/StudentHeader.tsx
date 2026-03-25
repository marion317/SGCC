// src/components/student/StudentHeader.tsx
// MODIFICADO: Se integró NotificationBell para que el estudiante vea sus notificaciones
import { NotificationBell } from '../NotificationBell';

interface StudentHeaderProps {
  userName?: string;
  userRole?: string;
  userId: string; // ← NUEVO prop requerido
}

export function StudentHeader({ userName, userRole, userId }: StudentHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg">Centro de Enseñanza Automotriz</h2>
          <p className="text-sm text-gray-500">Sistema de Gestión</p>
        </div>
        <div className="flex items-center gap-4">
          {/* ── NUEVO: campana de notificaciones ── */}
          <NotificationBell userId={userId} />

          {userName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{userName}</span>
              {userRole && <span className="text-gray-400">•</span>}
              {userRole && (
                <span className="text-gray-500">
                  {userRole === 'student' ? 'Estudiante' : userRole}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}