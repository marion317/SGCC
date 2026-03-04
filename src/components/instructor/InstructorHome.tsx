import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, MapPin, Car, User, Calendar } from 'lucide-react';

interface InstructorHomeProps {
  userName?: string;
}

export function InstructorHome({ userName }: InstructorHomeProps) {
  const todayClasses = [
    {
      time: '10:00 AM - 11:30 AM',
      type: 'Teórica',
      location: 'Aula 201',
      group: 'Grupo A - Señales de Tránsito',
      typeColor: 'bg-blue-100 text-blue-800'
    },
    {
      time: '2:00 PM - 3:30 PM',
      type: 'Práctica',
      vehicle: 'Toyota Corolla - ABC123',
      student: 'Alumno: Juan Pérez',
      typeColor: 'bg-green-100 text-green-800'
    },
    {
      time: '4:00 PM - 5:00 PM',
      type: 'Práctica',
      vehicle: 'Honda Civic - XYZ789',
      student: 'Alumno: María García',
      typeColor: 'bg-green-100 text-green-800'
    }
  ];

  const upcomingEvaluations = [
    {
      name: 'Examen Teórico - Grupo A',
      date: '25 Nov 2025',
      students: 15,
      type: 'Teórico',
      typeColor: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'Examen Práctico - Estacionamiento',
      date: '26 Nov 2025',
      students: 8,
      type: 'Práctico',
      typeColor: 'bg-green-100 text-green-800'
    },
    {
      name: 'Evaluación Final - Grupo B',
      date: '28 Nov 2025',
      students: 12,
      type: 'Teórico/Práctico',
      typeColor: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Bienvenido, {userName || 'Usuario'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clases del Día */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clases del Día</CardTitle>
              <Badge className="bg-purple-600 text-white">3 clases</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayClasses.map((clase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{clase.time}</span>
                    </div>
                    <Badge className={clase.typeColor}>
                      {clase.type}
                    </Badge>
                  </div>

                  {clase.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{clase.location}</span>
                    </div>
                  )}

                  {clase.group && (
                    <p className="text-sm">{clase.group}</p>
                  )}

                  {clase.vehicle && (
                    <>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Car className="w-4 h-4" />
                        <span className="text-sm">{clase.vehicle}</span>
                      </div>
                      <p className="text-sm text-gray-600">{clase.student}</p>
                    </>
                  )}

                  <Button 
                    type="button"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Registrar Asistencia
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximas Evaluaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Evaluaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvaluations.map((evaluation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm mb-1">{evaluation.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>{evaluation.date}</span>
                      </div>
                    </div>
                    <Badge className={evaluation.typeColor}>
                      {evaluation.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{evaluation.students} estudiantes</span>
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
