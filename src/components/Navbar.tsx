import React from 'react';
import { Lock } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  isAdminOpen
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-2xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Official SENA Institution Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#39A900] to-[#007A33] flex items-center justify-center shadow-md shadow-emerald-600/20 text-white font-black text-lg sm:text-xl tracking-tighter shrink-0">
              SENA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-lg">
                  Centro Agropecuario de Buga
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Sala F3
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Encuesta de Satisfacción y Calidad • Ambiente de Cómputo
              </p>
            </div>
          </div>

          {/* Discreet Admin Access for the survey owner */}
          <button
            onClick={onOpenAdmin}
            title="Panel de Administración y Sincronización"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
          >
            <Lock className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
