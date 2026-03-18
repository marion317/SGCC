// StudentAttendance.tsx — está en src/components/student/ → ui está en ../ui/
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAttendanceSummaryByStudent, getAttendanceByStudent,
  AttendanceSummary, AttendanceRecord,
} from '../../utils/scheduleService';

interface StudentAttendanceProps {
  userId: string;
}

function PercentageRing({ value }: { value: number }) {
  const color   = value >= 80 ? 'text-green-600'  : value >= 60 ? 'text-yellow-500'  : 'text-red-600';
  const bgColor = value >= 80 ? 'bg-green-50'     : value >= 60 ? 'bg-yellow-50'     : 'bg-red-50';
  const border  = value >= 80 ? 'border-green-200': value >= 60 ? 'border-yellow-200': 'border-red-200';
  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full ${bgColor} border-4 ${border}`}>
      <span className={`text-xl font-bold ${color}`}>{value}%</span>
    </div>
  );
}

function statusBadge(status: string) {
  if (status === 'presente') return <Badge className="bg-green-500 text-white text-xs">Presente</Badge>;
  if (status === 'tardanza') return <Badge className="bg-yellow-500 text-white text-xs">Tardanza</Badge>;
  return <Badge className="bg-red-500 text-white text-xs">Ausente</Badge>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function StudentAttendance({ userId }: StudentAttendanceProps) {
  const [summaries, setSummaries]         = useState<AttendanceSummary[]>([]);
  const [records, setRecords]             = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sums, recs] = await Promise.all([
          getAttendanceSummaryByStudent(userId),
          getAttendanceByStudent(userId),
        ]);
        setSummaries(sums);
        setRecords(recs);
        if (sums.length > 0) setSelectedCourse(sums[0].courseId);
      } catch {
        toast.error('Error al cargar asistencia');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const alerts       = summaries.filter((s) => s.lowAlert);
  const courseRecords = records
    .filter((r) => r.courseId === selectedCourse)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return <p className="text-center py-12 text-gray-400">Cargando asistencia...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi Asistencia</h2>
        <p className="text-gray-500 text-sm mt-1">Consulta tu asistencia por curso</p>
      </div>

      {/* Alertas baja asistencia */}
      {alerts.map((a) => (
        <div key={a.courseId}
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">⚠️ Baja asistencia — {a.courseName}</p>
            <p className="text-sm text-red-600">
              Tu asistencia es del <strong>{a.percentage}%</strong> ({a.present}/{a.total} clases).
              El mínimo requerido es 80%. Comunícate con tu instructor.
            </p>
          </div>
        </div>
      ))}

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <BookOpen className="w-12 h-12 opacity-30" />
          <p>No estás inscrito en ningún curso activo</p>
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaries.map((s) => (
              <button key={s.courseId} type="button"
                onClick={() => setSelectedCourse(s.courseId)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedCourse === s.courseId
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-200'
                }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-800">{s.courseName}</p>
                      {s.lowAlert
                        ? <AlertTriangle className="w-4 h-4 text-red-500" />
                        : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-xs font-mono text-purple-600 mb-3">{s.courseCode}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="text-sm font-bold text-gray-700">{s.total}</p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                      <div className="bg-green-50 rounded-lg py-1.5">
                        <p className="text-sm font-bold text-green-700">{s.present}</p>
                        <p className="text-xs text-green-500">Presentes</p>
                      </div>
                      <div className="bg-red-50 rounded-lg py-1.5">
                        <p className="text-sm font-bold text-red-700">{s.absent}</p>
                        <p className="text-xs text-red-400">Ausentes</p>
                      </div>
                    </div>
                  </div>
                  <PercentageRing value={s.percentage} />
                </div>
                {s.total === 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">Sin sesiones pasadas aún</p>
                )}
              </button>
            ))}
          </div>

          {/* Detalle registros */}
          {selectedCourse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Detalle — {summaries.find((s) => s.courseId === selectedCourse)?.courseName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courseRecords.length === 0 ? (
                  <p className="text-center text-gray-400 py-6">No hay registros de asistencia aún</p>
                ) : (
                  <div className="space-y-2">
                    {courseRecords.map((r) => (
                      <div key={r.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50">
                        <div className="flex items-center gap-3">
                          {r.status === 'ausente'
                            ? <TrendingDown className="w-4 h-4 text-red-400" />
                            : <TrendingUp className="w-4 h-4 text-green-500" />}
                          <span className="text-sm font-medium text-gray-700">{formatDate(r.date)}</span>
                        </div>
                        {statusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
