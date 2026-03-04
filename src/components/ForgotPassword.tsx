import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { requestPasswordReset } from '../utils/authService';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor ingrese su correo electrónico');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email);
      toast.success('Revisa tu correo para restablecer tu contraseña');
      onBack();
    } catch (error: any) {
      toast.error('No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos un enlace de recuperación
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? 'Enviando...' : 'Enviar correo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
