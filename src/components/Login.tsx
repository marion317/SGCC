import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LogIn } from 'lucide-react';
import { toast } from "sonner";

import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const LOGIN_ERROR_MSG = "Correo y/o contraseña incorrecta";

interface LoginProps {
  onLogin: (role: 'student' | 'admin' | 'instructor', userId: string, displayName: string, email: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
  isAdminLogin?: boolean;
}

export function Login({ onLogin, onRegister, onForgotPassword, isAdminLogin = false }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError("Por favor complete todos los campos");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const q = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError(LOGIN_ERROR_MSG);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const userRole = userData.role as 'student' | 'admin' | 'instructor' | undefined;

      // Validaciones de rol según la pantalla de login
      if (isAdminLogin && userRole !== 'admin') {
        setError("Solo administradores pueden iniciar sesión en esta pantalla");
        return;
      }

      if (!isAdminLogin && userRole === 'admin') {
        setError("Este usuario administrador solo puede iniciar sesión desde la URL /admin");
        return;
      }

      const displayName = [userData.firstName, userData.lastName].filter(Boolean).join(' ')
        || [userData.nombre, userData.apellido].filter(Boolean).join(' ')
        || 'Usuario';
      const userEmail = (userData.email as string) || '';
      toast.success(`Bienvenido ${displayName}`);
      onLogin(userData.role, userDoc.id, displayName, userEmail);

    } catch (err: unknown) {
      console.error(err);
      setError(LOGIN_ERROR_MSG);
    }
  };

  return (
    <div
      className={
        isAdminLogin
          ? "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"
          : "min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4"
      }
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div
              className={
                isAdminLogin
                  ? "w-16 h-16 bg-slate-900 border border-yellow-400 rounded-lg flex items-center justify-center"
                  : "w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center"
              }
            >
              <span className="text-white text-2xl">
                {isAdminLogin ? "AD" : "CA"}
              </span>
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl mb-2">
              {isAdminLogin
                ? "Panel de Administración"
                : "Centro de Enseñanza Automotriz"}
            </CardTitle>
            <p className="text-gray-600 text-sm">
              {isAdminLogin
                ? "Acceso exclusivo para administradores"
                : "Sistema de Gestión - SGCC"}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* OLVIDÉ CONTRASEÑA */}
            {!isAdminLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-purple-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* BOTÓN */}
            <Button
              type="submit"
              className={
                isAdminLogin
                  ? "w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900"
                  : "w-full bg-purple-600 hover:bg-purple-700"
              }
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isAdminLogin ? "Iniciar sesión como admin" : "Iniciar Sesión"}
            </Button>
            {/* REGISTRO */}
            {!isAdminLogin && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={onRegister}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}