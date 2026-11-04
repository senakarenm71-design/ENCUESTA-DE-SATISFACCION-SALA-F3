import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  Send, 
  RotateCcw, 
  Calendar, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Monitor, 
  Wind, 
  Armchair, 
  HelpCircle, 
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { SurveyResponse, SheetConfig } from '../types/survey';

interface SurveyFormProps {
  sheetConfig: SheetConfig;
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'timestamp' | 'syncedToGoogleSheets'>) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenConfig?: () => void;
}

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Muy insatisfecho', color: 'text-red-600 bg-red-50 border-red-200' },
  2: { label: 'Insatisfecho', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  3: { label: 'Neutral / Regular', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  4: { label: 'Satisfecho', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  5: { label: 'Muy satisfecho', color: 'text-green-700 bg-green-50 border-green-300' }
};

export const SurveyForm: React.FC<SurveyFormProps> = ({
  sheetConfig,
  onSubmit,
  isSubmitting
}) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  const [fechaUso, setFechaUso] = useState(getToday());
  const [relacionCentro, setRelacionCentro] = useState('Aprendiz');
  const [frecuenciaUso, setFrecuenciaUso] = useState('Ocasionalmente');
  const [estadoInstalaciones, setEstadoInstalaciones] = useState<number>(4);
  const [equiposFuncionamiento, setEquiposFuncionamiento] = useState<number>(4);
  const [climatizacionVentilacion, setClimatizacionVentilacion] = useState<number>(4);
  const [comodidadEspacio, setComodidadEspacio] = useState<number>(4);
  const [atencionSoporte, setAtencionSoporte] = useState<number>(5);
  const [cumpleNecesidades, setCumpleNecesidades] = useState<'Sí, completamente' | 'Sí, parcialmente' | 'No'>('Sí, completamente');
  const [sugerenciasMejora, setSugerenciasMejora] = useState('');
  
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFechaUso(getToday());
    setRelacionCentro('Aprendiz');
    setFrecuenciaUso('Ocasionalmente');
    setEstadoInstalaciones(4);
    setEquiposFuncionamiento(4);
    setClimatizacionVentilacion(4);
    setComodidadEspacio(4);
    setAtencionSoporte(5);
    setCumpleNecesidades('Sí, completamente');
    setSugerenciasMejora('');
    setSubmittedSuccessfully(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const success = await onSubmit({
        fechaUso,
        relacionCentro,
        frecuenciaUso,
        estadoInstalaciones,
        equiposFuncionamiento,
        climatizacionVentilacion,
        comodidadEspacio,
        atencionSoporte,
        cumpleNecesidades,
        sugerenciasMejora: sugerenciasMejora.trim()
      });

      if (success) {
        setSubmittedSuccessfully(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar la encuesta';
      setErrorMessage(message);
    }
  };

  const renderRatingScale = (
    value: number,
    onChange: (val: number) => void,
    name: string
  ) => {
    return (
      <div className="space-y-2 mt-2">
        <div className="grid grid-cols-5 gap-2 max-w-md">
          {[1, 2, 3, 4, 5].map((num) => {
            const isSelected = value === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={`py-3 px-2 rounded-xl text-center font-bold text-sm sm:text-base border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>{num}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {num === 1 ? 'Malo' : num === 5 ? 'Excelente' : ''}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Seleccionado:</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${RATING_LABELS[value].color}`}>
            {value} / 5 - {RATING_LABELS[value].label}
          </span>
        </div>
      </div>
    );
  };

  if (submittedSuccessfully) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-emerald-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">¡Respuesta Registrada con Éxito!</h2>
        <p className="text-slate-600 mb-6 max-w-lg mx-auto text-sm sm:text-base">
          Agradecemos su tiempo para evaluar la <strong>Sala de Computación F3</strong> del Centro Agropecuario de Buga. Su opinión permite mejorar continuamente la calidad de nuestros ambientes de aprendizaje.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={resetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md shadow-emerald-700/20 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Enviar otra respuesta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#39A900] text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Monitor className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Encuesta de Calidad • SENA CAB
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Satisfacción del Ambiente F3
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl">
            Centro Agropecuario de Buga. Por favor, califique los siguientes 10 aspectos sobre las instalaciones y equipos de cómputo para orientar los planes de mantenimiento y mejora continua.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <div className="font-bold">Error al enviar la respuesta</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* The 10 Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Question 1: Fecha de utilización */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="flex-1">
              <label htmlFor="fechaUso" className="block text-sm sm:text-base font-bold text-slate-800">
                Fecha de utilización del Ambiente F3 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">Indique la fecha en la que utilizó la sala de computación.</p>
              <div className="relative max-w-xs">
                <input
                  id="fechaUso"
                  type="date"
                  required
                  value={fechaUso}
                  onChange={(e) => setFechaUso(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-800 font-medium bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question 2: Relación con el Centro */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Cuál es su relación con el Centro Agropecuario de Buga? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">Seleccione el rol con el que accede a la institución.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {['Aprendiz', 'Instructor', 'Administrativo', 'Egresado', 'Visitante'].map((rol) => {
                  const isChecked = relacionCentro === rol;
                  return (
                    <label
                      key={rol}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs sm:text-sm font-medium ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="relacionCentro"
                        value={rol}
                        checked={isChecked}
                        onChange={() => setRelacionCentro(rol)}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{rol}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Question 3: Frecuencia de uso */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Con qué frecuencia utiliza el Ambiente F3? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">Periodicidad con la que asiste a esta sala de cómputo.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Primera vez', 'Ocasionalmente', 'Frecuentemente', 'Diariamente'].map((freq) => {
                  const isChecked = frecuenciaUso === freq;
                  return (
                    <label
                      key={freq}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs sm:text-sm font-medium ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="frecuenciaUso"
                        value={freq}
                        checked={isChecked}
                        onChange={() => setFrecuenciaUso(freq)}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{freq}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Question 4: Estado general y orden */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué tan satisfecho está con el estado general de las instalaciones, limpieza y orden? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Pisos, paredes, tableros y aseo del ambiente.</p>
              {renderRatingScale(estadoInstalaciones, setEstadoInstalaciones, 'estadoInstalaciones')}
            </div>
          </div>
        </div>

        {/* Question 5: Equipos de cómputo y periféricos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué tan satisfecho está con la disponibilidad y funcionamiento de los equipos de cómputo? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Velocidad, encendido, mouse, teclado, pantallas y programas instalados.</p>
              {renderRatingScale(equiposFuncionamiento, setEquiposFuncionamiento, 'equiposFuncionamiento')}
            </div>
          </div>
        </div>

        {/* Question 6: Iluminación, ventilación y aire acondicionado */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              6
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué tan satisfecho está con la iluminación, ventilación y climatización (aire acondicionado)? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Temperatura del aula, confort térmico y nivel de luz para trabajar.</p>
              {renderRatingScale(climatizacionVentilacion, setClimatizacionVentilacion, 'climatizacionVentilacion')}
            </div>
          </div>
        </div>

        {/* Question 7: Comodidad y distribución del espacio */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              7
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué tan satisfecho está con la comodidad de las sillas, mesas y distribución del espacio? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Ergonomía de las sillas, espacio entre puestos y pasillos de circulación.</p>
              {renderRatingScale(comodidadEspacio, setComodidadEspacio, 'comodidadEspacio')}
            </div>
          </div>
        </div>

        {/* Question 8: Atención y apoyo técnico recibido */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              8
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué tan satisfecho está con la atención y el apoyo técnico recibido en el ambiente? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Disposición, soporte del encargado de sala y resolución de inconvenientes.</p>
              {renderRatingScale(atencionSoporte, setAtencionSoporte, 'atencionSoporte')}
            </div>
          </div>
        </div>

        {/* Question 9: ¿Cumple con sus necesidades? */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              9
            </span>
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Considera que el Ambiente F3 cumple con sus necesidades de formación o trabajo? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">Valoración global sobre la utilidad del ambiente para sus actividades.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {['Sí, completamente', 'Sí, parcialmente', 'No'].map((opc) => {
                  const isChecked = cumpleNecesidades === opc;
                  return (
                    <label
                      key={opc}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition text-xs sm:text-sm font-medium ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cumpleNecesidades"
                        value={opc}
                        checked={isChecked}
                        onChange={() => setCumpleNecesidades(opc as any)}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{opc}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Question 10: Sugerencias y aspectos a mejorar */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              10
            </span>
            <div className="flex-1">
              <label htmlFor="sugerenciasMejora" className="block text-sm sm:text-base font-bold text-slate-800">
                ¿Qué sugerencias propone o qué aspectos considera que se deben mejorar en el Ambiente F3?
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Comentarios sobre aire acondicionado, sillas, mantenimiento de computadores, internet, software, etc.
              </p>
              <textarea
                id="sugerenciasMejora"
                rows={4}
                value={sugerenciasMejora}
                onChange={(e) => setSugerenciasMejora(e.target.value)}
                placeholder="Escriba aquí sus comentarios y propuestas..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-800 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Formulario completo de 10 preguntas listo para enviar.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-[#39A900] hover:from-emerald-800 hover:to-emerald-700 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-700/25 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Enviando respuestas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Respuestas</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
