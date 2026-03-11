import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  UserPlus, Trash2, Search, Eye, EyeOff, Copy,
  Users, ShieldCheck, GraduationCap, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUsers, registerAdmin, registerInstructor, registerStudent,
  changeUserRole, deleteUser, generatePassword,
  User, RegisterData,
} from '../utils/authService';

/* ==========================
   BADGE DE ROL
========================== */
function RoleBadge({ role }: { role: string }) {
  if (role === 'admin')
    return <Badge className="bg-red-500 text-white">Admin</Badge>;
  if (role === 'instructor')
    return <Badge className="bg-blue-500 text-white">Instructor</Badge>;
  return <Badge className="bg-green-500 text-white">Estudiante</Badge>;
}

const emptyForm: RegisterData = {
  username: '', email: '', password: '',
  firstName: '', lastName: '',
  cedula: '', telefono: '', direccion: '', fechaNacimiento: '', genero: '',
};

/* ==========================
   COMPONENTE PRINCIPAL
========================== */
export function UserManagement() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState<'all'|'admin'|'instructor'|'student'>('all');

  // Crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRole, setCreateRole]     = useState<'admin'|'instructor'|'student'>('instructor');
  const [createForm, setCreateForm]     = useState<RegisterData>(emptyForm);
  const [showPass, setShowPass]         = useState(false);
  const [creating, setCreating]         = useState(false);

  // Cambio de rol con confirmación de contraseña
  const [changingRoleId, setChangingRoleId]         = useState<string | null>(null);
  const [roleConfirmOpen, setRoleConfirmOpen]       = useState(false);
  const [roleConfirmTarget, setRoleConfirmTarget]   = useState<{ user: User; newRole: User['role'] } | null>(null);
  const [roleConfirmPass, setRoleConfirmPass]       = useState('');
  const [roleConfirmShow, setRoleConfirmShow]       = useState(false);
  const [roleConfirmError, setRoleConfirmError]     = useState('');
  const [roleConfirming, setRoleConfirming]         = useState(false);

  /* ---- Cargar ---- */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getUsers());
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadUsers(); }, []);

  /* ---- Filtrado ---- */
  const filteredUsers = useMemo(() => users.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      u.username?.toLowerCase().includes(term) ||
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.cedula?.toLowerCase().includes(term);
    return matchRole && matchSearch;
  }), [users, search, filterRole]);

  /* ---- Conteos ---- */
  const counts = useMemo(() => ({
    all:        users.length,
    admin:      users.filter((u) => u.role === 'admin').length,
    instructor: users.filter((u) => u.role === 'instructor').length,
    student:    users.filter((u) => u.role === 'student').length,
  }), [users]);

  /* ---- Abrir modal crear ---- */
  const handleOpenCreate = () => {
    const pass = generatePassword();
    setCreateForm({ ...emptyForm, password: pass });
    setShowPass(false);
    setIsCreateOpen(true);
  };

  /* ---- Crear usuario ---- */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username.trim()) { toast.error('El código de usuario es obligatorio'); return; }
    if (createForm.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    try {
      setCreating(true);
      if (createRole === 'admin')           await registerAdmin(createForm);
      else if (createRole === 'instructor') await registerInstructor(createForm);
      else                                  await registerStudent(createForm);

      if (createRole === 'student') {
        toast.success(`Estudiante registrado. Contraseña: ${createForm.password}`, { duration: 10000 });
      } else {
        toast.success('Usuario registrado correctamente');
      }
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar usuario');
    } finally {
      setCreating(false);
    }
  };

  /* ---- Cambiar rol — abre modal ---- */
  const handleChangeRole = (u: User, newRole: User['role']) => {
    if (u.role === newRole) return;
    setRoleConfirmTarget({ user: u, newRole });
    setRoleConfirmPass('');
    setRoleConfirmError('');
    setRoleConfirmShow(false);
    setRoleConfirmOpen(true);
  };

  /* ---- Confirmar cambio de rol con contraseña ---- */
  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleConfirmTarget || !roleConfirmPass) return;
    const { user: u, newRole } = roleConfirmTarget;
    const labels: Record<string, string> = {
      admin: 'Administrador', instructor: 'Instructor', student: 'Estudiante',
    };
    try {
      setRoleConfirming(true);
      setRoleConfirmError('');
      // Verificar contraseña re-autenticando al admin actual
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const adminEmail = auth.currentUser?.email;
      if (!adminEmail) throw new Error('No hay sesión activa');
      await signInWithEmailAndPassword(auth, adminEmail, roleConfirmPass);
      // Contraseña correcta — aplicar cambio
      setChangingRoleId(u.id);
      await changeUserRole(u.id, newRole);
      toast.success(`Rol de ${u.firstName} ${u.lastName} actualizado a ${labels[newRole]}`);
      setRoleConfirmOpen(false);
      loadUsers();
    } catch (err: any) {
      const msg = err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
        ? 'Contraseña incorrecta'
        : err.message || 'Error al verificar';
      setRoleConfirmError(msg);
    } finally {
      setRoleConfirming(false);
      setChangingRoleId(null);
    }
  };

  /* ---- Eliminar ---- */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(id);
      toast.success('Usuario eliminado');
      loadUsers();
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  /* ---- Copiar código ---- */
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado`);
  };

  /* ==========================
     FORMULARIO CREAR
  ========================== */
  const CreateForm = () => (
    <form onSubmit={handleCreate} className="space-y-4">
      {/* Selector visual de rol */}
      <div>
        <Label className="mb-2 block">Tipo de usuario</Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'instructor', label: 'Instructor', icon: BookOpen,      color: 'border-blue-500 bg-blue-50 text-blue-700'  },
            { value: 'admin',      label: 'Admin',      icon: ShieldCheck,   color: 'border-red-500 bg-red-50 text-red-700'     },
            { value: 'student',    label: 'Estudiante', icon: GraduationCap, color: 'border-green-500 bg-green-50 text-green-700'},
          ] as const).map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.value} type="button" onClick={() => setCreateRole(r.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  createRole === r.value ? r.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nombre + Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre <span className="text-red-500">*</span></Label>
          <Input value={createForm.firstName}
            onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
            placeholder="Nombre" required />
        </div>
        <div>
          <Label>Apellido <span className="text-red-500">*</span></Label>
          <Input value={createForm.lastName}
            onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
            placeholder="Apellido" required />
        </div>
      </div>

      {/* Código */}
      <div>
        <Label>
          Código de usuario <span className="text-red-500">*</span>
          <span className="ml-1 text-xs text-gray-400 font-normal">— se usa para asignar a cursos</span>
        </Label>
        <Input value={createForm.username}
          onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.trim() })}
          placeholder="Ej: instru01 / est2026001"
          className="font-mono" required />
      </div>

      {/* Email */}
      <div>
        <Label>Email <span className="text-red-500">*</span></Label>
        <Input type="email" value={createForm.email}
          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          placeholder="correo@ejemplo.com" required />
      </div>

      {/* Contraseña */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Contraseña <span className="text-red-500">*</span></Label>
          <button type="button"
            onClick={() => setCreateForm({ ...createForm, password: generatePassword() })}
            className="text-xs text-purple-600 hover:underline">
            Generar nueva
          </button>
        </div>
        <div className="relative">
          <Input
            type={showPass ? 'text' : 'password'}
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            className="pr-10 font-mono" required />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {createRole === 'student' && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠ Copia la contraseña antes de registrar — se mostrará en el toast al guardar.
          </p>
        )}
      </div>

      {/* Campos extra estudiante */}
      {createRole === 'student' && (
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos adicionales</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cédula</Label>
              <Input value={createForm.cedula}
                onChange={(e) => setCreateForm({ ...createForm, cedula: e.target.value })}
                placeholder="Número de cédula" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={createForm.telefono}
                onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                placeholder="Teléfono" />
            </div>
            <div>
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" value={createForm.fechaNacimiento}
                onChange={(e) => setCreateForm({ ...createForm, fechaNacimiento: e.target.value })} />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={createForm.genero}
                onValueChange={(v) => setCreateForm({ ...createForm, genero: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input value={createForm.direccion}
                onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })}
                placeholder="Dirección completa" />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={creating}
        className="w-full bg-purple-600 hover:bg-purple-700">
        {creating ? 'Registrando...' : (
          createRole === 'admin' ? 'Registrar Administrador' :
          createRole === 'instructor' ? 'Registrar Instructor' : 'Registrar Estudiante'
        )}
      </Button>
    </form>
  );

  /* ==========================
     RENDER
  ========================== */
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) setIsCreateOpen(false); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleOpenCreate}>
              <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Usuario</DialogTitle></DialogHeader>
            <CreateForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: counts.all,        icon: Users,         color: 'text-gray-600',  bg: 'bg-gray-100'  },
          { label: 'Admins', count: counts.admin,       icon: ShieldCheck,   color: 'text-red-600',   bg: 'bg-red-100'   },
          { label: 'Instructores', count: counts.instructor, icon: BookOpen, color: 'text-blue-600',  bg: 'bg-blue-100'  },
          { label: 'Estudiantes', count: counts.student,    icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle>Usuarios Registrados</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código, email..."
                className="pl-9 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterRole} onValueChange={(v) => setFilterRole(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
              <TabsTrigger value="admin">Admin ({counts.admin})</TabsTrigger>
              <TabsTrigger value="instructor">Instructores ({counts.instructor})</TabsTrigger>
              <TabsTrigger value="student">Estudiantes ({counts.student})</TabsTrigger>
            </TabsList>

            <TabsContent value={filterRole}>
              {loading ? (
                <p className="text-center py-10 text-gray-400">Cargando usuarios...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-400">No hay usuarios que coincidan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        {(filterRole === 'student' || filterRole === 'all') && <TableHead>Cédula</TableHead>}
                        {(filterRole === 'student' || filterRole === 'all') && <TableHead>Teléfono</TableHead>}
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          {/* Código copiable */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                {u.username || '—'}
                              </span>
                              {u.username && (
                                <button onClick={() => copyCode(u.username)}
                                  className="text-gray-400 hover:text-purple-600 transition-colors" title="Copiar código">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="font-medium">
                            {u.firstName} {u.lastName}
                          </TableCell>

                          <TableCell className="text-sm text-gray-600">{u.email}</TableCell>

                          {(filterRole === 'student' || filterRole === 'all') && (
                            <TableCell className="text-sm text-gray-600">
                              {u.role === 'student' ? (u.cedula || '—') : ''}
                            </TableCell>
                          )}
                          {(filterRole === 'student' || filterRole === 'all') && (
                            <TableCell className="text-sm text-gray-600">
                              {u.role === 'student' ? (u.telefono || '—') : ''}
                            </TableCell>
                          )}

                          {/* ROL — dropdown interactivo */}
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(v) => handleChangeRole(u, v as User['role'])}
                              disabled={changingRoleId === u.id}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs border-0 shadow-none p-0 focus:ring-0 bg-transparent">
                                <SelectValue>
                                  <RoleBadge role={u.role} />
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                                    Administrador
                                  </div>
                                </SelectItem>
                                <SelectItem value="instructor">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                    Instructor
                                  </div>
                                </SelectItem>
                                <SelectItem value="student">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-3.5 h-3.5 text-green-500" />
                                    Estudiante
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost"
                              onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                              className="text-red-600 hover:text-red-700" title="Eliminar usuario">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ===== Dialog CONFIRMAR CAMBIO DE ROL ===== */}
      <Dialog open={roleConfirmOpen} onOpenChange={(o) => { if (!o) setRoleConfirmOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de rol</DialogTitle>
          </DialogHeader>
          {roleConfirmTarget && (() => {
            const labels: Record<string, string> = {
              admin: 'Administrador', instructor: 'Instructor', student: 'Estudiante',
            };
            const { user: u, newRole } = roleConfirmTarget;
            return (
              <form onSubmit={handleConfirmRoleChange} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p><span className="text-gray-500">Usuario:</span> <span className="font-medium">{u.firstName} {u.lastName}</span></p>
                  <p>
                    <span className="text-gray-500">Cambio:</span>{' '}
                    <RoleBadge role={u.role} />
                    <span className="mx-2 text-gray-400">→</span>
                    <RoleBadge role={newRole} />
                  </p>
                </div>

                <div>
                  <Label>Contraseña de administrador <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <Input
                      type={roleConfirmShow ? 'text' : 'password'}
                      value={roleConfirmPass}
                      onChange={(e) => { setRoleConfirmPass(e.target.value); setRoleConfirmError(''); }}
                      placeholder="Ingresa tu contraseña"
                      className={`pr-10 ${roleConfirmError ? 'border-red-500' : ''}`}
                      autoFocus
                    />
                    <button type="button" onClick={() => setRoleConfirmShow(!roleConfirmShow)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {roleConfirmShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {roleConfirmError && (
                    <p className="text-xs text-red-500 mt-1">{roleConfirmError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => setRoleConfirmOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={roleConfirming || !roleConfirmPass}>
                    {roleConfirming ? 'Verificando...' : `Cambiar a ${labels[newRole]}`}
                  </Button>
                </div>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}