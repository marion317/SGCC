import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LogIn, User, Shield, GraduationCap } from 'lucide-react';
import { toast } from "sonner";

import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const LOGIN_ERROR_MSG = "Correo y/o contraseña incorrecta";

interface LoginProps {
  onLogin: (role: 'student' | 'admin' | 'instructor', userId: string, displayName: string, email: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export function Login({ onLogin, onRegister, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] =
    useState<'student' | 'admin' | 'instructor'>('admin');

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

      if (userData.role !== selectedRole) {
        setError(LOGIN_ERROR_MSG);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">CA</span>
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl mb-2">
              Centro de Enseñanza Automotriz
            </CardTitle>
            <p className="text-gray-600 text-sm">Sistema de Gestión - SGCC</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ROL */}
            <div className="space-y-2">
              <Label>Tipo de Usuario</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${
                    selectedRole === 'admin'
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-200'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('instructor')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${
                    selectedRole === 'instructor'
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-200'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-xs">Instructor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${
                    selectedRole === 'student'
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-200'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-xs">Estudiante</span>
                </button>
              </div>
            </div>

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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-purple-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* BOTÓN */}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>

            {/* REGISTRO SOLO ESTUDIANTE */}
            {selectedRole === 'student' && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
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