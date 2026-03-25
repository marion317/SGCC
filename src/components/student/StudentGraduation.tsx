// src/components/student/StudentGraduation.tsx
// ARCHIVO NUEVO → src/components/student/StudentGraduation.tsx

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Award, CheckCircle, XCircle, Download, RefreshCw,
  FileText, Loader2, Clock, BookOpen, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  validateAndSaveGraduation,
  buildStudentGraduationData,
  type GraduationValidationResult,
  type StudentGraduationData,
} from "../../utils/graduationService";
import {
  generateAndDownloadCertificate,
  getCertificateRecord,
  type CertificateRecord,
} from "../../utils/certificateService";

/* ============================================================
   PROPS
   ============================================================ */
interface StudentGraduationProps {
  userId: string;
  userName: string;
  userEmail: string;
}

/* ============================================================
   SUBCOMPONENTE — ítem de requisito
   ============================================================ */
function RequirementItem({ item }: { item: { key: string; label: string; passed: boolean; detail: string } }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      item.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
    }`}>
      {item.passed
        ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        : <XCircle    className="w-5 h-5 text-red-500  mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{item.label}</p>
        <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
      </div>
      <Badge className={`shrink-0 text-xs ${
        item.passed
          ? "bg-green-100 text-green-700 border-green-300"
          : "bg-red-100  text-red-700  border-red-300"
      }`}>
        {item.passed ? "Cumple" : "Pendiente"}
      </Badge>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export function StudentGraduation({ userId, userName }: StudentGraduationProps) {
  const [loadingData,   setLoadingData]   = useState(true);
  const [validating,    setValidating]    = useState(false);
  const [downloading,   setDownloading]   = useState(false);

  const [studentData,   setStudentData]   = useState<StudentGraduationData | null>(null);
  const [result,        setResult]        = useState<GraduationValidationResult | null>(null);
  const [certificate,   setCertificate]   = useState<CertificateRecord | null>(null);

  /* ---------- Carga inicial: asistencia real + certificado previo ---------- */
  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [data, cert] = await Promise.all([
        buildStudentGraduationData(userId, userName),
        getCertificateRecord(userId),
      ]);
      setStudentData(data);
      if (cert) setCertificate(cert);
    } catch (err: any) {
      toast.error("Error al cargar datos: " + (err.message ?? ""));
    } finally {
      setLoadingData(false);
    }
  }, [userId, userName]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  /* ---------- Botón 1: Validar requisitos ---------- */
  const handleValidate = async () => {
    setValidating(true);
    try {
      const { result: res, data } = await validateAndSaveGraduation(userId, userName);
      setResult(res);
      setStudentData(data);
      if (res.eligible) {
        toast.success("¡Cumples todos los requisitos de graduación!");
      } else {
        const n = res.items.filter((i) => !i.passed).length;
        toast.warning(`Tienes ${n} requisito(s) pendiente(s).`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo completar la validación.");
    } finally {
      setValidating(false);
    }
  };

  /* ---------- Botón 2: Descargar certificado ---------- */
  const handleDownload = async () => {
    if (!result || !studentData) return;
    setDownloading(true);
    try {
      const certData = await generateAndDownloadCertificate(
        userId, result, studentData
      );
      toast.success(`Certificado descargado. Código: ${certData.certificateId}`);
      const updated = await getCertificateRecord(userId);
      if (updated) setCertificate(updated);
    } catch (err: any) {
      toast.error(err.message ?? "Error al generar el certificado.");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- Loading ---------- */
  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando datos de asistencia...</span>
      </div>
    );
  }

  /* ---------- Render principal ---------- */
  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Encabezado ── */}
      <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Graduación</h2>
            <p className="text-purple-200 text-sm">
              Valida tus requisitos y descarga tu certificado cuando estés listo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Resumen de asistencia real ── */}
      {studentData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Mi progreso académico (datos en tiempo real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 rounded-xl py-3 px-2">
                <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">
                  {studentData.theoryHoursCompleted} h
                </p>
                <p className="text-xs text-blue-500">Horas teóricas</p>
              </div>
              <div className="bg-orange-50 rounded-xl py-3 px-2">
                <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-orange-700">
                  {studentData.practiceHoursCompleted} h
                </p>
                <p className="text-xs text-orange-500">Horas prácticas</p>
              </div>
              <div className={`rounded-xl py-3 px-2 ${
                studentData.attendancePercent >= 80 ? "bg-green-50" : "bg-red-50"
              }`}>
                <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${
                  studentData.attendancePercent >= 80 ? "text-green-500" : "text-red-500"
                }`} />
                <p className={`text-xl font-bold ${
                  studentData.attendancePercent >= 80 ? "text-green-700" : "text-red-700"
                }`}>
                  {studentData.attendancePercent}%
                </p>
                <p className={`text-xs ${
                  studentData.attendancePercent >= 80 ? "text-green-500" : "text-red-500"
                }`}>
                  Asistencia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── BOTONES SEPARADOS ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones de Graduación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ── Botón 1: Validar ── */}
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full whitespace-normal text-center break-words"
            >
              {validating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validando…</>
                : <><RefreshCw className="w-4 h-4 mr-2" />{result ? "Volver a validar" : "Validar requisitos"}</>}
            </Button>

            <div className="min-w-0">
              <p className="font-medium text-gray-800 text-sm">Validación automática de requisitos</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Verifica asistencia, horas, exámenes y sanciones
              </p>
            </div>
          </div>

          <Separator />

          {/* ── Botón 2: Descargar certificado ── */}
          <div className={`flex flex-col gap-4 p-4 rounded-xl border ${
            result?.eligible
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200 opacity-60"
          }`}>
            <Button
              onClick={handleDownload}
              disabled={!result?.eligible || downloading}
              className={`w-full ${
                result?.eligible
                  ? "!bg-green-600 hover:!bg-green-700 !text-white !border-green-600"
                  : "!bg-gray-300 !text-gray-500 cursor-not-allowed"
              } whitespace-normal text-center break-words`}
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando PDF…</>
                : <><Download className="w-4 h-4 mr-2" />Descargar Certificado</>}
            </Button>

            <div className="min-w-0">
              <p className="font-medium text-gray-800 text-sm">Generación y descarga de certificado PDF</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {result?.eligible
                  ? certificate
                    ? `Certificado previo: ${certificate.certificateId} · ${certificate.downloadCount} descarga(s)`
                    : "Genera y descarga tu certificado oficial en formato PDF"
                  : "Disponible solo cuando apruebes todos los requisitos"}
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── Resultados de validación ── */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Resultado de la validación</CardTitle>
              <Badge className={`px-3 py-1 ${
                result.eligible ? "bg-green-600 text-white" : "bg-red-500 text-white"
              }`}>
                {result.eligible ? "✅ Apto para graduación" : "❌ Requisitos pendientes"}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{result.summary}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.items.map((item) => (
              <RequirementItem key={item.key} item={item} />
            ))}

            {/* Barra de progreso */}
            <div className="pt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Requisitos cumplidos</span>
                <span>
                  {result.items.filter((i) => i.passed).length} / {result.items.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    result.eligible ? "bg-green-500" : "bg-purple-500"
                  }`}
                  style={{
                    width: `${(result.items.filter((i) => i.passed).length / result.items.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Certificado ya emitido ── */}
      {certificate && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-700 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Certificado emitido</p>
              <p className="text-xs text-green-700 mt-0.5">
                Código: <span className="font-mono">{certificate.certificateId}</span>
                {" · "}Descargado {certificate.downloadCount} vez(ces)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}