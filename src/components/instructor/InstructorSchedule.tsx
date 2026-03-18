// InstructorSchedule.tsx — está en src/components/instructor/ → ui está en ../ui/
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getSessionsByInstructor, ClassSession } from '../../utils/scheduleService';
import { getCoursesByInstructorId, Course } from '../../utils/courseService';
import { WeeklyCalendar } from '../WeeklyCalendar';

interface InstructorScheduleProps {
  userId: string;
}

function typeBadge(type: string) {
  return type === 'teoria'
    ? <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Teoría</Badge>
    : <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Práctica</Badge>;
}

export function InstructorSchedule({ userId }: InstructorScheduleProps) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, crss] = await Promise.all([
          getSessionsByInstructor(userId),
          getCoursesByInstructorId(userId),
        ]);
        setSessions(data);
        setCourses(crss);
      } catch {
        toast.error('Error al cargar el horario');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const today    = new Date().toISOString().split('T')[0];
  const upcoming = sessions.filter((s) => s.date >= today);
  const past     = sessions.filter((s) => s.date <  today);

  const SessionRow = ({ s }: { s: ClassSession }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 min-w-[64px] text-center shrink-0">
          <span className="text-sm font-bold text-purple-700">{s.date.split('-')[2]}/{s.date.split('-')[1]}</span>
          <span className="text-xs text-gray-400">{s.date.split('-')[0]}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-gray-800">{s.courseName}</p>
            {typeBadge(s.type)}
            {s.date === today && <Badge className="bg-purple-600 text-white">Hoy</Badge>}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {s.startTime} – {s.endTime}
          </p>
          {s.topic && <p className="text-sm text-gray-600 mt-0.5">📖 {s.topic}</p>}
          <p className="text-xs font-mono text-purple-600 mt-0.5">{s.courseCode}</p>
        </div>
      </div>
    </div>
  );

  if (loading) return <p className="text-center py-12 text-gray-400">Cargando horario...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi Horario</h2>
        <p className="text-gray-500 text-sm mt-1">Sesiones asignadas a tus cursos</p>
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

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <Calendar className="w-12 h-12 opacity-30" />
          <p>No tienes sesiones programadas</p>
          <p className="text-sm">El administrador asignará horarios a tus cursos</p>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              <Calendar className="w-4 h-4 mr-1" /> Próximas y hoy ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              <Clock className="w-4 h-4 mr-1" /> Pasadas ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardContent className="pt-4">
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                    <BookOpen className="w-10 h-10 opacity-30" />
                    <p>No hay sesiones próximas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((s) => <SessionRow key={s.id} s={s} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardContent className="pt-4">
                {past.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                    <Clock className="w-10 h-10 opacity-30" />
                    <p>No hay sesiones pasadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...past].reverse().map((s) => <SessionRow key={s.id} s={s} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}