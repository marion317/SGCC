// src/components/Header.tsx
// MODIFICADO: Se integró NotificationBell en lugar del botón Bell estático
import { User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  student: 'Estudiante',
};

interface HeaderProps {
  userName?: string;
  userRole?: 'student' | 'admin' | 'instructor';
  userId?: string;   // ← NUEVO prop requerido para notificaciones
}

export function Header({ userName, userRole, userId }: HeaderProps) {
  const roleLabel = userRole ? roleLabels[userRole] : 'Admin';
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">CA</span>
          </div>
          <div>
            <h2 className="text-lg">Centro de Enseñanza Automotriz</h2>
            <p className="text-sm text-gray-500">Sistema de Gestión</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Campana: solo visible para usuarios NO administradores */}
          {userRole !== "admin" && <NotificationBell userId={userId ?? ""} />}

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm">{userName || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}