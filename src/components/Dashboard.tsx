import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DashboardProps {
  userName?: string;
}

export function Dashboard({ userName }: DashboardProps) {
  const stats = [
    { title: 'Estudiantes Activos', value: '247', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Cursos en Progreso', value: '12', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Ingresos del Mes', value: '$45,230', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Tasa de Aprobación', value: '94%', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Panel de Control</h2>
        <p className="text-gray-600">
          {userName ? `Bienvenido, ${userName}` : 'Bienvenido al Sistema de Gestión del Centro de Enseñanza Automotriz'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nuevo estudiante inscrito', name: 'Ana Martínez', time: 'Hace 10 minutos' },
                { action: 'Pago completado', name: 'Pedro López', time: 'Hace 1 hora' },
                { action: 'Curso finalizado', name: 'María García', time: 'Hace 2 horas' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Clase B - Intensivo', date: '25 Nov 2025', students: '8/15' },
                { name: 'Clase A2', date: '28 Nov 2025', students: '5/12' },
                { name: 'Clase C', date: '1 Dic 2025', students: '10/15' },
              ].map((course, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm">{course.name}</p>
                    <p className="text-xs text-gray-500">{course.date}</p>
                  </div>
                  <span className="text-xs text-gray-600">{course.students}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
