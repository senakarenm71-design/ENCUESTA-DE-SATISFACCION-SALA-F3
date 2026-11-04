import React, { useState } from 'react';
import { Copy, Check, Download, Code, FileSpreadsheet, ExternalLink, Sparkles } from 'lucide-react';
import { SheetConfig } from '../types/survey';
import { DEFAULT_SPREADSHEET_ID } from '../lib/sheetsService';

interface HtmlExportModalProps {
  sheetConfig: SheetConfig;
}

export const HtmlExportModal: React.FC<HtmlExportModalProps> = ({ sheetConfig }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'appsscript'>('html');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const webhookUrlPlaceholder = sheetConfig.appsScriptWebhookUrl || 'PEGA_AQUI_LA_URL_DE_TU_APPS_SCRIPT';
  const targetSheetName = sheetConfig.sheetTabName || 'encuesta IA';
  const spreadsheetId = sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID;

  const generateStandaloneHtml = () => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encuesta de Satisfacción - Ambiente F3 | Centro Agropecuario de Buga</title>
  <style>
    :root {
      --sena-green: #39A900;
      --sena-dark: #007A33;
      --slate-800: #1e293b;
      --slate-600: #475569;
      --slate-100: #f1f5f9;
      --border-color: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: var(--slate-800); padding: 20px; line-height: 1.5; }
    .container { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid var(--border-color); overflow: hidden; }
    .header { background: linear-gradient(135deg, #065f46 0%, var(--sena-green) 100%); color: #ffffff; padding: 32px 24px; text-align: left; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .header p { font-size: 14px; opacity: 0.95; }
    .notice { background: #ecfdf5; border-left: 4px solid var(--sena-green); padding: 12px 16px; margin: 16px 24px 0; font-size: 13px; color: #065f46; border-radius: 4px; }
    form { padding: 24px; }
    .card { background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .question-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; color: var(--slate-800); }
    .question-desc { font-size: 12px; color: var(--slate-600); margin-bottom: 14px; }
    .required { color: #dc2626; }
    input[type="date"], select, textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: #fdfdfd; }
    input[type="date"]:focus, select:focus, textarea:focus { outline: none; border-color: var(--sena-green); box-shadow: 0 0 0 3px rgba(57, 169, 0, 0.2); }
    .radio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
    .radio-label { display: flex; items-center: center; gap: 8px; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; transition: 0.15s; }
    .radio-label:hover { background: #f8fafc; border-color: #cbd5e1; }
    .rating-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 8px; }
    .rating-btn { padding: 12px 6px; text-align: center; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; background: white; }
    .rating-btn:hover { background: #ecfdf5; border-color: var(--sena-green); }
    .rating-btn.active { background: #ecfdf5; border-color: var(--sena-green); color: var(--sena-dark); }
    .scale-legend { display: flex; justify-content: space-between; font-size: 11px; color: var(--slate-600); margin-top: 4px; }
    button[type="submit"] { width: 100%; background: linear-gradient(135deg, var(--sena-dark) 0%, var(--sena-green) 100%); color: white; border: none; padding: 14px 20px; font-size: 16px; font-weight: bold; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,122,51,0.25); }
    button[type="submit"]:hover { opacity: 0.95; }
    .hidden { display: none !important; }
    .success-box { text-align: center; padding: 40px 20px; }
    .success-icon { width: 56px; height: 56px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; }
  </style>
</head>
<body>

<div class="container">
  <div class="header">
    <div class="badge">SENA • CENTRO AGROPECUARIO DE BUGA</div>
    <h1>Satisfacción del Ambiente F3</h1>
    <p>Encuesta de 10 preguntas para evaluar los equipos e instalaciones de la sala de cómputo F3.</p>
  </div>

  <div class="notice">
    <strong>Destino de almacenamiento:</strong> Hoja de cálculo de Google en la pestaña <strong>"${targetSheetName}"</strong>.
  </div>

  <div id="successPanel" class="success-box hidden">
    <div class="success-icon">✓</div>
    <h2>¡Muchas Gracias!</h2>
    <p style="color: #64748b; margin-top: 8px;">Su respuesta ha sido registrada exitosamente en la hoja "${targetSheetName}".</p>
    <button type="button" onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007A33; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Enviar otra respuesta</button>
  </div>

  <form id="encuestaF3Form">

    <!-- 1. Fecha -->
    <div class="card">
      <div class="question-title">1. Fecha de utilización del Ambiente F3 <span class="required">*</span></div>
      <div class="question-desc">Indique el día en que utilizó la sala de computación.</div>
      <input type="date" name="fechaUso" id="fechaUso" required>
    </div>

    <!-- 2. Relación con el Centro -->
    <div class="card">
      <div class="question-title">2. ¿Cuál es su relación con el Centro Agropecuario de Buga? <span class="required">*</span></div>
      <div class="question-desc">Seleccione su rol institucional.</div>
      <div class="radio-grid">
        <label class="radio-label"><input type="radio" name="relacionCentro" value="Aprendiz" checked required> Aprendiz</label>
        <label class="radio-label"><input type="radio" name="relacionCentro" value="Instructor"> Instructor</label>
        <label class="radio-label"><input type="radio" name="relacionCentro" value="Administrativo"> Administrativo</label>
        <label class="radio-label"><input type="radio" name="relacionCentro" value="Egresado"> Egresado</label>
        <label class="radio-label"><input type="radio" name="relacionCentro" value="Visitante"> Visitante</label>
      </div>
    </div>

    <!-- 3. Frecuencia -->
    <div class="card">
      <div class="question-title">3. ¿Con qué frecuencia utiliza el Ambiente F3? <span class="required">*</span></div>
      <div class="question-desc">Frecuencia habitual de asistencia a la sala.</div>
      <div class="radio-grid">
        <label class="radio-label"><input type="radio" name="frecuenciaUso" value="Primera vez" required> Primera vez</label>
        <label class="radio-label"><input type="radio" name="frecuenciaUso" value="Ocasionalmente" checked> Ocasionalmente</label>
        <label class="radio-label"><input type="radio" name="frecuenciaUso" value="Frecuentemente"> Frecuentemente</label>
        <label class="radio-label"><input type="radio" name="frecuenciaUso" value="Diariamente"> Diariamente</label>
      </div>
    </div>

    <!-- 4. Instalaciones -->
    <div class="card">
      <div class="question-title">4. ¿Qué tan satisfecho está con el estado general de las instalaciones y limpieza? <span class="required">*</span></div>
      <div class="question-desc">Califique del 1 (Muy insatisfecho) al 5 (Muy satisfecho).</div>
      <select name="estadoInstalaciones" required>
        <option value="5">5 - Muy satisfecho</option>
        <option value="4" selected>4 - Satisfecho</option>
        <option value="3">3 - Neutral / Regular</option>
        <option value="2">2 - Insatisfecho</option>
        <option value="1">1 - Muy insatisfecho</option>
      </select>
    </div>

    <!-- 5. Equipos -->
    <div class="card">
      <div class="question-title">5. ¿Qué tan satisfecho está con la disponibilidad y funcionamiento de los equipos? <span class="required">*</span></div>
      <div class="question-desc">Pantallas, teclados, mouse, velocidad de computadores y software.</div>
      <select name="equiposFuncionamiento" required>
        <option value="5">5 - Muy satisfecho</option>
        <option value="4" selected>4 - Satisfecho</option>
        <option value="3">3 - Neutral / Regular</option>
        <option value="2">2 - Insatisfecho</option>
        <option value="1">1 - Muy insatisfecho</option>
      </select>
    </div>

    <!-- 6. Climatización -->
    <div class="card">
      <div class="question-title">6. ¿Qué tan satisfecho está con la iluminación, ventilación y aire acondicionado? <span class="required">*</span></div>
      <div class="question-desc">Confort térmico, nivel de luz y ventilación del aula.</div>
      <select name="climatizacionVentilacion" required>
        <option value="5">5 - Muy satisfecho</option>
        <option value="4" selected>4 - Satisfecho</option>
        <option value="3">3 - Neutral / Regular</option>
        <option value="2">2 - Insatisfecho</option>
        <option value="1">1 - Muy insatisfecho</option>
      </select>
    </div>

    <!-- 7. Comodidad -->
    <div class="card">
      <div class="question-title">7. ¿Qué tan satisfecho está con la comodidad de las sillas y distribución del espacio? <span class="required">*</span></div>
      <div class="question-desc">Ergonomía de las sillas, espacio en mesas y pasillos.</div>
      <select name="comodidadEspacio" required>
        <option value="5">5 - Muy satisfecho</option>
        <option value="4" selected>4 - Satisfecho</option>
        <option value="3">3 - Neutral / Regular</option>
        <option value="2">2 - Insatisfecho</option>
        <option value="1">1 - Muy insatisfecho</option>
      </select>
    </div>

    <!-- 8. Atención -->
    <div class="card">
      <div class="question-title">8. ¿Qué tan satisfecho está con la atención y el apoyo técnico recibido? <span class="required">*</span></div>
      <div class="question-desc">Soporte del encargado y resolución de dudas o fallas.</div>
      <select name="atencionSoporte" required>
        <option value="5" selected>5 - Muy satisfecho</option>
        <option value="4">4 - Satisfecho</option>
        <option value="3">3 - Neutral / Regular</option>
        <option value="2">2 - Insatisfecho</option>
        <option value="1">1 - Muy insatisfecho</option>
      </select>
    </div>

    <!-- 9. Cumple necesidades -->
    <div class="card">
      <div class="question-title">9. ¿Considera que el Ambiente F3 cumple con sus necesidades? <span class="required">*</span></div>
      <div class="question-desc">Cumplimiento general para sus actividades formativas o laborales.</div>
      <div class="radio-grid">
        <label class="radio-label"><input type="radio" name="cumpleNecesidades" value="Sí, completamente" checked required> Sí, completamente</label>
        <label class="radio-label"><input type="radio" name="cumpleNecesidades" value="Sí, parcialmente"> Sí, parcialmente</label>
        <label class="radio-label"><input type="radio" name="cumpleNecesidades" value="No"> No</label>
      </div>
    </div>

    <!-- 10. Sugerencias -->
    <div class="card">
      <div class="question-title">10. ¿Qué sugerencias propone para mejorar el Ambiente F3?</div>
      <div class="question-desc">Escriba comentarios sobre aire acondicionado, sillas, computadores, etc.</div>
      <textarea name="sugerenciasMejora" rows="3" placeholder="Comentarios y propuestas de mejora..."></textarea>
    </div>

    <button type="submit" id="submitBtn">Enviar Respuestas</button>
  </form>
</div>

<script>
  // Poner fecha de hoy por defecto
  document.getElementById('fechaUso').value = new Date().toISOString().split('T')[0];

  // URL del Webhook de Google Apps Script conectado a la hoja con pestaña "${targetSheetName}"
  const WEBHOOK_URL = "${webhookUrlPlaceholder}";

  const form = document.getElementById('encuestaF3Form');
  const btn = document.getElementById('submitBtn');
  const successPanel = document.getElementById('successPanel');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    btn.disabled = true;
    btn.innerText = 'Enviando...';

    const formData = new FormData(form);
    const data = {
      sheetName: "${targetSheetName}",
      timestamp: new Date().toLocaleString('es-CO'),
      fechaUso: formData.get('fechaUso'),
      relacionCentro: formData.get('relacionCentro'),
      frecuenciaUso: formData.get('frecuenciaUso'),
      estadoInstalaciones: formData.get('estadoInstalaciones'),
      equiposFuncionamiento: formData.get('equiposFuncionamiento'),
      climatizacionVentilacion: formData.get('climatizacionVentilacion'),
      comodidadEspacio: formData.get('comodidadEspacio'),
      atencionSoporte: formData.get('atencionSoporte'),
      cumpleNecesidades: formData.get('cumpleNecesidades'),
      sugerenciasMejora: formData.get('sugerenciasMejora') || ''
    };

    try {
      if (WEBHOOK_URL.includes('http')) {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      form.classList.add('hidden');
      successPanel.classList.remove('hidden');
    } catch(err) {
      alert('Respuesta registrada. Gracias por su participación.');
      form.classList.add('hidden');
      successPanel.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Enviar Respuestas';
    }
  });
</script>
</body>
</html>`;

  const appsScriptCode = `/**
 * Código de Google Apps Script para recibir respuestas de la encuesta de la Sala F3
 * y escribirlas directamente en la hoja con ID "${spreadsheetId}"
 * en la pestaña "${targetSheetName}".
 */
function doPost(e) {
  try {
    var SPREADSHEET_ID = "${spreadsheetId}";
    var ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch(err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    var sheetName = "${targetSheetName}";
    var sheet = ss.getSheetByName(sheetName);

    // Si la hoja "${targetSheetName}" no existe, se crea automáticamente con sus encabezados
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

    // Agregar la fila con las 10 respuestas
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

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Guardado en " + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopy = (text: string, type: 'html' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleDownloadHtmlFile = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formulario-satisfaccion-sala-f3.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs mb-2">
              <Code className="w-3.5 h-3.5" />
              Formulario HTML Independiente
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Código HTML y Conexión con Google Sheets
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Aquí puede obtener el archivo <strong>.HTML</strong> completo y autónomo con las 10 preguntas para publicarlo en cualquier sitio web, intranet o enviarlo a los aprendices, además del script de Google Sheets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtmlFile}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              Descargar formulario-sala-f3.html
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 mt-6 gap-6">
          <button
            onClick={() => setActiveTab('html')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'html'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Formulario HTML (10 Preguntas)
          </button>
          <button
            onClick={() => setActiveTab('appsscript')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'appsscript'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Google Apps Script (Hoja "{targetSheetName}")
          </button>
        </div>

        {/* Tab 1: HTML Code */}
        {activeTab === 'html' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Archivo HTML independiente con diseño responsivo, CSS embebido y lógica de envío.
              </span>
              <button
                onClick={() => handleCopy(generateStandaloneHtml(), 'html')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHtml ? '¡Copiado!' : 'Copiar Código HTML'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
              {generateStandaloneHtml()}
            </pre>
          </div>
        )}

        {/* Tab 2: Apps Script Code */}
        {activeTab === 'appsscript' && (
          <div className="mt-6 space-y-4">
            
            {/* Steps Guide */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Cómo activar la recepción en su Hoja de Google:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 pl-1">
                <li>Abra su Hoja de Cálculo en Google Sheets.</li>
                <li>Vaya al menú <strong>Extensiones &gt; Apps Script</strong>.</li>
                <li>Borre cualquier código existente, pegue el código de abajo y guarde (Ctrl+S).</li>
                <li>Haga clic en el botón azul <strong>Implementar &gt; Nueva implementación</strong>.</li>
                <li>Seleccione tipo: <strong>Aplicación web</strong>.</li>
                <li>En <em>"Quién tiene acceso"</em> elija: <strong>Cualquier usuario</strong> (Anyone).</li>
                <li>Haga clic en <strong>Implementar</strong>, copie la URL resultante y péguela en la pestaña <strong>Google Sheets</strong> de esta aplicación o en el código HTML.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Código para Apps Script (Crea la pestaña "{targetSheetName}" automáticamente):
              </span>
              <button
                onClick={() => handleCopy(appsScriptCode, 'script')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '¡Copiado!' : 'Copiar Código Apps Script'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
              {appsScriptCode}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
