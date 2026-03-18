// ScheduleManagement.tsx — Vista del administrador para crear y gestionar horarios
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PlusCircle, Trash2, Calendar, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getCourses, Course } from '../utils/courseService';
import { createSession, getSessions, deleteSession, ClassSession, SessionInput } from '../utils/scheduleService';

const EMPTY_FORM: SessionInput = {
  courseId: '',
  courseName: '',
  courseCode: '',
  date: '',
  startTime: '',
  endTime: '',
  type: 'teoria',
  topic: '',
};

function typeBadge(type: string) {
  return type === 'teoria'
    ? <Badge className="bg-blue-500 text-white">Teoría</Badge>
    : <Badge className="bg-orange-500 text-white">Práctica</Badge>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function ScheduleManagement() {
  const [courses, setCourses]     = useState<Course[]>([]);
  const [sessions, setSessions]   = useState<ClassSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isOpen, setIsOpen]       = useState(false);
  const [form, setForm]           = useState<SessionInput>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cs, ss] = await Promise.all([getCourses(), getSessions()]);
      setCourses(cs.filter((c) => c.status === 'activo'));
      setSessions(ss);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCourseChange = (courseId: string) => {
    const c = courses.find((x) => x.id === courseId);
    if (!c) return;
    setForm((f) => ({
      ...f,
      courseId: c.id,
      courseName: `Clase ${c.name}`,
      courseCode: c.code,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId)  { toast.error('Selecciona un curso'); return; }
    if (!form.date)      { toast.error('Selecciona la fecha'); return; }
    if (!form.startTime) { toast.error('Ingresa la hora de inicio'); return; }
    if (!form.endTime)   { toast.error('Ingresa la hora de fin'); return; }
    if (form.startTime >= form.endTime) { toast.error('La hora de fin debe ser mayor a la de inicio'); return; }

    try {
      setSaving(true);
      await createSession(form);
      toast.success('Sesión creada correctamente');
      setIsOpen(false);
      setForm(EMPTY_FORM);
      loadAll();
    } catch {
      toast.error('Error al crear la sesión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sesión? Esta acción no se puede deshacer.')) return;
    try {
      await deleteSession(id);
      toast.success('Sesión eliminada');
      loadAll();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = useMemo(() =>
    filterCourse === 'all' ? sessions : sessions.filter((s) => s.courseId === filterCourse),
    [sessions, filterCourse]
  );

  const today = new Date().toISOString().split('T')[0];
  const upcoming = filtered.filter((s) => s.date >= today);
  const past     = filtered.filter((s) => s.date <  today);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Horarios</h1>
          <p className="text-gray-500 text-sm mt-1">Crea y administra las sesiones de clase</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setForm(EMPTY_FORM); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="w-4 h-4 mr-2" /> Nueva Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Crear Sesión de Clase</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              <div>
                <Label>Curso <span className="text-red-500">*</span></Label>
                <Select value={form.courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar curso..." /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-mono text-purple-700 mr-2">{c.code}</span>
                        Clase {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo <span className="text-red-500">*</span></Label>
                  <Select value={form.type} onValueChange={(v: 'teoria' | 'practica') => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teoria">Teoría</SelectItem>
                      <SelectItem value="practica">Práctica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora inicio <span className="text-red-500">*</span></Label>
                  <Input type="time" value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div>
                  <Label>Hora fin <span className="text-red-500">*</span></Label>
                  <Input type="time" value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                </div>
              </div>

              <div>
                <Label>Tema / Descripción</Label>
                <Input placeholder="Ej: Introducción a señales de tránsito"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Sesión'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro por curso */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm text-gray-600">Filtrar por curso:</Label>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos ({sessions.length} sesiones)</SelectItem>
            {courses.map((c) => {
              const count = sessions.filter((s) => s.courseId === c.id).length;
              return (
                <SelectItem key={c.id} value={c.id}>
                  <span className="font-mono text-purple-700 mr-1">{c.code}</span>
                  Clase {c.name} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs próximas / pasadas */}
      {loading ? (
        <p className="text-center py-10 text-gray-400">Cargando sesiones...</p>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              <Calendar className="w-4 h-4 mr-1" /> Próximas ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              <Clock className="w-4 h-4 mr-1" /> Pasadas ({past.length})
            </TabsTrigger>
          </TabsList>

          {(['upcoming', 'past'] as const).map((tab) => {
            const list = tab === 'upcoming' ? upcoming : past;
            return (
              <TabsContent key={tab} value={tab}>
                <Card>
                  <CardContent className="p-0">
                    {list.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                        <BookOpen className="w-10 h-10 opacity-30" />
                        <p>No hay sesiones {tab === 'upcoming' ? 'próximas' : 'pasadas'}</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Tema</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium whitespace-nowrap">{formatDate(s.date)}</TableCell>
                              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                {s.startTime} – {s.endTime}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{s.courseName}</p>
                                  <p className="text-xs font-mono text-purple-600">{s.courseCode}</p>
                                </div>
                              </TableCell>
                              <TableCell>{typeBadge(s.type)}</TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                                {s.topic || <span className="text-gray-300 italic">Sin tema</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost"
                                  onClick={() => handleDelete(s.id)}
                                  className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
