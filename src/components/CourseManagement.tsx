import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  PlusCircle, Pencil, Trash2, BookOpen,
  UserPlus, Users, X, Search, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  addInstructorByCode, removeInstructorFromCourse,
  addStudentByCode, removeStudentFromCourse,
  COURSE_NAMES, THEORY_SCHEDULES, MODALITIES,
  MAX_CAPACITY, MAX_THEORY_INSTRUCTORS, MAX_PRACTICE_INSTRUCTORS,
  Course, CourseInput, CourseInstructor,
  getScheduleLabel, getModalityLabel,
} from '../utils/courseService';
import { getUsers, User } from '../utils/authService';

const emptyForm: CourseInput = {
  name: 'A1', description: '', theorySchedule: '',
  modality: 'normal', capacity: 50, status: 'activo',
};

/* ==========================
   BADGE ESTADO
========================== */
function StatusBadge({ status }: { status: Course['status'] }) {
  if (status === 'activo')     return <Badge className="bg-green-500">Activo</Badge>;
  if (status === 'completado') return <Badge className="bg-blue-500">Completado</Badge>;
  return <Badge className="bg-gray-400">Inactivo</Badge>;
}

/* ==========================
   PANEL INSTRUCTORES
   Lista registrados → clic para asignar, sin picker de slots
========================== */
function InstructorPanel({
  type, max, list, course, onRefresh, allInstructors,
}: {
  type: 'theory' | 'practice';
  max: number;
  list: CourseInstructor[];
  course: Course;
  onRefresh: (c: Course) => void;
  allInstructors: User[];
}) {
  const [search, setSearch]         = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId]     = useState<string | null>(null);

  /* IDs ya asignados en cualquier slot del curso */
  const assignedIds = useMemo(() => new Set([
    ...course.theoryInstructors.map((i) => i.id),
    ...course.practiceInstructors.map((i) => i.id),
  ]), [course]);

  /* Disponibles filtrados */
  const available = useMemo(() => {
    const term = search.toLowerCase();
    return allInstructors.filter((u) => {
      if (assignedIds.has(u.id)) return false;
      if (!term) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [allInstructors, assignedIds, search]);

  const isFull = list.length >= max;

  const reload = async () => {
    const all = await getCourses();
    const fresh = all.find((c) => c.id === course.id);
    if (fresh) onRefresh(fresh);
  };

  const handleAdd = async (u: User) => {
    try {
      setAddingId(u.id);
      await addInstructorByCode(course.id, course, u.username, type);
      toast.success(`${u.firstName} ${u.lastName} asignado`);
      await reload();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setRemovingId(id);
      await removeInstructorFromCourse(course.id, course, id, type);
      toast.success('Instructor removido');
      await reload();
    } catch {
      toast.error('Error al remover');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">

      {/* —— Columna izquierda: disponibles —— */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Instructores registrados</p>
          <span className="text-xs text-gray-400">{available.length} disponibles</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar instructor..." className="pl-8 h-8 text-sm" />
        </div>
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              {search ? 'Sin resultados.' : 'No hay instructores disponibles.'}
            </p>
          ) : (
            available.map((u) => (
              <button key={u.id} type="button"
                disabled={isFull || addingId === u.id}
                onClick={() => handleAdd(u)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-purple-50 border-b last:border-b-0 transition-colors group text-left disabled:opacity-40">
                <div>
                  <p className="text-sm font-medium group-hover:text-purple-700">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{u.username}</p>
                </div>
                <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-purple-500 shrink-0" />
              </button>
            ))
          )}
        </div>
        {isFull && (
          <p className="text-xs text-red-500 text-center">Límite de {max} profesores alcanzado.</p>
        )}
        {type === 'practice' && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
            🗓 Los horarios de práctica (1 alumno c/2 horas) se configuran en el módulo de Programación.
          </p>
        )}
      </div>

      {/* —— Columna derecha: asignados —— */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Asignados al curso</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isFull ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
          }`}>{list.length}/{max}</span>
        </div>
        <div className="border rounded-lg max-h-72 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Sin profesores asignados.</p>
          ) : (
            list.map((ins) => (
              <div key={ins.id}
                className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{ins.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{ins.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost"
                  onClick={() => handleRemove(ins.id)}
                  disabled={removingId === ins.id}
                  className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

/* ==========================
   FORMULARIO CURSO
========================== */
function CourseForm({ form, setForm, onSubmit, submitting, submitLabel }: {
  form: CourseInput; setForm: (f: CourseInput) => void;
  onSubmit: (e: React.FormEvent) => void; submitting: boolean; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre <span className="text-red-500">*</span></Label>
          <Select value={form.name} onValueChange={(v) => setForm({ ...form, name: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COURSE_NAMES.map((n) => <SelectItem key={n} value={n}>Clase {n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Código</Label>
          <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
            230{new Date().getFullYear()}###
          </div>
          <p className="text-xs text-gray-400 mt-1">Se genera automáticamente</p>
        </div>
      </div>

      <div>
        <Label>Horario Teoría <span className="text-red-500">*</span></Label>
        <Select value={form.theorySchedule} onValueChange={(v) => setForm({ ...form, theorySchedule: v })}>
          <SelectTrigger><SelectValue placeholder="Seleccionar horario..." /></SelectTrigger>
          <SelectContent>
            {['Lunes a Viernes', 'Lunes a Sábado', 'Sábados'].map((grupo) => (
              <div key={grupo}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase border-t first:border-t-0">
                  {grupo}
                </div>
                {THEORY_SCHEDULES.filter((s) => s.days === grupo).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.time}
                    {s.note && <span className="text-xs text-gray-400 ml-1">— {s.note}</span>}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {form.theorySchedule && (
          <p className="text-xs text-purple-600 mt-1">📅 {getScheduleLabel(form.theorySchedule)}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Modalidad</Label>
          <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODALITIES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">
            {MODALITIES.find((m) => m.value === form.modality)?.description}
          </p>
        </div>
        <div>
          <Label>Capacidad (máx. {MAX_CAPACITY})</Label>
          <Input type="number" min={1} max={MAX_CAPACITY} value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Math.min(Number(e.target.value), MAX_CAPACITY) })} />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Course['status'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Descripción</Label>
        <textarea value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2} placeholder="Descripción del curso..."
          className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background" />
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={submitting}>
        {submitting ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  );
}

/* ==========================
   COMPONENTE PRINCIPAL
========================== */
export function CourseManagement() {
  const [courses, setCourses]           = useState<Course[]>([]);
  const [loading, setLoading]           = useState(true);
  const [allInstructors, setAllInstructors] = useState<User[]>([]);
  const [allStudents, setAllStudents]       = useState<User[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm]     = useState<CourseInput>(emptyForm);
  const [creating, setCreating]         = useState(false);

  const [isEditOpen, setIsEditOpen]       = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editForm, setEditForm]           = useState<CourseInput>(emptyForm);
  const [saving, setSaving]               = useState(false);

  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false);
  const [instrCourse, setInstrCourse]             = useState<Course | null>(null);

  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [studCourse, setStudCourse]         = useState<Course | null>(null);
  const [studentSearch, setStudentSearch]   = useState('');
  const [addingStudId, setAddingStudId]     = useState<string | null>(null);
  const [removingStudId, setRemovingStudId] = useState<string | null>(null);

  /* ---- Carga inicial ---- */
  const loadAll = async () => {
    try {
      setLoading(true);
      const [cs, users] = await Promise.all([getCourses(), getUsers()]);
      setCourses(cs);
      setAllInstructors(users.filter((u) => u.role === 'instructor'));
      setAllStudents(users.filter((u) => u.role === 'student'));
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  const refreshCourses = async () => {
    const updated = await getCourses();
    setCourses(updated);
    return updated;
  };

  /* ---- Crear curso ---- */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.theorySchedule) { toast.error('Selecciona el horario de teoría'); return; }
    try {
      setCreating(true);
      await createCourse(createForm);
      toast.success('Curso creado');
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      refreshCourses();
    } catch { toast.error('Error al crear curso'); }
    finally { setCreating(false); }
  };

  /* ---- Editar curso ---- */
  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setEditForm({
      name: c.name, description: c.description,
      theorySchedule: c.theorySchedule ?? '',
      modality: c.modality ?? 'normal',
      capacity: c.capacity, status: c.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      setSaving(true);
      await updateCourse(editingCourse.id, editForm);
      toast.success('Curso actualizado');
      setIsEditOpen(false);
      refreshCourses();
    } catch { toast.error('Error al actualizar'); }
    finally { setSaving(false); }
  };

  /* ---- Eliminar curso ---- */
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este curso? Esta acción no se puede deshacer.')) return;
    try { await deleteCourse(id); toast.success('Curso eliminado'); refreshCourses(); }
    catch { toast.error('Error al eliminar'); }
  };

  /* ---- Estudiantes disponibles para el curso abierto ---- */
  const availableStudents = useMemo(() => {
    if (!studCourse) return [];
    const enrolledIds = new Set(studCourse.students.map((s) => s.id));
    const term = studentSearch.toLowerCase();
    return allStudents.filter((u) => {
      if (enrolledIds.has(u.id)) return false;
      if (!term) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [allStudents, studCourse, studentSearch]);

  /* ---- Inscribir estudiante ---- */
  const handleAddStudent = async (u: User) => {
    if (!studCourse) return;
    try {
      setAddingStudId(u.id);
      await addStudentByCode(studCourse.id, studCourse, u.username);
      toast.success(`${u.firstName} ${u.lastName} inscrito`);
      const updated = await refreshCourses();
      setStudCourse(updated.find((c) => c.id === studCourse.id) ?? null);
    } catch (err: any) { toast.error(err.message || 'Error al inscribir'); }
    finally { setAddingStudId(null); }
  };

  /* ---- Remover estudiante ---- */
  const handleRemoveStudent = async (studentId: string) => {
    if (!studCourse) return;
    try {
      setRemovingStudId(studentId);
      await removeStudentFromCourse(studCourse.id, studCourse, studentId);
      toast.success('Estudiante removido');
      const updated = await refreshCourses();
      setStudCourse(updated.find((c) => c.id === studCourse.id) ?? null);
    } catch { toast.error('Error al remover'); }
    finally { setRemovingStudId(null); }
  };

  /* ==========================
     RENDER
  ========================== */
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="w-4 h-4 mr-2" /> Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Crear Nuevo Curso</DialogTitle></DialogHeader>
            <CourseForm form={createForm} setForm={setCreateForm}
              onSubmit={handleCreate} submitting={creating} submitLabel="Crear Curso" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de cursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" /> Cursos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-10 text-gray-400">Cargando cursos...</p>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
              <BookOpen className="w-10 h-10 opacity-30" />
              <p>No hay cursos registrados</p>
              <button onClick={() => setIsCreateOpen(true)}
                className="text-purple-600 hover:underline text-sm">
                Crear el primer curso
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Horario Teoría</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Prof. Teoría</TableHead>
                    <TableHead>Prof. Práctica</TableHead>
                    <TableHead>Alumnos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c) => {
                    const sch = THEORY_SCHEDULES.find((s) => s.value === c.theorySchedule);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs text-purple-700 font-semibold">
                          {c.code}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">Clase {c.name}</TableCell>
                        <TableCell>
                          {sch ? (
                            <div>
                              <p className="text-xs font-medium">{sch.time}</p>
                              <p className="text-xs text-gray-400">{sch.days}</p>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">{getModalityLabel(c.modality) || '—'}</TableCell>

                        {/* Prof. Teoría — solo nombres */}
                        <TableCell>
                          {c.theoryInstructors.length === 0
                            ? <span className="text-xs text-gray-400 italic">—</span>
                            : (
                              <div className="text-xs space-y-0.5">
                                {c.theoryInstructors.map((i) => (
                                  <p key={i.id} className="font-medium">{i.name}</p>
                                ))}
                                <p className="text-gray-400">
                                  {c.theoryInstructors.length}/{MAX_THEORY_INSTRUCTORS}
                                </p>
                              </div>
                            )}
                        </TableCell>

                        {/* Prof. Práctica — solo nombres, sin slots */}
                        <TableCell>
                          {c.practiceInstructors.length === 0
                            ? <span className="text-xs text-gray-400 italic">—</span>
                            : (
                              <div className="text-xs space-y-0.5">
                                {c.practiceInstructors.map((i) => (
                                  <p key={i.id} className="font-medium">{i.name}</p>
                                ))}
                                <p className="text-gray-400">
                                  {c.practiceInstructors.length}/{MAX_PRACTICE_INSTRUCTORS}
                                </p>
                              </div>
                            )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{c.students.length}/{c.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(c)}
                              className="text-blue-600 hover:text-blue-700" title="Editar curso">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {c.status === 'activo' && (
                              <>
                                <Button size="sm" variant="ghost"
                                  onClick={() => { setInstrCourse(c); setIsInstructorsOpen(true); }}
                                  className="text-purple-600 hover:text-purple-700" title="Gestionar profesores">
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost"
                                  onClick={() => {
                                    setStudCourse(c);
                                    setStudentSearch('');
                                    setIsStudentsOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-700" title="Gestionar estudiantes">
                                  <Users className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}
                              className="text-red-600 hover:text-red-700" title="Eliminar curso">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Dialog EDITAR ===== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
          <CourseForm form={editForm} setForm={setEditForm}
            onSubmit={handleSaveEdit} submitting={saving} submitLabel="Guardar Cambios" />
        </DialogContent>
      </Dialog>

      {/* ===== Dialog PROFESORES ===== */}
      <Dialog open={isInstructorsOpen} onOpenChange={setIsInstructorsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Profesores — Clase {instrCourse?.name}{' '}
              <span className="font-mono text-purple-600 text-sm">{instrCourse?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {instrCourse && (
            <Tabs defaultValue="theory">
              <TabsList className="w-full">
                <TabsTrigger value="theory" className="flex-1">
                  Teoría ({instrCourse.theoryInstructors.length}/{MAX_THEORY_INSTRUCTORS})
                </TabsTrigger>
                <TabsTrigger value="practice" className="flex-1">
                  Práctica ({instrCourse.practiceInstructors.length}/{MAX_PRACTICE_INSTRUCTORS})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="theory" className="mt-4">
                <InstructorPanel
                  type="theory" max={MAX_THEORY_INSTRUCTORS}
                  list={instrCourse.theoryInstructors}
                  course={instrCourse}
                  allInstructors={allInstructors}
                  onRefresh={(c) => {
                    setInstrCourse(c);
                    setCourses((p) => p.map((x) => x.id === c.id ? c : x));
                  }}
                />
              </TabsContent>
              <TabsContent value="practice" className="mt-4">
                <InstructorPanel
                  type="practice" max={MAX_PRACTICE_INSTRUCTORS}
                  list={instrCourse.practiceInstructors}
                  course={instrCourse}
                  allInstructors={allInstructors}
                  onRefresh={(c) => {
                    setInstrCourse(c);
                    setCourses((p) => p.map((x) => x.id === c.id ? c : x));
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Dialog ESTUDIANTES ===== */}
      <Dialog open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Estudiantes — Clase {studCourse?.name}{' '}
              <span className="font-mono text-purple-600 text-sm">{studCourse?.code}</span>
            </DialogTitle>
          </DialogHeader>

          {studCourse && (
            <div className="grid grid-cols-2 gap-4">

              {/* Columna izquierda: disponibles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Estudiantes registrados</p>
                  <span className="text-xs text-gray-400">{availableStudents.length} disponibles</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar estudiante..." className="pl-8 h-8 text-sm" />
                </div>
                <div className="border rounded-lg max-h-72 overflow-y-auto">
                  {availableStudents.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      {studentSearch ? 'Sin resultados.' : 'Todos los estudiantes ya están inscritos.'}
                    </p>
                  ) : (
                    availableStudents.map((u) => (
                      <button key={u.id} type="button"
                        disabled={
                          addingStudId === u.id ||
                          studCourse.students.length >= studCourse.capacity
                        }
                        onClick={() => handleAddStudent(u)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-green-50 border-b last:border-b-0 transition-colors group text-left disabled:opacity-40">
                        <div>
                          <p className="text-sm font-medium group-hover:text-green-700">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{u.username}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
                {studCourse.students.length >= studCourse.capacity && (
                  <p className="text-xs text-red-500 text-center">
                    Curso lleno ({studCourse.capacity}/{studCourse.capacity})
                  </p>
                )}
              </div>

              {/* Columna derecha: inscritos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Inscritos en el curso</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    studCourse.students.length >= studCourse.capacity
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {studCourse.students.length}/{studCourse.capacity}
                  </span>
                </div>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {studCourse.students.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Sin estudiantes inscritos.</p>
                  ) : (
                    studCourse.students.map((s) => (
                      <div key={s.id}
                        className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{s.username}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleRemoveStudent(s.id)}
                          disabled={removingStudId === s.id}
                          className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}