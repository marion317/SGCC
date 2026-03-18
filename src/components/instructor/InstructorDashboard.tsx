import { useState } from 'react';
import { InstructorSidebar } from './InstructorSidebar';
import { InstructorHeader } from './InstructorHeader';
import { InstructorHome } from './InstructorHome';
import { InstructorSchedule } from './InstructorSchedule';
import { InstructorAttendance } from './InstructorAttendance';

interface InstructorDashboardProps {
  onLogout: () => void;
  userDisplayName: string;
  userEmail: string;
  userId: string;
}

export function InstructorDashboard({ onLogout, userDisplayName, userEmail, userId }: InstructorDashboardProps) {
  const [currentView, setCurrentView] = useState('inicio');

  return (
    <div className="flex h-screen bg-gray-50">
      <InstructorSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={onLogout}
        userName={userDisplayName}
        userEmail={userEmail}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <InstructorHeader userName={userDisplayName} userRole="instructor" />
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'inicio'  && <InstructorHome userName={userDisplayName} />}
          {currentView === 'horario' && <InstructorSchedule userId={userId} />}
          {currentView === 'asistencia' && <InstructorAttendance userId={userId} />}
        </main>
      </div>
    </div>
  );
}
