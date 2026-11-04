import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, CheckCircle2, AlertCircle, LogOut, Code, BarChart3, FormInput, ExternalLink } from 'lucide-react';
import { SheetConfig } from '../types/survey';

interface NavbarProps {
  activeTab: 'form' | 'responses' | 'html-code' | 'config';
  setActiveTab: (tab: 'form' | 'responses' | 'html-code' | 'config') => void;
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  sheetConfig: SheetConfig;
  responseCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  sheetConfig,
  responseCount
}) => {
  const isSheetConnected = Boolean(sheetConfig.spreadsheetId || sheetConfig.appsScriptWebhookUrl);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Institution Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#39A900] to-[#007A33] flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xl tracking-tighter">
              SENA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Centro Agropecuario de Buga
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Sala F3
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 hidden sm:flex">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Nube en tiempo real
                </span>
                <span>•</span>
                <span>Hoja destino: <strong className="text-emerald-800">"encuesta IA"</strong></span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/90 rounded-xl">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'form'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FormInput className="w-4 h-4" />
              Formulario
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'responses'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Respuestas
              {responseCount > 0 && (
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {responseCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'config'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets
              {isSheetConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('html-code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'html-code'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-4 h-4" />
              Código HTML
            </button>
          </nav>

          {/* Right Action / Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Google Conectado</span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-8 h-8 rounded-full border border-emerald-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isLoggingIn ? 'Conectando...' : 'Acceder con Google'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
              activeTab === 'form' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Formulario
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
              activeTab === 'responses' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Respuestas ({responseCount})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
              activeTab === 'config' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Google Sheets {isSheetConnected ? '✓' : '!'}
          </button>
          <button
            onClick={() => setActiveTab('html-code')}
            className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
              activeTab === 'html-code' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Código HTML
          </button>
        </div>

      </div>
    </header>
  );
};
