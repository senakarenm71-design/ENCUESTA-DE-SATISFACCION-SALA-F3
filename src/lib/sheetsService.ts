import { SurveyResponse } from '../types/survey';

export const SURVEY_HEADERS = [
  'Marca temporal',
  'Fecha de utilización del Ambiente F3',
  '¿Cuál es su relación con el Centro Agropecuario de Buga?',
  '¿Con qué frecuencia utiliza el Ambiente F3?',
  '¿Qué tan satisfecho está con el estado general de las instalaciones y limpieza? (1-5)',
  '¿Qué tan satisfecho está con el funcionamiento y disponibilidad de los equipos? (1-5)',
  '¿Qué tan satisfecho está con la iluminación, ventilación y climatización? (1-5)',
  '¿Qué tan satisfecho está con la comodidad y distribución del espacio? (1-5)',
  '¿Qué tan satisfecho está con la atención y el apoyo recibido? (1-5)',
  '¿Considera que el Ambiente F3 cumple con sus necesidades?',
  '¿Qué sugerencias propone para mejorar el Ambiente F3?'
];

export const TARGET_SHEET_NAME = 'encuesta IA';
export const DEFAULT_SPREADSHEET_ID = '1IcmRuDYpZKNfDqn1BZkhjl4KfXox_C5QtiSOMf-P0kY';

/**
 * Convert a SurveyResponse object into a row array matching SURVEY_HEADERS
 */
export function responseToRow(r: SurveyResponse): (string | number)[] {
  return [
    r.timestamp,
    r.fechaUso,
    r.relacionCentro,
    r.frecuenciaUso,
    r.estadoInstalaciones,
    r.equiposFuncionamiento,
    r.climatizacionVentilacion,
    r.comodidadEspacio,
    r.atencionSoporte,
    r.cumpleNecesidades,
    r.sugerenciasMejora
  ];
}

/**
 * Creates a brand new Google Spreadsheet in the user's Drive with the sheet 'encuesta IA'
 */
export async function createSpreadsheet(accessToken: string, title = 'Encuesta Sala F3 - Centro Agropecuario Buga'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const body = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: TARGET_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al crear la hoja de cálculo en Google Sheets');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Insert header row
  await appendRowToSheet(accessToken, spreadsheetId, TARGET_SHEET_NAME, SURVEY_HEADERS);

  return {
    spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}

/**
 * Ensure sheet 'encuesta IA' exists in an existing spreadsheet; if not, create it with headers.
 */
export async function ensureEncuestaSheetExists(accessToken: string, spreadsheetId: string, sheetName = TARGET_SHEET_NAME): Promise<void> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'No se pudo acceder a la hoja de cálculo. Verifique el ID.');
  }

  const metaData = await metaRes.json();
  const existingSheets: { properties: { sheetId: number; title: string } }[] = metaData.sheets || [];
  const found = existingSheets.some(s => s.properties.title.trim().toLowerCase() === sheetName.trim().toLowerCase());

  if (!found) {
    // Add the sheet tab
    const addSheetBody = {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        }
      ]
    };

    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addSheetBody)
    });

    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al crear la pestaña "${sheetName}"`);
    }

    // Add headers to new sheet
    await appendRowToSheet(accessToken, spreadsheetId, sheetName, SURVEY_HEADERS);
  } else {
    // Check if headers exist
    const headerCheckRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:K1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (headerCheckRes.ok) {
      const headerData = await headerCheckRes.json();
      if (!headerData.values || headerData.values.length === 0 || headerData.values[0].length === 0) {
        await appendRowToSheet(accessToken, spreadsheetId, sheetName, SURVEY_HEADERS);
      }
    }
  }
}

/**
 * Append a row of data to the specified sheet
 */
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  row: (string | number)[]
): Promise<void> {
  const range = `'${sheetName}'!A:K`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al escribir en la hoja de cálculo (${res.status})`);
  }
}

/**
 * Fetch all rows from the survey sheet
 */
export async function fetchSheetResponses(
  accessToken: string,
  spreadsheetId: string,
  sheetName = TARGET_SHEET_NAME
): Promise<SurveyResponse[]> {
  const range = `'${sheetName}'!A2:K`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al obtener datos de Google Sheets');
  }

  const data = await res.json();
  const rows = (data.values || []) as string[][];

  return rows.map((row, index) => ({
    id: `sheet-${index + 1}`,
    timestamp: row[0] || '',
    fechaUso: row[1] || '',
    relacionCentro: row[2] || 'Aprendiz',
    frecuenciaUso: row[3] || 'Ocasionalmente',
    estadoInstalaciones: parseInt(row[4], 10) || 4,
    equiposFuncionamiento: parseInt(row[5], 10) || 4,
    climatizacionVentilacion: parseInt(row[6], 10) || 3,
    comodidadEspacio: parseInt(row[7], 10) || 4,
    atencionSoporte: parseInt(row[8], 10) || 4,
    cumpleNecesidades: row[9] || 'Sí, completamente',
    sugerenciasMejora: row[10] || '',
    syncedToGoogleSheets: true
  }));
}

/**
 * Send survey response via Google Apps Script Web App (Webhook fallback)
 */
export async function sendViaAppsScript(webhookUrl: string, response: SurveyResponse): Promise<void> {
  const payload = {
    sheetName: TARGET_SHEET_NAME,
    ...response,
    row: responseToRow(response)
  };

  await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}
