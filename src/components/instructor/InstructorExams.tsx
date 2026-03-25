// InstructorExams.tsx
// Módulo de gestión de exámenes para el instructor.
// Cada instructor solo puede ver y editar exámenes del tipo que le corresponde.

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getCoursesByInstructorId,
  Course,
  CourseStudent,
} from '../../utils/courseService';
import {
  Exam,
  ExamType,
  ExamInput,
  getExamsByCourse,
  getInstructorExamTypes,
  createExam,
  updateExam,
  deleteExam,
} from '../../utils/examService';

/* ==========================
   PROPS
========================== */
interface InstructorExamsProps {
  userId: string;
  userDisplayName: string;
}

/* ==========================
   HELPERS UI
========================== */

/** Etiqueta legible del tipo de examen */
const examTypeLabel = (type: ExamType) =>
  type === 'theory' ? 'Teórico' : 'Práctico';

/** Color del badge según estado */
const statusBadge = (exam: Exam) => {
  if (exam.status === 'approved')
    return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
  if (exam.status === 'failed')
    return <Badge className="bg-red-100 text-red-800">Reprobado</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
};

/** Ícono de estado */
const StatusIcon = ({ exam }: { exam: Exam }) => {
  if (exam.status === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (exam.status === 'failed')   return <XCircle    className="w-4 h-4 text-red-600"   />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
};

/* ==========================
   COMPONENTE PRINCIPAL
========================== */

export function InstructorExams({ userId, userDisplayName }: InstructorExamsProps) {
  /* ---- Estado global ---- */
  const [courses, setCourses]                   = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [exams, setExams]                       = useState<Exam[]>([]);
  const [loading, setLoading]                   = useState(true);

  /* ---- Modal de formulario ---- */
  const [showForm, setShowForm]       = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [saving, setSaving]           = useState(false);

  /* ---- Campos del formulario ---- */
  const [formStudentId,   setFormStudentId]   = useState('');
  const [formExamType,    setFormExamType]    = useState<ExamType>('theory');
  const [formScore,       setFormScore]       = useState<string>('');
  const [formDate,        setFormDate]        = useState(todayStr());
  const [formNotes,       setFormNotes]       = useState('');

  /* ==========================
     Datos derivados
  ========================== */
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  /** Tipos de examen que puede gestionar el instructor en el curso seleccionado */
  const allowedTypes: ExamType[] = selectedCourse
    ? getInstructorExamTypes(userId, selectedCourse)
    : [];

  /** Exámenes del curso filtrados solo al tipo que le corresponde al instructor */
  const visibleExams = exams.filter((e) => allowedTypes.includes(e.examType));

  /** Estudiantes del curso (para el select del formulario) */
  const students: CourseStudent[] = selectedCourse?.students ?? [];

  /* ==========================
     Carga de datos
  ========================== */
  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCoursesByInstructorId(userId);
      setCourses(data);
      if (data.length > 0) setSelectedCourseId(data[0].id);
    } catch {
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async (courseId: string) => {
    try {
      const data = await getExamsByCourse(courseId);
      setExams(data);
    } catch {
      toast.error('Error al cargar exámenes');
    }
  };

  useEffect(() => { loadCourses(); }, []);

  useEffect(() => {
    if (selectedCourseId) loadExams(selectedCourseId);
    else setExams([]);
  }, [selectedCourseId]);

  /* ==========================
     Apertura del formulario
  ========================== */

  const openCreateForm = () => {
    if (!selectedCourse || allowedTypes.length === 0) {
      toast.error('No tienes permisos para registrar exámenes en este curso.');
      return;
    }
    setEditingExam(null);
    setFormStudentId('');
    setFormExamType(allowedTypes[0]);
    setFormScore('');
    setFormDate(todayStr());
    setFormNotes('');
    setShowForm(true);
  };

  const openEditForm = (exam: Exam) => {
    setEditingExam(exam);
    setFormStudentId(exam.studentId);
    setFormExamType(exam.examType);
    setFormScore(exam.score !== null ? String(exam.score) : '');
    setFormDate(exam.examDate);
    setFormNotes(exam.notes);
    setShowForm(true);
  };

  /* ==========================
     Guardar (crear o editar)
  ========================== */
  const handleSave = async () => {
    if (!selectedCourse) return;

    /* Validaciones básicas */
    if (!formStudentId) {
      toast.error('Selecciona un estudiante.');
      return;
    }
    const scoreNum = formScore === '' ? null : Number(formScore);
    if (formScore !== '' && (isNaN(scoreNum!) || scoreNum! < 0 || scoreNum! > 100)) {
      toast.error('La calificación debe ser un número entre 0 y 100.');
      return;
    }

    const student = students.find((s) => s.id === formStudentId);
    if (!student) { toast.error('Estudiante no encontrado.'); return; }

    try {
      setSaving(true);

      if (editingExam) {
        /* ---- EDITAR ---- */
        await updateExam(
          editingExam.id,
          editingExam,
          { score: scoreNum, notes: formNotes, examDate: formDate },
          userId,
          selectedCourse
        );
        toast.success('Examen actualizado correctamente.');
      } else {
        /* ---- CREAR ---- */
        const input: ExamInput = {
          courseId:        selectedCourse.id,
          courseName:      selectedCourse.name,
          studentId:       student.id,
          studentName:     student.name,
          studentUsername: student.username,
          examType:        formExamType,
          score:           scoreNum,
          instructorId:    userId,
          instructorName:  userDisplayName,
          examDate:        formDate,
          notes:           formNotes,
        };
        await createExam(input, selectedCourse);
        toast.success('Examen registrado correctamente.');
      }

      setShowForm(false);
      loadExams(selectedCourse.id);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al guardar el examen.');
    } finally {
      setSaving(false);
    }
  };

  /* ==========================
     Eliminar
  ========================== */
  const handleDelete = async (exam: Exam) => {
    if (!selectedCourse) return;
    if (!confirm(`¿Eliminar el examen ${examTypeLabel(exam.examType)} de ${exam.studentName}?`))
      return;
    try {
      await deleteExam(exam.id, exam, userId, selectedCourse);
      toast.success('Examen eliminado.');
      loadExams(selectedCourse.id);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al eliminar el examen.');
    }
  };

  /* ==========================
     RENDER
  ========================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando cursos…</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <BookOpen className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 text-lg">No tienes cursos asignados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Cabecera ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Evaluaciones
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Solo puedes gestionar los exámenes del tipo que tienes asignado en cada curso.
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          disabled={allowedTypes.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Examen
        </Button>
      </div>

      {/* ---- Selector de curso ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Seleccionar Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Curso</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Badge de tipo de instructor */}
            {selectedCourse && (
              <div className="flex items-end gap-2 flex-wrap">
                {allowedTypes.length === 0 && (
                  <Badge className="bg-gray-100 text-gray-600">Sin permisos en este curso</Badge>
                )}
                {allowedTypes.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Instructor — Exámenes Teórico y Práctico
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Tabla de exámenes ---- */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Exámenes registrados — {selectedCourse.name}
              <Badge className="ml-2 bg-gray-100 text-gray-600 font-normal">
                {visibleExams.length} registro{visibleExams.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleExams.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No hay exámenes registrados aún.</p>
                <p className="text-sm">Usa el botón "Registrar Examen" para comenzar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Calificación</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exam.studentName}</p>
                          <p className="text-xs text-gray-400">{exam.studentUsername}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            exam.examType === 'theory'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'
                          }
                        >
                          {examTypeLabel(exam.examType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{exam.examDate}</TableCell>
                      <TableCell className="text-center font-bold">
                        {exam.score !== null ? `${exam.score} / 100` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <StatusIcon exam={exam} />
                          {statusBadge(exam)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                        {exam.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditForm(exam)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(exam)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==========================
           MODAL FORMULARIO
      ========================== */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExam ? 'Editar Examen' : 'Registrar Nuevo Examen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Estudiante */}
            <div>
              <Label>Estudiante *</Label>
              <Select
                value={formStudentId}
                onValueChange={setFormStudentId}
                disabled={!!editingExam} // no cambiar estudiante al editar
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de examen (solo los permitidos para este instructor) */}
            <div>
              <Label>Tipo de Examen *</Label>
              <Select
                value={formExamType}
                onValueChange={(v) => setFormExamType(v as ExamType)}
                disabled={!!editingExam} // no cambiar tipo al editar
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {examTypeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingExam && (
                <p className="text-xs text-gray-400 mt-1">
                  El tipo de examen no puede cambiarse una vez registrado.
                </p>
              )}
            </div>

            {/* Calificación */}
            <div>
              <Label>
                Calificación (0–100)
                <span className="ml-1 text-gray-400 text-xs">
                  — Deja vacío si el examen aún no se ha realizado
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Ej: 85"
                value={formScore}
                onChange={(e) => setFormScore(e.target.value)}
              />
              {formScore !== '' && (
                <p className={`text-xs mt-1 ${Number(formScore) >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(formScore) >= 70 ? '✓ Aprobado (≥ 70)' : '✗ Reprobado (< 70)'}
                </p>
              )}
            </div>

            {/* Fecha del examen */}
            <div>
              <Label>Fecha del Examen *</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* Observaciones */}
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                placeholder="Ej: El estudiante deberá repetir la prueba de paralelo..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {saving ? 'Guardando…' : editingExam ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==========================
   UTILIDAD
========================== */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}