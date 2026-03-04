interface StudentHeaderProps {
  userName?: string;
  userRole?: string;
}

export function StudentHeader({ userName, userRole }: StudentHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg">Centro de Enseñanza Automotriz</h2>
          <p className="text-sm text-gray-500">Sistema de Gestión</p>
        </div>
        {userName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{userName}</span>
            {userRole && <span className="text-gray-400">•</span>}
            {userRole && <span className="text-gray-500">{userRole === 'student' ? 'Estudiante' : userRole}</span>}
          </div>
        )}
      </div>
    </header>
  );
}
