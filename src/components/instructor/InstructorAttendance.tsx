// InstructorAttendance.tsx — Registrar asistencia por curso y fecha
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ClipboardCheck, Calendar, BookOpen, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { getCoursesByInstructorId, Course } from '../../utils/courseService';
import {
  findOrCreateSessionForCourseDate,
  markAttendance,
  getAttendanceBySession,
  getSessionsByCourse,
  AttendanceRecord,
} from '../../utils/scheduleService';

type AttendanceStatus = 'presente' | 'tardanza' | 'ausente';

interface InstructorAttendanceProps {
  userId: string;
}

export function InstructorAttendance({ userId }: InstructorAttendanceProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const students = selectedCourse?.students ?? [];

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCoursesByInstructorId(userId);
      setCourses(data);
      if (data.length > 0 && !selectedCourseId) setSelectedCourseId(data[0].id);
    } catch {
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [userId]);

  // Cuando cambia curso o fecha, cargar asistencia existente
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) {
      setAttendanceMap({});
      return;
    }
    const course = courses.find((c) => c.id === selectedCourseId);
    const stuList = course?.students ?? [];
    if (stuList.length === 0) {
      setAttendanceMap({});
      return;
    }

    const loadExistingAttendance = async () => {
      try {
        const sessions = await getSessionsByCourse(selectedCourseId);
        const session = sessions.find((s) => s.date === selectedDate);
        const map: Record<string, AttendanceStatus> = {};
        stuList.forEach((stu) => {
          map[stu.id] = 'ausente';
        });
        if (session) {
          const records = await getAttendanceBySession(session.id);
          records.forEach((rec) => {
            map[rec.studentId] = rec.status as AttendanceStatus;
          });
        }
        setAttendanceMap(map);
      } catch {
        setAttendanceMap({});
      }
    };
    loadExistingAttendance();
  }, [selectedCourseId, selectedDate, courses]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedDate) {
      toast.error('Selecciona curso y fecha');
      return;
    }
    if (students.length === 0) {
      toast.error('Este curso no tiene alumnos inscritos');
      return;
    }

    try {
      setSaving(true);
      const session = await findOrCreateSessionForCourseDate(
        { id: selectedCourse.id, name: selectedCourse.name, code: selectedCourse.code },
        selectedDate
      );
      for (const student of students) {
        const status = attendanceMap[student.id] ?? 'ausente';
        await markAttendance(
          session,
          student.id,
          student.name,
          status
        );
      }
      toast.success('Asistencia registrada correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-12 text-gray-400">Cargando...</p>;

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Registrar Asistencia</h2>
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-gray-400 gap-3">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p>No tienes cursos asignados aún.</p>
            <p className="text-sm">El administrador debe asignarte a uno o más cursos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Registrar Asistencia</h2>
        <p className="text-gray-500 text-sm mt-1">
          Marca la asistencia de los alumnos por curso y fecha
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="w-4 h-4 text-purple-600" />
            Seleccionar clase y fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Clase {c.name} — {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-purple-600" />
              Alumnos inscritos — Clase {selectedCourse.name}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Marca Presente, Tardanza o Ausente para cada alumno
            </p>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center py-10 text-gray-400">Este curso no tiene alumnos inscritos</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-48">Asistencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-gray-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                        <TableCell>
                          <Select
                            value={attendanceMap[student.id] ?? 'ausente'}
                            onValueChange={(v) => handleStatusChange(student.id, v as AttendanceStatus)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="presente">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Presente
                                </span>
                              </SelectItem>
                              <SelectItem value="tardanza">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                  Tardanza
                                </span>
                              </SelectItem>
                              <SelectItem value="ausente">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Ausente
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar asistencia'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
