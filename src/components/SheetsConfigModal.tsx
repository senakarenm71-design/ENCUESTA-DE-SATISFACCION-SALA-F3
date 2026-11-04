import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  PlusCircle, 
  Key, 
  HelpCircle, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { SheetConfig } from '../types/survey';
import { TARGET_SHEET_NAME, DEFAULT_SPREADSHEET_ID, createSpreadsheet, ensureEncuestaSheetExists } from '../lib/sheetsService';
import { getAccessToken } from '../lib/firebase';

interface SheetsConfigModalProps {
  sheetConfig: SheetConfig;
  onSaveConfig: (newConfig: SheetConfig) => void;
  user: User | null;
  onLogin: () => void;
}

export const SheetsConfigModal: React.FC<SheetsConfigModalProps> = ({
  sheetConfig,
  onSaveConfig,
  user,
  onLogin
}) => {
  const [spreadsheetInput, setSpreadsheetInput] = useState(sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID);
  const [sheetTabName, setSheetTabName] = useState(sheetConfig.sheetTabName || TARGET_SHEET_NAME);
  const [appsScriptUrl, setAppsScriptUrl] = useState(sheetConfig.appsScriptWebhookUrl || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract ID from full URL if pasted
  const parseSpreadsheetId = (input: string) => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : trimmed;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanId = parseSpreadsheetId(spreadsheetInput);

    if (cleanId && user) {
      try {
        const token = await getAccessToken();
        if (token) {
          await ensureEncuestaSheetExists(token, cleanId, sheetTabName || TARGET_SHEET_NAME);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al verificar la hoja de cálculo';
        setStatusMsg({ type: 'error', text: msg });
        return;
      }
    }

    onSaveConfig({
      spreadsheetId: cleanId,
      sheetTabName: sheetTabName || TARGET_SHEET_NAME,
      appsScriptWebhookUrl: appsScriptUrl.trim(),
      autoSync: true
    });

    setStatusMsg({
      type: 'success',
      text: `Configuración guardada. Las respuestas se escribirán en la pestaña "${sheetTabName || TARGET_SHEET_NAME}".`
    });
  };

  const handleCreateAutoSheet = async () => {
    if (!user) {
      onLogin();
      return;
    }

    setIsCreatingNew(true);
    setStatusMsg(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Inicie sesión con Google para crear la hoja en su Drive.');
      }

      const res = await createSpreadsheet(token, 'Encuesta Satisfacción F3 - Centro Agropecuario Buga');
      setSpreadsheetInput(res.spreadsheetId);
      setSheetTabName(TARGET_SHEET_NAME);

      onSaveConfig({
        spreadsheetId: res.spreadsheetId,
        sheetTabName: TARGET_SHEET_NAME,
        appsScriptWebhookUrl: appsScriptUrl.trim(),
        autoSync: true
      });

      setStatusMsg({
        type: 'success',
        text: `¡Hoja creada con éxito en su Google Drive con la pestaña "${TARGET_SHEET_NAME}"!`
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la hoja en Google Drive';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsCreatingNew(false);
    }
  };

  const currentId = parseSpreadsheetId(spreadsheetInput);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Conexión a Google Sheets</h2>
              <p className="text-xs text-slate-400">
                Configuración del destino para las respuestas de la Sala F3
              </p>
            </div>
          </div>
          {currentId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${currentId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              Abrir Hoja
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>{statusMsg.text}</div>
            </div>
          )}

          {/* Account status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {user ? `Conectado como: ${user.email}` : 'Cuenta de Google no iniciada'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {user ? 'Permisos de lectura y escritura en Google Sheets habilitados.' : 'Inicie sesión para crear o vincular hojas en su Drive.'}
                </div>
              </div>
            </div>
            {!user && (
              <button
                type="button"
                onClick={onLogin}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
              >
                Conectar cuenta Google
              </button>
            )}
          </div>

          {/* Official Default Sheet Card */}
          <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-700 text-white uppercase tracking-wider mb-1.5">
                  ✓ Hoja Oficial Predeterminada
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  ID: <span className="font-mono text-emerald-900 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 select-all">{DEFAULT_SPREADSHEET_ID}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Página configurada: <strong className="text-emerald-800">"encuesta IA"</strong>. Todas las respuestas de cualquier equipo se envían directamente a esta hoja.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Abrir Hoja
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSpreadsheetInput(DEFAULT_SPREADSHEET_ID);
                    setSheetTabName(TARGET_SHEET_NAME);
                  }}
                  className="shrink-0 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  Restablecer
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label htmlFor="spreadsheetInput" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                ID o URL de la Hoja de Cálculo de Google
              </label>
              <input
                id="spreadsheetInput"
                type="text"
                placeholder="Pegue el enlace o ID de su hoja de cálculo (ej: 1BxiMVs0XRA5nFMdKvBII8...)"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Puede copiar y pegar directamente la URL completa de su hoja abierta en el navegador.
              </p>
            </div>

            <div>
              <label htmlFor="sheetTabName" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Nombre de la pestaña (Página)
              </label>
              <input
                id="sheetTabName"
                type="text"
                required
                value={sheetTabName}
                onChange={(e) => setSheetTabName(e.target.value)}
                placeholder="encuesta IA"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Por requerimiento de su solicitud, el nombre predeterminado es <strong>"encuesta IA"</strong>. Si no existe en su hoja, el sistema la creará automáticamente.
              </p>
            </div>

            <div>
              <label htmlFor="appsScriptUrl" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                (Opcional) URL Webhook de Google Apps Script
              </label>
              <input
                id="appsScriptUrl"
                type="url"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Permite que cualquier aprendiz o visitante envíe la encuesta anónimamente sin necesidad de iniciar sesión. Vea la pestaña "Código HTML" para obtener el script de Apps Script.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition"
              >
                Guardar y Verificar Conexión
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
