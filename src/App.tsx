import { useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { StudentRegistry } from "./components/StudentRegistry";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { UserManagement } from "./components/UserManagement";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { InstructorDashboard } from "./components/instructor/InstructorDashboard";
import { useEffect } from "react";
import { initDatabase } from "./utils/initDatabase";


type AppProps = {
  allowAdmin: boolean;
};

export default function App({ allowAdmin }: AppProps) {
  useEffect(() => {
    initDatabase();
  }, []);
  const [currentView, setCurrentView] = useState("inscripcion");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<
    "student" | "admin" | "instructor"
  >("admin");
  const [userId, setUserId] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authView, setAuthView] = useState<
    "login" | "register" | "forgot"
  >("login");

  const handleLogin = (
    role: "student" | "admin" | "instructor",
    id: string,
    displayName: string,
    email: string,
  ) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(id);
    setUserDisplayName(displayName);
    setUserEmail(email);
    setCurrentView("inicio");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthView("login");
    setCurrentView("inscripcion");
  };

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

  if (userRole === "instructor") {
    return (
      <>
        <Toaster position="top-center" richColors />
        <InstructorDashboard
          onLogout={handleLogout}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
        />
      </>
    );
  }

  if (userRole === "admin" && !allowAdmin) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="flex items-center justify-center h-screen">
          <h1>Acceso restringido</h1>
          <p>Use la URL /admin para acceder al panel.</p>
        </div>
      </>
    );
  }

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
        <Header userName={userDisplayName} userRole={userRole} />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {currentView === "inicio" && <Dashboard userName={userDisplayName} />}
            {currentView === "usuarios" && <UserManagement />}
            {currentView === "registrar" && <StudentRegistry />}
          </main>
        </div>
      </div>
      </div>
    </>
  );
}