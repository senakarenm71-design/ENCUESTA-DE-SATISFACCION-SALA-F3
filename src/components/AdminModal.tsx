import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  LogOut, 
  BarChart3, 
  Code,
  Lock,
  Layers
} from 'lucide-react';
import { SurveyResponse, SheetConfig } from '../types/survey';
import { TARGET_SHEET_NAME, DEFAULT_SPREADSHEET_ID } from '../lib/sheetsService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  sheetConfig: SheetConfig;
  responses: SurveyResponse[];
  onSyncPendingToSheet: () => void;
  isSyncing: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  sheetConfig,
  responses,
  onSyncPendingToSheet,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'responses' | 'sheets' | 'appsscript'>('responses');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const total = responses.length;
  const pendingSyncCount = responses.filter(r => !r.syncedToGoogleSheets).length;

  const targetSpreadsheetId = sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID;
  const targetSheetName = sheetConfig.sheetTabName || TARGET_SHEET_NAME;

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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Encuesta_F3_Buga_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appsScriptCode = `/**
 * Google Apps Script para la hoja ${targetSpreadsheetId}
 * Pestaña: "${targetSheetName}"
 */
function doPost(e) {
  try {
    var SPREADSHEET_ID = "${targetSpreadsheetId}";
    var ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch(err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    var sheetName = "${targetSheetName}";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Marca temporal",
        "Fecha de utilización del Ambiente F3",
        "¿Cuál es su relación con el Centro Agropecuario de Buga?",
        "¿Con qué frecuencia utiliza el Ambiente F3?",
        "¿Qué tan satisfecho está con el estado general de las instalaciones?",
        "¿Qué tan satisfecho está con el funcionamiento de los equipos?",
        "¿Qué tan satisfecho está con la iluminación y la ventilación?",
        "¿Qué tan satisfecho está con la comodidad y la distribución del espacio?",
        "¿Qué tan satisfecho está con la atención y el apoyo recibido?",
        "¿Considera que el Ambiente F3 cumple con sus necesidades?",
        "¿Qué sugerencias propone para mejorar el Ambiente F3?"
      ]);
      sheet.setFrozenRows(1);
    }

    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.fechaUso || "",
      data.relacionCentro || "",
      data.frecuenciaUso || "",
      data.estadoInstalaciones || "",
      data.equiposFuncionamiento || "",
      data.climatizacionVentilacion || "",
      data.comodidadEspacio || "",
      data.atencionSoporte || "",
      data.cumpleNecesidades || "",
      data.sugerenciasMejora || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Panel de Administración • Encuesta Sala F3</h2>
              <p className="text-xs text-slate-400">
                Gestión de respuestas y sincronización con Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Info Bar */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-950">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Hoja de Google Sheets: <strong className="font-mono text-emerald-900">{targetSpreadsheetId}</strong> (Página: <strong className="text-emerald-900">"{targetSheetName}"</strong>)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition"
            >
              Abrir Hoja de Google
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-4 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setActiveTab('responses')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'responses'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Respuestas ({total})
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Sincronización Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('appsscript')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'appsscript'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            Apps Script Webhook
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Tab 1: Responses */}
          {activeTab === 'responses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {total} respuesta(s) registrada(s) desde todos los dispositivos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronizadas en la nube en tiempo real.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {user && (
                    <button
                      onClick={onSyncPendingToSheet}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sincronizar a Google Sheets
                    </button>
                  )}
                  <button
                    onClick={handleDownloadCSV}
                    disabled={total === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar CSV
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Rol</th>
                        <th className="py-2.5 px-2 text-center">Instalaciones</th>
                        <th className="py-2.5 px-2 text-center">Equipos</th>
                        <th className="py-2.5 px-2 text-center">Clima</th>
                        <th className="py-2.5 px-2 text-center">Comodidad</th>
                        <th className="py-2.5 px-2 text-center">Atención</th>
                        <th className="py-2.5 px-3">¿Cumple?</th>
                        <th className="py-2.5 px-3">Sugerencias</th>
                        <th className="py-2.5 px-3 text-center">Sheets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {responses.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">{r.fechaUso}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.relacionCentro}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{r.estadoInstalaciones}★</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{r.equiposFuncionamiento}★</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{r.climatizacionVentilacion}★</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{r.comodidadEspacio}★</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{r.atencionSoporte}★</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.cumpleNecesidades}</td>
                          <td className="py-2.5 px-3 max-w-xs truncate">{r.sugerenciasMejora || 'Sin comentarios'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {r.syncedToGoogleSheets ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Enviado</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Sheets Sync */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {user ? `Sesión de Google iniciada: ${user.email}` : 'Acceso Google no conectado'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user 
                      ? 'Su sesión activa sincroniza automáticamente las respuestas hacia la hoja de cálculo.' 
                      : 'Inicie sesión con su cuenta de Google para sincronizar automáticamente hacia la hoja.'}
                  </p>
                </div>
                {user ? (
                  <button
                    onClick={onLogout}
                    className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión Google
                  </button>
                ) : (
                  <button
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    {isLoggingIn ? 'Conectando...' : 'Acceder con Google'}
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
                <div className="font-bold">Información de Destino:</div>
                <div>• ID de Hoja de Cálculo: <strong className="font-mono text-emerald-900">{targetSpreadsheetId}</strong></div>
                <div>• Pestaña objetivo: <strong className="text-emerald-900">"{targetSheetName}"</strong></div>
                <div>• Total de respuestas en espera de sincronización: <strong className="text-emerald-900">{pendingSyncCount}</strong></div>
              </div>
            </div>
          )}

          {/* Tab 3: Apps Script Webhook */}
          {activeTab === 'appsscript' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Código Google Apps Script</h4>
                  <p className="text-xs text-slate-500">
                    Si desea que cualquier dispositivo escriba directamente sin requerir inicio de sesión en Google, pegue este script en Extensiones &gt; Apps Script de su hoja.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                >
                  {copiedScript ? '¡Copiado!' : 'Copiar Script'}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 leading-relaxed">
                {appsScriptCode}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition shadow-xs"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};
