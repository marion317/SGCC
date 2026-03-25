import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { BookOpen, Clock, Calendar, User } from "lucide-react";
import {
  getCoursesByInstructorId,
  Course,
  THEORY_SCHEDULES,
  getModalityLabel,
} from "../../utils/courseService";
import { toast } from "sonner";

type TabKey = "teoria" | "practica";

interface InstructorClassesProps {
  userId: string;
}

export function InstructorClasses({ userId }: InstructorClassesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Record<string, TabKey>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setCourses(await getCoursesByInstructorId(userId));
      } catch {
        toast.error("Error al cargar las clases del instructor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const getTab = (id: string) => activeTab[id] ?? "teoria";
  const setTab = (id: string, tab: TabKey) =>
    setActiveTab((prev) => ({ ...prev, [id]: tab }));

  if (loading) {
    return <p className="text-center py-10 text-gray-400">Cargando clases...</p>;
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Mis Clases</h2>
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-gray-400 gap-3">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p>No tienes cursos asignados aún.</p>
            <p className="text-sm">El administrador te asignará a cursos con teoría o práctica.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mis Clases</h2>

      {courses.map((course) => {
        const sched = THEORY_SCHEDULES.find((s) => s.value === course.theorySchedule);
        const tab = getTab(course.id);

        return (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">
                    Clase {course.name}
                  </CardTitle>
                  <p className="font-mono text-purple-200 text-sm mt-1">{course.code}</p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  {getModalityLabel(course.modality)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-purple-200 text-sm mt-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {course.students.length}/{course.capacity} estudiantes
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex border-b">
                <button
                  onClick={() => setTab(course.id, "teoria")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === "teoria"
                      ? "border-b-2 border-purple-600 text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📚 Clases Teóricas
                </button>
                <button
                  onClick={() => setTab(course.id, "practica")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === "practica"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🚗 Clases Prácticas
                </button>
              </div>

              <div className="p-4">
                {tab === "teoria" && (
                  <div className="space-y-4">
                    {sched ? (
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-purple-800">Horario</p>
                          <p className="text-sm text-purple-700">
                            {sched.days} · {sched.time}
                          </p>
                          {sched.note && (
                            <p className="text-xs text-purple-500 mt-0.5">{sched.note}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Horario de teoría pendiente.
                      </p>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Profesores de Teoría
                      </p>
                      {course.theoryInstructors.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">
                          Sin profesor asignado aún.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {course.theoryInstructors.map((ins) => (
                            <div
                              key={ins.id}
                              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{ins.name}</p>
                                <p className="text-xs text-gray-400">{ins.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === "practica" && (
                  <div className="space-y-4">
                    {course.practiceInstructors.length === 0 ? (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700">
                          Aún no hay profesores de práctica asignados. Los horarios estarán disponibles pronto.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Clock className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              Disponibilidad de Práctica
                            </p>
                            <p className="text-xs text-green-600 mt-0.5">
                              7:00 – 19:00 · Descanso 12:00–14:00
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {course.practiceInstructors.map((ins) => (
                            <div
                              key={ins.id}
                              className="border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{ins.name}</p>
                                  <p className="text-xs text-gray-400">{ins.email}</p>
                                </div>
                              </div>

                              {ins.practiceSlots && ins.practiceSlots.length > 0 ? (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Horarios disponibles:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {ins.practiceSlots
                                      .slice()
                                      .sort()
                                      .map((slot) => (
                                        <span
                                          key={slot}
                                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                                        >
                                          {slot}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  Horarios pendientes de confirmar.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

