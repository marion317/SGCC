// InstructorSidebar.tsx  ← MODIFICADO
// 'evaluaciones' ahora es funcional (functional: true)

import {
  Home,
  Calendar,
  BookOpen,
  ClipboardCheck,
  FileText,
  LogOut,
} from 'lucide-react';

interface InstructorSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

export function InstructorSidebar({
  currentView,
  onNavigate,
  onLogout,
  userName,
  userEmail,
}: InstructorSidebarProps) {
  const menuItems = [
    { id: 'inicio',        label: 'Inicio',               icon: Home,           functional: true  },
    { id: 'horario',       label: 'Mi Horario',           icon: Calendar,       functional: true  },
    { id: 'clases',        label: 'Mis Clases',           icon: BookOpen,       functional: true  },
    { id: 'asistencia',    label: 'Registrar Asistencia', icon: ClipboardCheck, functional: true  },
    { id: 'evaluaciones',  label: 'Evaluaciones',         icon: FileText,       functional: true  }, // ← ACTIVADO
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl mb-1">SGCC</h1>
        <p className="text-gray-400 text-sm">Instructor: {userName || 'Usuario'}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.functional ? onNavigate(item.id) : undefined)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : item.functional
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {!item.functional && (
                <span className="ml-auto text-xs text-gray-600">Pronto</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
            {userName
              ? userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "I"}
          </div>
          <div>
            <p className="text-sm">{userName || "Usuario"}</p>
            <p className="text-xs text-gray-400">{userEmail || ""}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}