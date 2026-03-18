// WeeklyCalendar.tsx — Horario semanal visual basado en sesiones y horarios de teoría
import { Course, THEORY_SCHEDULES } from '../utils/courseService';
import type { ClassSession } from '../utils/scheduleService';
import { Clock, BookOpen, Car } from 'lucide-react';

interface WeeklyCalendarProps {
  courses: Course[];
  /** Sesiones reales del estudiante/instructor (opcional). Si hay sesiones esta semana, se muestran; si no, se usa el horario de teoría de los cursos. */
  sessions?: ClassSession[];
}

const WEEK_DAYS = [
  { key: 'Lun', label: 'Lunes', jsDay: 1 },
  { key: 'Mar', label: 'Martes', jsDay: 2 },
  { key: 'Mié', label: 'Miércoles', jsDay: 3 },
  { key: 'Jue', label: 'Jueves', jsDay: 4 },
  { key: 'Vie', label: 'Viernes', jsDay: 5 },
  { key: 'Sáb', label: 'Sábado', jsDay: 6 },
];

function getDaysForSchedule(days: string): string[] {
  if (days === 'Lunes a Viernes') return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  if (days === 'Lunes a Sábado') return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  if (days === 'Sábados') return ['Sáb'];
  return [];
}

/** Fechas YYYY-MM-DD de Lun a Sáb de la semana actual (lunes como inicio de semana). */
function getCurrentWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const dates: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

interface BlockItem {
  courseName: string;
  courseCode: string;
  time: string;
  colorIdx: number;
  type?: 'teoria' | 'practica';
}

const PALETTE = [
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', dot: 'bg-teal-500' },
];

export function WeeklyCalendar({ courses, sessions = [] }: WeeklyCalendarProps) {
  const todayJsDay = new Date().getDay();

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-gray-400 gap-2 border rounded-xl bg-gray-50">
        <Clock className="w-8 h-8 opacity-30" />
        <p className="text-sm">No hay cursos inscritos para mostrar</p>
      </div>
    );
  }

  const weekDates = getCurrentWeekDates();
  const dayMap: Record<string, BlockItem[]> = {
    Lun: [], Mar: [], Mié: [], Jue: [], Vie: [], Sáb: [],
  };

  const courseIdxMap = new Map<string, number>();
  courses.forEach((c, i) => courseIdxMap.set(c.id, i % PALETTE.length));

  // Prioridad 1: Si hay sesiones esta semana, usarlas para el horario
  const thisWeekSessions = sessions.filter((s) => weekDates.includes(s.date));
  if (thisWeekSessions.length > 0) {
    thisWeekSessions.forEach((s) => {
      const idx = weekDates.indexOf(s.date);
      if (idx >= 0 && idx < 6) {
        const key = WEEK_DAYS[idx].key;
        const colorIdx = courseIdxMap.get(s.courseId) ?? 0;
        dayMap[key].push({
          courseName: s.courseName,
          courseCode: s.courseCode,
          time: `${s.startTime} – ${s.endTime}`,
          colorIdx,
          type: s.type,
        });
      }
    });
    // Ordenar bloques por hora dentro de cada día
    (Object.keys(dayMap) as (keyof typeof dayMap)[]).forEach((key) => {
      dayMap[key].sort((a, b) => {
        const timeA = a.time.split('–')[0].trim();
        const timeB = b.time.split('–')[0].trim();
        return timeA.localeCompare(timeB);
      });
    });
  } else {
    // Prioridad 2: Horario recurrente de teoría basado en cursos inscritos
    courses.forEach((course, idx) => {
      const sched = THEORY_SCHEDULES.find((s) => s.value === course.theorySchedule);
      if (!sched) return;
      const days = getDaysForSchedule(sched.days);
      days.forEach((day) => {
        dayMap[day].push({
          courseName: `Clase ${course.name}`,
          courseCode: course.code,
          time: sched.time,
          colorIdx: idx % PALETTE.length,
          type: 'teoria',
        });
      });
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {courses.map((c, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const sched = THEORY_SCHEDULES.find((s) => s.value === c.theorySchedule);
          return (
            <div
              key={c.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${color.bg} ${color.text} ${color.border}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
              Clase {c.name}
              {sched && <span className="opacity-60 font-normal">· {sched.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {WEEK_DAYS.map(({ key, label, jsDay }) => {
          const isToday = jsDay === todayJsDay;
          const blocks = dayMap[key] ?? [];
          return (
            <div
              key={key}
              className={`rounded-xl border overflow-hidden ${isToday ? 'ring-2 ring-purple-400' : ''}`}
            >
              <div
                className={`px-1 py-2 text-center ${isToday ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide">{key}</p>
                <p
                  className={`text-[10px] hidden sm:block ${isToday ? 'text-purple-200' : 'text-gray-400'}`}
                >
                  {label}
                </p>
                {isToday && <p className="text-[10px] font-semibold text-purple-100">Hoy</p>}
              </div>
              <div className="p-1.5 space-y-1.5 min-h-[70px] bg-white">
                {blocks.length === 0 ? (
                  <div className="flex items-center justify-center h-12">
                    <span className="text-gray-200 text-base select-none">—</span>
                  </div>
                ) : (
                  blocks.map((block, i) => {
                    const color = PALETTE[block.colorIdx];
                    return (
                      <div
                        key={`${block.courseCode}-${block.time}-${i}`}
                        className={`rounded-lg border px-1.5 py-1 ${color.bg} ${color.border}`}
                      >
                        <div className="flex items-center gap-1">
                          <p className={`text-[11px] font-bold truncate flex-1 ${color.text}`}>
                            {block.courseName}
                          </p>
                          {block.type === 'teoria' ? (
                            <BookOpen className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          ) : block.type === 'practica' ? (
                            <Car className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          ) : null}
                        </div>
                        <p className={`text-[10px] font-mono truncate opacity-60 ${color.text}`}>
                          {block.courseCode}
                        </p>
                        <div className={`flex items-center gap-0.5 mt-0.5 ${color.text} opacity-80`}>
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <p className="text-[9px] leading-tight">{block.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
