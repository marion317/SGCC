import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/** Genera una contraseña temporal para el estudiante (puede usarla para iniciar sesión) */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function StudentRegistry() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    genero: ''
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const password = generatePassword();

  try {
    // 1. Crear usuario en Firebase Authentication (para poder iniciar sesión)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      password
    );

    // 2. Guardar datos del estudiante en Firestore (colección users)
    await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      email: formData.email,
      firstName: formData.nombre,
      lastName: formData.apellido,
      nombre: formData.nombre,
      apellido: formData.apellido,
      cedula: formData.cedula,
      telefono: formData.telefono,
      direccion: formData.direccion,
      fechaNacimiento: formData.fechaNacimiento,
      genero: formData.genero,
      role: 'student',
      createdAt: serverTimestamp()
    });

    toast.success(`Estudiante registrado. El estudiante puede iniciar sesión con: ${formData.email} / Contraseña: ${password}`);
    setFormData({ nombre: '', apellido: '', cedula: '', email: '', telefono: '', direccion: '', fechaNacimiento: '', genero: '' });
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || 'Error al registrar estudiante');
  }
};

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Registrar Estudiante</h2>
        <p className="text-gray-600">Complete los datos del nuevo estudiante</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del estudiante"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Apellido</Label>
            <Input
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              placeholder="Apellido del estudiante"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cédula</Label>
            <Input
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              placeholder="Número de cédula"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Número de teléfono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha de Nacimiento</Label>
            <Input
              type="date"
              value={formData.fechaNacimiento}
              onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Género</Label>
            <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
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

          <div className="space-y-2 col-span-2">
            <Label>Dirección</Label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección completa"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            Registrar Estudiante
          </Button>
          <Button type="button" variant="outline" onClick={() => setFormData({
            nombre: '', apellido: '', cedula: '', email: '', telefono: '', direccion: '', fechaNacimiento: '', genero: ''
          })}>
            Limpiar
          </Button>
        </div>
      </form>
    </div>
  );
}
