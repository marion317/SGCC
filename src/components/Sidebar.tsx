import { Home, Users, BookOpen, FileText, FileSpreadsheet, LogOut } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  student: 'Estudiante',
};

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: 'student' | 'admin' | 'instructor';
}

export function Sidebar({ currentView, onNavigate, onLogout, userName, userEmail, userRole }: SidebarProps) {
  const roleLabel = userRole ? roleLabels[userRole] : 'Admin';

  const menuItems = [
    { id: 'inicio',    label: 'Inicio',              icon: Home,          functional: true  },
    { id: 'usuarios',  label: 'Gestión de Usuarios', icon: Users,         functional: true  },
    { id: 'cursos',    label: 'Gestión de Cursos',   icon: BookOpen,      functional: true  },
    { id: 'historial', label: 'Historial Académico', icon: FileText,      functional: false },
    { id: 'reportes',  label: 'Generar Reportes',    icon: FileSpreadsheet, functional: false },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl mb-1">SGCC</h1>
        <p className="text-gray-400 text-sm">{roleLabel}: {userName || 'Usuario'}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.functional ? onNavigate(item.id) : undefined}
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
            {userName ? userName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <p className="text-sm">{userName || 'Usuario'}</p>
            <p className="text-xs text-gray-400">{userEmail || ''}</p>
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