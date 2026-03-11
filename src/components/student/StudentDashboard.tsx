import { useState } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';
import { StudentHome } from './StudentHome';
import { StudentProfile } from './StudentProfile';
import { StudentClasses } from './Studentclasses';

interface StudentDashboardProps {
  onLogout: () => void;
  userDisplayName: string;
  userEmail: string;
  userId: string;
}

export function StudentDashboard({ onLogout, userDisplayName, userEmail, userId }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState('inicio');

  return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={onLogout}
        userName={userDisplayName}
        userEmail={userEmail}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentHeader userName={userDisplayName} userRole="student" />
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'inicio' && <StudentHome userName={userDisplayName} />}
          {currentView === 'clases' && <StudentClasses userId={userId} />}
          {currentView === 'perfil' && (
            <StudentProfile userId={userId} userName={userDisplayName} userEmail={userEmail} />
          )}
        </main>
      </div>
    </div>
  );
}