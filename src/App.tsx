import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { SurveyForm } from './components/SurveyForm';
import { AdminModal } from './components/AdminModal';
import { SurveyResponse, SheetConfig } from './types/survey';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/firebase';
import { 
  TARGET_SHEET_NAME, 
  DEFAULT_SPREADSHEET_ID,
  appendRowToSheet, 
  responseToRow, 
  ensureEncuestaSheetExists, 
  fetchSheetResponses,
  sendViaAppsScript
} from './lib/sheetsService';
import { 
  subscribeToSurveyResponses, 
  saveResponseToFirestore, 
  updateResponseSyncStatus,
  testFirestoreConnection
} from './lib/firestoreService';

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check URL param ?admin=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
        setIsAdminOpen(true);
      }
    }
  }, []);

  // Sheet configuration: permanently bound to 1IcmRuDYpZKNfDqn1BZkhjl4KfXox_C5QtiSOMf-P0kY and tab 'encuesta IA'
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          spreadsheetId: DEFAULT_SPREADSHEET_ID,
          sheetTabName: TARGET_SHEET_NAME
        };
      }
    } catch (e) {
      console.warn('Error reading config from localStorage', e);
    }
    return {
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      sheetTabName: TARGET_SHEET_NAME,
      appsScriptWebhookUrl: '',
      autoSync: true
    };
  });

  // Survey responses (synced in real-time via Firestore across all devices)
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

  // Real-time Firestore listener: updates all devices immediately without page refresh
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeFirestore = subscribeToSurveyResponses((remoteResponses) => {
      if (remoteResponses && remoteResponses.length > 0) {
        setResponses(remoteResponses);
      }
    });

    return () => unsubscribeFirestore();
  }, []);

  // Persist responses to localStorage as offline cache
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

  // Automatic Background Sync to Google Sheets when user is logged in
  useEffect(() => {
    if (!user) return;

    const pending = responses.filter((r) => !r.syncedToGoogleSheets);
    if (pending.length === 0) return;

    const runAutoSync = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const targetId = DEFAULT_SPREADSHEET_ID;
      const targetTab = TARGET_SHEET_NAME;

      try {
        await ensureEncuestaSheetExists(token, targetId, targetTab);
        for (const item of pending) {
          const row = responseToRow(item);
          await appendRowToSheet(token, targetId, targetTab, row);
          await updateResponseSyncStatus(item.id, true);
        }
      } catch (err) {
        console.warn('Background auto-sync notice:', err);
      }
    };

    runAutoSync();
  }, [user, responses]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          try {
            await ensureEncuestaSheetExists(token, DEFAULT_SPREADSHEET_ID, TARGET_SHEET_NAME);
          } catch (err) {
            console.warn('Auto-sync on login note:', err);
          }
        }
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
    const targetSpreadsheetId = DEFAULT_SPREADSHEET_ID;
    const targetTab = TARGET_SHEET_NAME;

    // 1. Immediately persist to Firestore so ALL other devices see it in real time
    try {
      await saveResponseToFirestore(newResponse);
    } catch (fsErr) {
      console.warn('Firestore save warning:', fsErr);
    }

    // 2. Try sending directly to Google Sheets if user is authenticated or Apps Script is configured
    try {
      const token = await getAccessToken();
      if (token && targetSpreadsheetId) {
        await ensureEncuestaSheetExists(token, targetSpreadsheetId, targetTab);
        const row = responseToRow(newResponse);
        await appendRowToSheet(token, targetSpreadsheetId, targetTab, row);
        synced = true;
        await updateResponseSyncStatus(newResponse.id, true).catch(() => {});
      } else if (sheetConfig.appsScriptWebhookUrl) {
        await sendViaAppsScript(sheetConfig.appsScriptWebhookUrl, newResponse);
        synced = true;
      }
    } catch (err) {
      console.error('Error synchronizing with Google Sheets:', err);
    } finally {
      setIsSubmitting(false);
    }

    newResponse.syncedToGoogleSheets = synced;

    // Optimistically update local state if not already pushed by Firestore listener
    setResponses((prev) => {
      const exists = prev.some((r) => r.id === newResponse.id);
      return exists ? prev : [newResponse, ...prev];
    });

    return true;
  };

  // Manual trigger for syncing pending responses from admin panel
  const handleSyncPending = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleLogin();
      return;
    }

    setIsSyncing(true);
    try {
      await ensureEncuestaSheetExists(token, DEFAULT_SPREADSHEET_ID, TARGET_SHEET_NAME);

      const pending = responses.filter((r) => !r.syncedToGoogleSheets);
      for (const item of pending) {
        const row = responseToRow(item);
        await appendRowToSheet(token, DEFAULT_SPREADSHEET_ID, TARGET_SHEET_NAME, row);
        await updateResponseSyncStatus(item.id, true);
      }

      setResponses((prev) =>
        prev.map((r) => ({ ...r, syncedToGoogleSheets: true }))
      );
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Hubo un inconveniente al sincronizar. Verifique permisos.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Clean Institutional Header - No Tabs, No Clutter */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminOpen={isAdminOpen}
      />

      {/* Main Content Area: ONLY THE SURVEY FORM FOR RESPONDENTS */}
      <main className="flex-1 pb-16">
        <SurveyForm
          sheetConfig={sheetConfig}
          onSubmit={handleSubmitResponse}
          isSubmitting={isSubmitting}
        />
      </main>

      {/* Admin Panel Modal (Protected / Hidden from normal respondents) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sheetConfig={sheetConfig}
        responses={responses}
        onSyncPendingToSheet={handleSyncPending}
        isSyncing={isSyncing}
      />

      {/* Discreet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
            <span>Servicio Nacional de Aprendizaje SENA • Centro Agropecuario de Buga</span>
          </div>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="text-[11px] text-slate-400 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Acceso Administrativo</span>
            <span>🔒</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
