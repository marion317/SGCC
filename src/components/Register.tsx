import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

interface RegisterProps {
  onBack: () => void;
}

export function Register({ onBack }: RegisterProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, cedula, email, telefono, fechaNacimiento,
            genero, direccion, username, password, confirmPassword } = formData;

    if (!firstName || !lastName || !cedula || !email || !telefono ||
        !fechaNacimiento || !genero || !direccion || !username || !password || !confirmPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Verificar que el username (código) no esté en uso
    const usnSnap = await getDocs(
      query(collection(db, 'users'), where('username', '==', username.trim()))
    );
    if (!usnSnap.empty) {
      toast.error('El código de usuario ya está en uso');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await addDoc(collection(db, 'users'), {
        uid,
        username:        username.trim(),
        email,
        firstName,
        lastName,
        cedula,
        telefono,
        direccion,
        fechaNacimiento,
        genero,
        role:      'student',
        createdAt: serverTimestamp(),
      });

      toast.success('¡Registro exitoso! Ya puedes iniciar sesión');
      onBack();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">CA</span>
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl mb-2">Registro de Estudiante</CardTitle>
            <CardDescription>Centro de Enseñanza Automotriz</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre <span className="text-red-500">*</span></Label>
                <Input id="firstName" name="firstName" placeholder="Tu nombre"
                  value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido <span className="text-red-500">*</span></Label>
                <Input id="lastName" name="lastName" placeholder="Tu apellido"
                  value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            {/* Cédula y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula <span className="text-red-500">*</span></Label>
                <Input id="cedula" name="cedula" placeholder="Número de cédula"
                  value={formData.cedula} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                <Input id="telefono" name="telefono" type="tel" placeholder="Número de teléfono"
                  value={formData.telefono} onChange={handleChange} required />
              </div>
            </div>

            {/* Fecha de nacimiento y Género */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
                <Input id="fechaNacimiento" name="fechaNacimiento" type="date"
                  value={formData.fechaNacimiento} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Género <span className="text-red-500">*</span></Label>
                <Select value={formData.genero} onValueChange={(v) => setFormData({ ...formData, genero: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico <span className="text-red-500">*</span></Label>
              <Input id="email" name="email" type="email" placeholder="tu@correo.com"
                value={formData.email} onChange={handleChange} required />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección <span className="text-red-500">*</span></Label>
              <Input id="direccion" name="direccion" placeholder="Dirección completa"
                value={formData.direccion} onChange={handleChange} required />
            </div>

            {/* Código de usuario */}
            <div className="space-y-2">
              <Label htmlFor="username">Código de usuario <span className="text-red-500">*</span></Label>
              <Input id="username" name="username" placeholder="Elige un código de usuario"
                value={formData.username} onChange={handleChange} className="font-mono" required />
              <p className="text-xs text-gray-400">Este código lo usarás para iniciar sesión</p>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña <span className="text-red-500">*</span></Label>
                <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres"
                  value={formData.password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña <span className="text-red-500">*</span></Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repite tu contraseña"
                  value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
