// StudentExams.tsx  ← NUEVO
// Vista de exámenes del estudiante: muestra los resultados teóricos y prácticos
// dados por sus instructores. Solo lectura — el estudiante no puede editar nada.

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getExamsByStudent, Exam, ExamType } from '../../utils/examService';
import { getCoursesByStudentId, Course } from '../../utils/courseService';

/* ==========================
   PROPS
========================== */
interface StudentExamsProps {
  userId: string;
}

/* ==========================
   HELPERS UI
========================== */
const examTypeLabel = (type: ExamType) =>
  type === 'theory' ? 'Teórico' : 'Práctico';

const StatusBadge = ({ exam }: { exam: Exam }) => {
  if (exam.status === 'approved')
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" /> Aprobado
      </Badge>
    );
  if (exam.status === 'failed')
    return (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
        <XCircle className="w-3 h-3" /> Reprobado
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
      <Clock className="w-3 h-3" /> Pendiente
    </Badge>
  );
};

/* ==========================
   TARJETA RESUMEN POR CURSO
========================== */
interface CourseSummary {
  course: Course;
  theory: Exam | null;
  practice: Exam | null;
}

const ScoreCircle = ({ score }: { score: number | null }) => {
  if (score === null)
    return <span className="text-2xl font-bold text-gray-300">—</span>;
  const color = score >= 70 ? 'text-green-600' : 'text-red-600';
  return <span className={`text-3xl font-bold ${color}`}>{score}</span>;
};

/* ==========================
   COMPONENTE PRINCIPAL
========================== */
export function StudentExams({ userId }: StudentExamsProps) {
  const [exams, setExams]         = useState<Exam[]>([]);
  const [courses, setCourses]     = useState<Course[]>([]);
  const [loading, setLoading]     = useState(true);

  /* ---- Carga de datos ---- */
  const loadData = async () => {
    try {
      setLoading(true);
      const [examData, courseData] = await Promise.all([
        getExamsByStudent(userId),
        getCoursesByStudentId(userId),
      ]);
      setExams(examData);
      setCourses(courseData);
    } catch {
      toast.error('Error al cargar las evaluaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  /* ---- Construir resumen por curso ---- */
  const summaries: CourseSummary[] = courses.map((course) => {
    const courseExams = exams.filter((e) => e.courseId === course.id);
    return {
      course,
      theory:   courseExams.find((e) => e.examType === 'theory')   ?? null,
      practice: courseExams.find((e) => e.examType === 'practice') ?? null,
    };
  });

  /* ---- Estadísticas globales ---- */
  const totalExams     = exams.length;
  const approved       = exams.filter((e) => e.status === 'approved').length;
  const failed         = exams.filter((e) => e.status === 'failed').length;
  const pending        = exams.filter((e) => e.status === 'pending').length;
  const avgScore       = (() => {
    const scored = exams.filter((e) => e.score !== null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((s, e) => s + e.score!, 0) / scored.length);
  })();

  /* ==========================
     RENDER
  ========================== */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando evaluaciones…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Cabecera ---- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-purple-600" />
          Mis Evaluaciones
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Aquí puedes consultar los resultados de tus exámenes teóricos y prácticos.
        </p>
      </div>

      {/* ---- Tarjetas de estadística ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total exámenes" value={totalExams}          color="purple" />
        <StatCard label="Aprobados"       value={approved}           color="green"  />
        <StatCard label="Reprobados"      value={failed}             color="red"    />
        <StatCard
          label="Promedio general"
          value={avgScore !== null ? `${avgScore} / 100` : '—'}
          color={avgScore !== null && avgScore >= 70 ? 'green' : 'gray'}
        />
      </div>

      {/* ---- Sin cursos inscritos ---- */}
      {courses.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-gray-300" />}
          title="No estás inscrito en ningún curso"
          subtitle="Cuando te inscribas, aquí verás tus resultados."
        />
      )}

      {/* ---- Resumen por curso ---- */}
      {summaries.map(({ course, theory, practice }) => (
        <Card key={course.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              {course.name}
              <span className="text-gray-400 font-normal text-sm">— {course.code}</span>
              <Badge
                className={`ml-auto text-xs ${
                  course.status === 'activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {course.status}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Mini-resumen visual: teórico + práctico lado a lado */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <ExamCard type="theory"   exam={theory}   />
              <ExamCard type="practice" exam={practice} />
            </div>

            {/* Tabla detallada si hay al menos un examen */}
            {(theory || practice) && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Calificación</TableHead>
                    <TableHead className="text-center">Resultado</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[theory, practice].filter(Boolean).map((exam) => (
                    <TableRow key={exam!.id}>
                      <TableCell>
                        <Badge
                          className={
                            exam!.examType === 'theory'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'
                          }
                        >
                          {examTypeLabel(exam!.examType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{exam!.examDate}</TableCell>
                      <TableCell className="text-center font-bold">
                        {exam!.score !== null ? `${exam!.score} / 100` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge exam={exam!} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {exam!.instructorName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[180px] truncate">
                        {exam!.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Sin exámenes aún */}
            {!theory && !practice && (
              <p className="text-center text-sm text-gray-400 py-4">
                Aún no hay exámenes registrados para este curso.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ==========================
   SUB-COMPONENTES
========================== */

/** Tarjeta mini mostrando el estado de un examen (teórico o práctico) */
function ExamCard({ type, exam }: { type: ExamType; exam: Exam | null }) {
  const isTheory = type === 'theory';
  const colorClass = isTheory ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50';
  const labelColor = isTheory ? 'text-blue-700' : 'text-orange-700';

  return (
    <div className={`rounded-lg border p-4 flex flex-col items-center gap-1 ${colorClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>
        Examen {examTypeLabel(type)}
      </p>
      <ScoreCircle score={exam?.score ?? null} />
      <p className="text-xs text-gray-500">/ 100 pts</p>
      {exam ? (
        <StatusBadge exam={exam} />
      ) : (
        <Badge className="bg-gray-100 text-gray-400 text-xs">Sin registrar</Badge>
      )}
    </div>
  );
}

/** Tarjeta de estadística general */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: 'purple' | 'green' | 'red' | 'gray';
}) {
  const colors = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    red:    'bg-red-50    border-red-200    text-red-700',
    gray:   'bg-gray-50   border-gray-200   text-gray-500',
  };
  return (
    <div className={`rounded-lg border p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 text-gray-500">{label}</p>
    </div>
  );
}

/** Estado vacío genérico */
function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <p className="text-gray-600 font-medium">{title}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}
