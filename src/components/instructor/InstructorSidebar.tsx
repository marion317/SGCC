import { Home, Calendar, BookOpen, ClipboardCheck, FileText, MessageSquare, BarChart3, HelpCircle, LogOut } from 'lucide-react';

interface InstructorSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

export function InstructorSidebar({ currentView, onNavigate, onLogout, userName, userEmail }: InstructorSidebarProps) {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'programar', label: 'Programar Clases', icon: Calendar },
    { id: 'clases', label: 'Mis Clases', icon: BookOpen },
    { id: 'asistencia', label: 'Registrar Asistencia', icon: ClipboardCheck },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: FileText },
    { id: 'observaciones', label: 'Observaciones', icon: MessageSquare },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
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
          const isActive = item.id === 'inicio' && currentView === 'inicio';
          const isInicio = item.id === 'inicio';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => isInicio ? onNavigate('inicio') : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors text-gray-300 hover:bg-gray-800"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Soporte / Ayuda</span>
        </button>
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
