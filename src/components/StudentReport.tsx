// src/components/StudentReport.tsx
import { useState, useCallback } from "react";
import {
  generateStudentReport,
  formatTimestamp,
  StudentReportItem,
  ReportFilters,
} from "../utils/reportService";
import { COURSE_NAMES } from "../utils/courseService";
import {
  exportStudentReportExcel,
  exportStudentReportPdf,
} from "../utils/studentReportExport";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { FileSpreadsheet, FileText, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

/* ==============================
   HELPERS
============================== */
const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  completado: "Completado",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  activo: "default",
  inactivo: "destructive",
  completado: "secondary",
};

// Exportaciones: Excel (.xlsx) y PDF (ver src/utils/studentReportExport.ts)

/* ==============================
   COMPONENTE
============================== */
export function StudentReport() {
  const [filters, setFilters] = useState<ReportFilters>({
    courseName: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [results, setResults] = useState<StudentReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await generateStudentReport(filters);
      setResults(data);
      if (!data.length) {
        toast.info("No se encontraron estudiantes con esos filtros.");
      } else {
        toast.success(`${data.length} registro(s) encontrado(s).`);
      }
    } catch (err: any) {
      toast.error("Error al generar el reporte: " + (err?.message ?? ""));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleReset = () => {
    setFilters({ courseName: "", status: "", dateFrom: "", dateTo: "" });
    setResults([]);
    setSearched(false);
  };

  const handleExportExcel = () => {
    try {
      exportStudentReportExcel(results);
      toast.success("Excel descargado");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al exportar Excel");
    }
  };

  const handleExportPdf = () => {
    try {
      exportStudentReportPdf(results);
      toast.success("PDF descargado");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al exportar PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl">Reporte de Estudiantes</h2>
          <p className="text-sm text-gray-500">
            Filtra y exporta información detallada de estudiantes por curso
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro: Curso */}
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={filters.courseName ?? ""}
                onValueChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    courseName: val === "todos" ? "" : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  {COURSE_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Estado */}
            <div className="space-y-2">
              <Label>Estado del curso</Label>
              <Select
                value={filters.status ?? ""}
                onValueChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    status:
                      val === "todos"
                        ? ""
                        : (val as ReportFilters["status"]),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Fecha desde */}
            <div className="space-y-2">
              <Label>Fecha desde</Label>
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
              />
            </div>

            {/* Filtro: Fecha hasta */}
            <div className="space-y-2">
              <Label>Fecha hasta</Label>
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
            {results.length > 0 && (
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button variant="outline" onClick={handleExportPdf}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      {searched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Resultados
              <Badge variant="secondary">{results.length} registro(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileSpreadsheet className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">
                  No se encontraron estudiantes con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Inscripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, idx) => (
                      <TableRow key={`${row.studentId}-${row.courseCode}`}>
                        <TableCell className="text-gray-400 text-sm">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.studentName}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {row.email}
                        </TableCell>
                        <TableCell className="text-sm">{row.cedula}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.courseName}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {row.courseCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              STATUS_VARIANTS[row.courseStatus] ?? "outline"
                            }
                          >
                            {STATUS_LABELS[row.courseStatus] ??
                              row.courseStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {row.modality}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {row.theorySchedule}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatTimestamp(row.enrolledAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}