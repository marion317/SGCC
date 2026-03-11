import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { BookOpen, Search, CheckCircle, Users, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  enrollStudentByCourseCode, getCoursesByStudentId,
  Course, CourseStudent, THEORY_SCHEDULES, getModalityLabel,
} from '../../utils/courseService';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface StudentEnrollmentProps {
  userId: string;
  userDisplayName: string;
  userEmail: string;
}

export function StudentEnrollment({ userId, userDisplayName, userEmail }: StudentEnrollmentProps) {
  const [courseCode, setCourseCode]     = useState('');
  const [enrolling, setEnrolling]       = useState(false);
  const [myCourses, setMyCourses]       = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [username, setUsername]         = useState('');

  useEffect(() => {
    const loadUsername = async () => {
      if (!userId) return;
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) setUsername(snap.data().username ?? '');
      } catch { /* ignore */ }
    };
    loadUsername();
  }, [userId]);

  const loadMyCourses = async () => {
    try {
      setLoadingCourses(true);
      setMyCourses(await getCoursesByStudentId(userId));
    } catch {
      toast.error('Error al cargar tus cursos');
    } finally {
      setLoadingCourses(false);
    }
  };
  useEffect(() => { loadMyCourses(); }, [userId]);

  const handleEnroll = async () => {
    if (!courseCode.trim()) { toast.error('Ingresa el código del curso'); return; }
    let uname = username;
    if (!uname) {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) uname = snap.data().username ?? '';
      } catch { /* ignore */ }
    }
    const student: CourseStudent = { id: userId, uid: userId, name: userDisplayName, email: userEmail, username: uname };
    try {
      setEnrolling(true);
      const course = await enrollStudentByCourseCode(courseCode.trim().toUpperCase(), student);
      toast.success(`¡Inscrito en Clase ${course.name} correctamente!`);
      setCourseCode('');
      loadMyCourses();
    } catch (err: any) {
      toast.error(err.message || 'Error al matricularse');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Matricularse</h2>
        <p className="text-gray-500 text-sm">Ingresa el código del curso para inscribirte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-purple-600" /> Inscribirse a un Curso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Código del curso</Label>
            <div className="flex gap-2 mt-1">
              <Input value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="Ej: 2302026001" className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleEnroll()} />
              <Button className="bg-purple-600 hover:bg-purple-700 shrink-0"
                onClick={handleEnroll} disabled={enrolling || !courseCode.trim()}>
                {enrolling ? 'Inscribiendo...' : <><Search className="w-4 h-4 mr-1" /> Inscribirme</>}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Formato: <span className="font-mono">230YYYYNNN</span> — lo proporciona el administrador.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" /> Mis Cursos Inscritos
        </h3>
        {loadingCourses ? (
          <p className="text-gray-400 text-sm">Cargando tus cursos...</p>
        ) : myCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-gray-400 gap-2">
              <BookOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm">Aún no estás inscrito en ningún curso.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCourses.map((course) => {
              const sched = THEORY_SCHEDULES.find((s) => s.value === course.theorySchedule);
              const practiceSlots = course.practiceInstructors.flatMap((i) => i.practiceSlots ?? []);
              return (
                <Card key={course.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">Clase {course.name}</h4>
                        <p className="font-mono text-xs text-purple-600">{course.code}</p>
                      </div>
                      <Badge className={
                        course.status === 'activo' ? 'bg-green-500' :
                        course.status === 'completado' ? 'bg-blue-500' : 'bg-gray-400'
                      }>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {sched && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>Teoría: {sched.time} · {sched.days}</span>
                        </div>
                      )}
                      {practiceSlots.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-green-500 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-500">Práctica:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {practiceSlots.map((s) => (
                                <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{course.students.length}/{course.capacity} · {getModalityLabel(course.modality)}</span>
                      </div>
                    </div>
                    {(course.theoryInstructors.length > 0 || course.practiceInstructors.length > 0) && (
                      <div className="text-xs text-gray-500 space-y-0.5 border-t pt-2">
                        {course.theoryInstructors.map((i) => <p key={i.id}>📚 Teoría: {i.name}</p>)}
                        {course.practiceInstructors.map((i) => <p key={i.id}>🚗 Práctica: {i.name}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}