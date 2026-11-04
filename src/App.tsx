import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { SurveyForm } from './components/SurveyForm';
import { ResponsesView } from './components/ResponsesView';
import { SheetsConfigModal } from './components/SheetsConfigModal';
import { HtmlExportModal } from './components/HtmlExportModal';
import { SurveyResponse, SheetConfig } from './types/survey';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/firebase';
import { 
  TARGET_SHEET_NAME, 
  appendRowToSheet, 
  responseToRow, 
  ensureEncuestaSheetExists, 
  fetchSheetResponses,
  sendViaAppsScript
} from './lib/sheetsService';

// Default initial responses seeded from the user's attachment:
// /public/assets/aistudio/Encuesta_de_satisfaccion_sobre_la_sala_f3__respuestas__579e085f
const INITIAL_SAMPLE_RESPONSES: SurveyResponse[] = [
  {
    id: 'res-sample-1',
    timestamp: '27/10/2026 19:23:50',
    fechaUso: '2026-10-27',
    relacionCentro: 'Visitante',
    frecuenciaUso: 'Primera vez',
    estadoInstalaciones: 3,
    equiposFuncionamiento: 2,
    climatizacionVentilacion: 4,
    comodidadEspacio: 4,
    atencionSoporte: 4,
    cumpleNecesidades: 'Sí, parcialmente',
    sugerenciasMejora: 'AIRE ACONDICIONADO, OTRAS SILLAS',
    syncedToGoogleSheets: true
  },
  {
    id: 'res-sample-2',
    timestamp: '27/10/2026 21:27:20',
    fechaUso: '2026-10-27',
    relacionCentro: 'Aprendiz',
    frecuenciaUso: 'Ocasionalmente',
    estadoInstalaciones: 2,
    equiposFuncionamiento: 2,
    climatizacionVentilacion: 3,
    comodidadEspacio: 3,
    atencionSoporte: 5,
    cumpleNecesidades: 'Sí, completamente',
    sugerenciasMejora: 'Mayor velocidad de internet y mantenimiento regular a los teclados',
    syncedToGoogleSheets: true
  }
];

const LOCAL_STORAGE_KEY_RESPONSES = 'sena_f3_survey_responses_v1';
const LOCAL_STORAGE_KEY_CONFIG = 'sena_f3_sheet_config_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'responses' | 'html-code' | 'config'>('form');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sheet configuration
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading config from localStorage', e);
    }
    return {
      spreadsheetId: '',
      sheetTabName: TARGET_SHEET_NAME,
      appsScriptWebhookUrl: '',
      autoSync: true
    };
  });

  // Survey responses
  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RESPONSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading responses from localStorage', e);
    }
    return INITIAL_SAMPLE_RESPONSES;
  });

  // Persist responses
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RESPONSES, JSON.stringify(responses));
    } catch (e) {
      console.warn('Error saving responses to localStorage', e);
    }
  }, [responses]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(sheetConfig));
    } catch (e) {
      console.warn('Error saving config to localStorage', e);
    }
  }, [sheetConfig]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleSaveConfig = (newConfig: SheetConfig) => {
    setSheetConfig(newConfig);
  };

  // Submit new survey response
  const handleSubmitResponse = async (
    data: Omit<SurveyResponse, 'id' | 'timestamp' | 'syncedToGoogleSheets'>
  ): Promise<boolean> => {
    setIsSubmitting(true);

    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO');

    const newResponse: SurveyResponse = {
      id: 'res-' + Date.now(),
      timestamp: formattedTimestamp,
      ...data,
      syncedToGoogleSheets: false
    };

    let synced = false;

    // 1. Try sending via Google Sheets API if logged in and spreadsheet configured
    try {
      const token = await getAccessToken();
      if (token && sheetConfig.spreadsheetId) {
        await ensureEncuestaSheetExists(token, sheetConfig.spreadsheetId, sheetConfig.sheetTabName || TARGET_SHEET_NAME);
        const row = responseToRow(newResponse);
        await appendRowToSheet(token, sheetConfig.spreadsheetId, sheetConfig.sheetTabName || TARGET_SHEET_NAME, row);
        synced = true;
      } else if (sheetConfig.appsScriptWebhookUrl) {
        // 2. Try Apps Script Webhook
        await sendViaAppsScript(sheetConfig.appsScriptWebhookUrl, newResponse);
        synced = true;
      }
    } catch (err) {
      console.error('Error synchronizing with Google Sheets:', err);
    } finally {
      setIsSubmitting(false);
    }

    newResponse.syncedToGoogleSheets = synced;

    setResponses((prev) => [newResponse, ...prev]);
    return true;
  };

  // Sync any pending un-synced responses to Google Sheets
  const handleSyncPending = async () => {
    if (!sheetConfig.spreadsheetId) {
      setActiveTab('config');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      await handleLogin();
      return;
    }

    setIsSyncing(true);
    try {
      await ensureEncuestaSheetExists(token, sheetConfig.spreadsheetId, sheetConfig.sheetTabName || TARGET_SHEET_NAME);

      const pending = responses.filter((r) => !r.syncedToGoogleSheets);
      for (const item of pending) {
        const row = responseToRow(item);
        await appendRowToSheet(token, sheetConfig.spreadsheetId, sheetConfig.sheetTabName || TARGET_SHEET_NAME, row);
      }

      setResponses((prev) =>
        prev.map((r) => ({ ...r, syncedToGoogleSheets: true }))
      );
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Hubo un inconveniente al sincronizar. Verifique permisos o el ID de la hoja.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Refresh data from Google Sheets
  const handleRefreshFromSheet = async () => {
    if (!sheetConfig.spreadsheetId) return;

    const token = await getAccessToken();
    if (!token) {
      await handleLogin();
      return;
    }

    setIsSyncing(true);
    try {
      const sheetRows = await fetchSheetResponses(
        token,
        sheetConfig.spreadsheetId,
        sheetConfig.sheetTabName || TARGET_SHEET_NAME
      );

      if (sheetRows && sheetRows.length > 0) {
        setResponses(sheetRows);
      }
    } catch (err) {
      console.error('Failed to load from sheet:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Navbar with SENA identity and Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sheetConfig={sheetConfig}
        responseCount={responses.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'form' && (
          <SurveyForm
            sheetConfig={sheetConfig}
            onSubmit={handleSubmitResponse}
            isSubmitting={isSubmitting}
            onOpenConfig={() => setActiveTab('config')}
          />
        )}

        {activeTab === 'responses' && (
          <ResponsesView
            responses={responses}
            sheetConfig={sheetConfig}
            onRefreshFromSheet={handleRefreshFromSheet}
            onSyncPendingToSheet={handleSyncPending}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'config' && (
          <SheetsConfigModal
            sheetConfig={sheetConfig}
            onSaveConfig={handleSaveConfig}
            user={user}
            onLogin={handleLogin}
          />
        )}

        {activeTab === 'html-code' && (
          <HtmlExportModal
            sheetConfig={sheetConfig}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
            <span>Servicio Nacional de Aprendizaje SENA • Centro Agropecuario de Buga</span>
          </div>
          <div>
            Ambiente F3 • Destino Google Sheets: <span className="font-semibold text-emerald-800">"{sheetConfig.sheetTabName}"</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
