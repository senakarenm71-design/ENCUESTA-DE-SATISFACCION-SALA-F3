import React from 'react';
import { 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileSpreadsheet, 
  MessageSquare,
  BarChart,
  Users,
  Cpu,
  Wind,
  ThumbsUp
} from 'lucide-react';
import { SurveyResponse, SheetConfig } from '../types/survey';

interface ResponsesViewProps {
  responses: SurveyResponse[];
  sheetConfig: SheetConfig;
  onRefreshFromSheet?: () => void;
  onSyncPendingToSheet?: () => void;
  isSyncing?: boolean;
}

export const ResponsesView: React.FC<ResponsesViewProps> = ({
  responses,
  sheetConfig,
  onRefreshFromSheet,
  onSyncPendingToSheet,
  isSyncing = false
}) => {
  // Compute analytics
  const total = responses.length;

  const avg = (fn: (r: SurveyResponse) => number) => {
    if (total === 0) return 0;
    const sum = responses.reduce((acc, curr) => acc + (fn(curr) || 0), 0);
    return (sum / total).toFixed(1);
  };

  const avgInstalaciones = avg((r) => r.estadoInstalaciones);
  const avgEquipos = avg((r) => r.equiposFuncionamiento);
  const avgClima = avg((r) => r.climatizacionVentilacion);
  const avgComodidad = avg((r) => r.comodidadEspacio);
  const avgAtencion = avg((r) => r.atencionSoporte);

  const cumpleCount = {
    completo: responses.filter(r => r.cumpleNecesidades.toLowerCase().includes('completamente')).length,
    parcial: responses.filter(r => r.cumpleNecesidades.toLowerCase().includes('parcialmente')).length,
    no: responses.filter(r => r.cumpleNecesidades.toLowerCase().includes('no')).length
  };

  const pendingSyncCount = responses.filter(r => !r.syncedToGoogleSheets).length;

  const handleDownloadCSV = () => {
    if (responses.length === 0) return;

    const headers = [
      'Marca temporal',
      'Fecha de utilización del Ambiente F3',
      '¿Cuál es su relación con el Centro Agropecuario de Buga?',
      '¿Con qué frecuencia utiliza el Ambiente F3?',
      '¿Qué tan satisfecho está con el estado general de las instalaciones?',
      '¿Qué tan satisfecho está con el funcionamiento de los equipos?',
      '¿Qué tan satisfecho está con la iluminación y la ventilación?',
      '¿Qué tan satisfecho está con la comodidad y la distribución del espacio?',
      '¿Qué tan satisfecho está con la atención y el apoyo recibido?',
      '¿Considera que el Ambiente F3 cumple con sus necesidades?',
      '¿Qué sugerencias propone para mejorar el Ambiente F3?'
    ];

    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = responses.map(r => [
      escapeCell(r.timestamp),
      escapeCell(r.fechaUso),
      escapeCell(r.relacionCentro),
      escapeCell(r.frecuenciaUso),
      escapeCell(r.estadoInstalaciones),
      escapeCell(r.equiposFuncionamiento),
      escapeCell(r.climatizacionVentilacion),
      escapeCell(r.comodidadEspacio),
      escapeCell(r.atencionSoporte),
      escapeCell(r.cumpleNecesidades),
      escapeCell(r.sugerenciasMejora)
    ].join(','));

    // UTF-8 BOM for Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Encuesta_Satisfaccion_F3_CAB_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Respuestas de Satisfacción • Sala F3
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total acumulado: <strong className="text-emerald-700 font-bold">{total} respuestas</strong> registradas. Hoja Google: <strong className="text-emerald-700">"{sheetConfig.sheetTabName}"</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pendingSyncCount > 0 && onSyncPendingToSheet && (
            <button
              onClick={onSyncPendingToSheet}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar {pendingSyncCount} pendientes a Sheets
            </button>
          )}

          {sheetConfig.spreadsheetId && onRefreshFromSheet && (
            <button
              onClick={onRefreshFromSheet}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm transition shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Actualizar desde Sheets
            </button>
          )}

          {sheetConfig.spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs sm:text-sm transition shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Abrir Hoja de Google
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleDownloadCSV}
            disabled={total === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar CSV
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Instalaciones</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgInstalaciones} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Limpieza y orden</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Equipos PC</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgEquipos} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Funcionamiento y software</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Climatización</span>
            <Wind className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgClima} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Aire acondicionado y luz</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Comodidad</span>
            <BarChart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgComodidad} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Sillas y mesas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Atención</span>
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgAtencion} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Soporte y apoyo técnico</p>
        </div>
      </div>

      {/* Cumple necesidades Breakdown */}
      {total > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            ¿El Ambiente F3 cumple con sus necesidades de formación?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-emerald-900">Sí, completamente</div>
                <div className="text-lg font-black text-emerald-700">{cumpleCount.completo}</div>
              </div>
              <div className="text-xs font-bold text-emerald-800">
                {total > 0 ? `${Math.round((cumpleCount.completo / total) * 100)}%` : '0%'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-900">Sí, parcialmente</div>
                <div className="text-lg font-black text-amber-700">{cumpleCount.parcial}</div>
              </div>
              <div className="text-xs font-bold text-amber-800">
                {total > 0 ? `${Math.round((cumpleCount.parcial / total) * 100)}%` : '0%'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-red-900">No cumple</div>
                <div className="text-lg font-black text-red-700">{cumpleCount.no}</div>
              </div>
              <div className="text-xs font-bold text-red-800">
                {total > 0 ? `${Math.round((cumpleCount.no / total) * 100)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table of responses */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            Detalle de Respuestas Registradas
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando {responses.length} registro(s)
          </span>
        </div>

        {responses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No se han registrado respuestas aún. Complete el formulario para ver los resultados aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha Uso</th>
                  <th className="py-3 px-4">Rol en Centro</th>
                  <th className="py-3 px-4">Frecuencia</th>
                  <th className="py-3 px-3 text-center">Instalaciones</th>
                  <th className="py-3 px-3 text-center">Equipos</th>
                  <th className="py-3 px-3 text-center">Clima</th>
                  <th className="py-3 px-3 text-center">Comodidad</th>
                  <th className="py-3 px-3 text-center">Atención</th>
                  <th className="py-3 px-4">¿Cumple?</th>
                  <th className="py-3 px-4">Sugerencias</th>
                  <th className="py-3 px-4 text-center">Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {r.fechaUso || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {r.relacionCentro}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {r.frecuenciaUso}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {r.estadoInstalaciones}★
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {r.equiposFuncionamiento}★
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {r.climatizacionVentilacion}★
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {r.comodidadEspacio}★
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {r.atencionSoporte}★
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <span className={`font-semibold ${
                        r.cumpleNecesidades.includes('completamente')
                          ? 'text-emerald-700'
                          : r.cumpleNecesidades.includes('parcialmente')
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}>
                        {r.cumpleNecesidades}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-xs text-slate-600" title={r.sugerenciasMejora}>
                      {r.sugerenciasMejora || <span className="text-slate-300 italic">Sin comentarios</span>}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Guardado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Local
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
