// src/App.tsx
// MODIFICADO: Se añadieron las vistas "reportes" y "notificaciones",
// y se pasa userId al Header para el sistema de notificaciones
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { UserManagement } from "./components/UserManagement";
import { CourseManagement } from "./components/CourseManagement";
import { ScheduleManagement } from "./components/ScheduleManagement";
import { StudentReport } from "./components/StudentReport";             // ← NUEVO
import { NotificationManager } from "./components/NotificationManager"; // ← NUEVO
import { AuditLogs } from "./components/AuditLogs";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { InstructorDashboard } from "./components/instructor/InstructorDashboard";
import { initDatabase } from "./utils/initDatabase";
import {
  clearAuditActorContext,
  createAuditLog,
  setAuditActorContext,
} from "./utils/auditService";

type AppProps = {
  allowAdmin: boolean;
};

export default function App({ allowAdmin }: AppProps) {
  useEffect(() => {
    initDatabase();
  }, []);

  const [currentView, setCurrentView] = useState("inicio");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "admin" | "instructor">("admin");
  const [userId, setUserId] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");

  const handleLogin = (
    role: "student" | "admin" | "instructor",
    id: string,
    displayName: string,
    email: string
  ) => {
    setAuditActorContext({
      id,
      email,
      role,
      displayName,
    });
    void createAuditLog({
      action: "login",
      module: "auth",
      details: `Inicio de sesión (${role})`,
      actorOverride: { id, email, role, displayName },
    }).catch(() => {});
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(id);
    setUserDisplayName(displayName);
    setUserEmail(email);
    setCurrentView("inicio");
  };

  const handleLogout = () => {
    void createAuditLog({
      action: "logout",
      module: "auth",
      details: "Cierre de sesión",
    }).catch(() => {});
    clearAuditActorContext();
    setIsAuthenticated(false);
    setAuthView("login");
    setCurrentView("inicio");
  };

  /* ---- Auth views ---- */
  if (!isAuthenticated) {
    if (authView === "register") {
      return (
        <>
          <Toaster position="top-center" richColors />
          <Register onBack={() => setAuthView("login")} />
        </>
      );
    }
    if (authView === "forgot") {
      return (
        <>
          <Toaster position="top-center" richColors />
          <ForgotPassword onBack={() => setAuthView("login")} />
        </>
      );
    }
    return (
      <>
        <Toaster position="top-center" richColors />
        <Login
          onLogin={handleLogin}
          onRegister={() => setAuthView("register")}
          onForgotPassword={() => setAuthView("forgot")}
          isAdminLogin={allowAdmin}
        />
      </>
    );
  }

  /* ---- Vista estudiante ---- */
  if (userRole === "student") {
    return (
      <>
        <Toaster position="top-center" richColors />
        <StudentDashboard
          onLogout={handleLogout}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          userId={userId}
        />
      </>
    );
  }

  /* ---- Vista instructor ---- */
  if (userRole === "instructor") {
    return (
      <>
        <Toaster position="top-center" richColors />
        <InstructorDashboard
          onLogout={handleLogout}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          userId={userId}
        />
      </>
    );
  }

  /* ---- Acceso admin restringido ---- */
  if (userRole === "admin" && !allowAdmin) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="flex flex-col items-center justify-center h-screen gap-2">
          <h1 className="text-xl font-bold">Acceso restringido</h1>
          <p className="text-gray-600">Use la URL /admin para acceder al panel.</p>
        </div>
      </>
    );
  }

  /* ---- Vista admin ---- */
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
          userName={userDisplayName}
          userEmail={userEmail}
          userRole={userRole}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── ANTES ────────────────────────────────────────────────────
            <Header userName={userDisplayName} userRole={userRole} />
          ── DESPUÉS ──────────────────────────────────────────────────── */}
          <Header
            userName={userDisplayName}
            userRole={userRole}
            userId={userId}          // ← prop nuevo para NotificationBell
          />
          <main className="flex-1 overflow-y-auto p-6">
            {currentView === "inicio"         && <Dashboard userName={userDisplayName} />}
            {currentView === "usuarios"       && <UserManagement />}
            {currentView === "cursos"         && <CourseManagement />}
            {currentView === "horarios"       && <ScheduleManagement />}
            {/* ── NUEVO ── */}
            {currentView === "reportes"       && <StudentReport />}
            {currentView === "notificaciones" && <NotificationManager currentUserId={userId} />}
            {currentView === "auditoria"      && <AuditLogs userRole={userRole} />}
          </main>
        </div>
      </div>
    </>
  );
}