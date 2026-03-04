import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { BookOpen, TrendingUp, Award, Clock, Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';

interface StudentHomeProps {
  userName?: string;
}

export function StudentHome({ userName }: StudentHomeProps) {
  const stats = [
    { title: 'Clases Completadas', value: '18/24', icon: BookOpen, color: 'text-blue-600' },
    { title: 'Asistencia', value: '95%', icon: TrendingUp, color: 'text-green-600' },
    { title: 'Promedio General', value: '88/100', icon: Award, color: 'text-purple-600' },
    { title: 'Horas Prácticas', value: '12/20', icon: Clock, color: 'text-orange-600' },
  ];

  const upcomingClasses = [
    {
      type: 'Clase Práctica',
      date: '25 Nov 2025',
      time: '10:00 AM - 12:00 PM',
      instructor: 'María González',
      vehicle: 'Toyota Corolla - ABC123',
      badge: 'Hoy'
    }
  ];

  const recentEvaluations = [
    { name: 'Examen Teórico - Grupo A', date: '20 Nov 2025', score: '85/100', status: 'Aprobado' },
    { name: 'Evaluación Práctica', date: '18 Nov 2025', score: '90/100', status: 'Aprobado' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
        <CardContent className="p-6">
          <h2 className="text-xl mb-2">Bienvenido, {userName || 'Usuario'}</h2>
          <p className="mb-4">Estás cursando: Clase B - Básico</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso del Curso</span>
              <span>75%</span>
            </div>
            <Progress value={75} className="h-2 bg-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{stat.title}</span>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Classes and Recent Evaluations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Clases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Próximas Clases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.map((clase, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm mb-1">{clase.type}</h4>
                    <p className="text-xs text-gray-600">{clase.date}</p>
                  </div>
                  <Badge className="bg-purple-600 text-white">
                    {clase.badge}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {clase.time}
                  </p>
                  <p>Instructor: {clase.instructor}</p>
                  <p>Vehículo: {clase.vehicle}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Evaluaciones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Evaluaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvaluations.map((evaluation, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm mb-1">{evaluation.name}</h4>
                      <p className="text-xs text-gray-600">{evaluation.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg">{evaluation.score}</p>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {evaluation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
