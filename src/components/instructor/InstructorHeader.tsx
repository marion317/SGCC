import { Bell, User } from 'lucide-react';

interface InstructorHeaderProps {
  userName?: string;
  userRole?: string;
}

export function InstructorHeader({ userName, userRole }: InstructorHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white">CEA</span>
          </div>
          <div>
            <h2 className="text-lg">Centro de Enseñanza Automotriz</h2>
            <p className="text-sm text-gray-500">Sistema de Gestión</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm">{userName || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{userRole === 'instructor' ? 'Instructor' : userRole || 'Instructor'}</p>
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
