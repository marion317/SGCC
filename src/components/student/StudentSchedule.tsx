// StudentSchedule.tsx — está en src/components/student/ → ui está en ../ui/
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSessionsByStudent, getAttendanceByStudent,
  markAttendance, ClassSession, AttendanceRecord,
} from '../../utils/scheduleService';
import { getCoursesByStudentId, Course } from '../../utils/courseService';
import { WeeklyCalendar } from '../WeeklyCalendar';

interface StudentScheduleProps {
  userId: string;
  userName: string;
}

function typeBadge(type: string) {
  return type === 'teoria'
    ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Teoría</Badge>
    : <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Práctica</Badge>;
}

function statusBadge(status?: string) {
  if (status === 'presente') return <Badge className="bg-green-500 text-white">Presente</Badge>;
  if (status === 'tardanza') return <Badge className="bg-yellow-500 text-white">Tardanza</Badge>;
  if (status === 'ausente')  return <Badge className="bg-red-500 text-white">Ausente</Badge>;
  return null;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  return `${days[date.getDay()]} ${d} ${months[parseInt(m)-1]} ${y}`;
}

export function StudentSchedule({ userId, userName }: StudentScheduleProps) {
  const [sessions, setSessions]     = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses]       = useState<Course[]>([]);
  const [loading, setLoading]       = useState(true);
  const [marking, setMarking]       = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sess, att, crss] = await Promise.all([
        getSessionsByStudent(userId),
        getAttendanceByStudent(userId),
        getCoursesByStudentId(userId),
      ]);
      setSessions(sess);
      setAttendance(att);
      setCourses(crss);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el horario';
      toast.error(msg);
      console.error('Error cargando horario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  const attMap = useMemo(() => {
    const m: Record<string, AttendanceRecord> = {};
    attendance.forEach((a) => { m[a.sessionId] = a; });
    return m;
  }, [attendance]);

  const today        = new Date().toISOString().split('T')[0];
  const todaySess    = sessions.filter((s) => s.date === today);
  const upcoming     = sessions.filter((s) => s.date >  today);
  const past         = sessions.filter((s) => s.date <  today);

  const handleMark = async (session: ClassSession, status: AttendanceRecord['status']) => {
    try {
      setMarking(session.id);
      await markAttendance(session, userId, userName, status);
      toast.success(`Asistencia marcada como ${status}`);
      await loadData();
    } catch {
      toast.error('Error al registrar asistencia');
    } finally {
      setMarking(null);
    }
  };

  const SessionCard = ({ s, showMark }: { s: ClassSession; showMark: boolean }) => {
    const record = attMap[s.id];
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 min-w-[64px] text-center shrink-0">
            <span className="text-xs text-purple-500 font-medium">{s.date.split('-')[2]}/{s.date.split('-')[1]}</span>
            <span className="text-xs text-gray-400">{s.date.split('-')[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800">{s.courseName}</p>
              {typeBadge(s.type)}
              {record && statusBadge(record.status)}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {s.startTime} – {s.endTime}
            </p>
            {s.topic && <p className="text-sm text-gray-600 mt-0.5">📖 {s.topic}</p>}
            <p className="text-xs font-mono text-purple-600 mt-0.5">{s.courseCode}</p>
          </div>
        </div>

        {showMark && (
          <div className="flex items-center gap-2 shrink-0">
            {record ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Marcado:</span>
                {statusBadge(record.status)}
                <button type="button"
                  onClick={() => handleMark(s, record.status === 'presente' ? 'tardanza' : 'presente')}
                  disabled={marking === s.id}
                  className="text-xs text-purple-600 hover:underline disabled:opacity-50">
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleMark(s, 'presente')} disabled={marking === s.id}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Presente
                </Button>
                <Button size="sm" onClick={() => handleMark(s, 'tardanza')} disabled={marking === s.id}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" /> Tardanza
                </Button>
                <Button size="sm" onClick={() => handleMark(s, 'ausente')} disabled={marking === s.id}
                  variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs">
                  <XCircle className="w-3 h-3 mr-1" /> Ausente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <p className="text-center py-12 text-gray-400">Cargando horario...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi Horario</h2>
        <p className="text-gray-500 text-sm mt-1">Consulta tus sesiones y registra tu asistencia</p>
      </div>

      {/* Horario semanal visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-purple-600" /> Horario Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar courses={courses} sessions={sessions} />
        </CardContent>
      </Card>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Hoy ({todaySess.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Pasadas ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-purple-600" />
                {formatDate(today)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySess.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <Calendar className="w-10 h-10 opacity-30" />
                  <p>No tienes clases programadas para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySess.map((s) => <SessionCard key={s.id} s={s} showMark={true} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-purple-600" />
                Próximas sesiones
              </CardTitle>
              <p className="text-sm text-gray-500">Clases programadas en fechas futuras</p>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <BookOpen className="w-10 h-10 opacity-30" />
                  <p>No hay sesiones próximas programadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((s) => <SessionCard key={s.id} s={s} showMark={false} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-purple-600" />
                Sesiones pasadas
              </CardTitle>
              <p className="text-sm text-gray-500">Historial de clases realizadas</p>
            </CardHeader>
            <CardContent>
              {past.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <Clock className="w-10 h-10 opacity-30" />
                  <p>No hay sesiones pasadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...past].reverse().map((s) => <SessionCard key={s.id} s={s} showMark={true} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}