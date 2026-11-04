export interface SurveyResponse {
  id: string;
  timestamp: string;
  // Question 1
  fechaUso: string;
  // Question 2
  relacionCentro: 'Aprendiz' | 'Instructor' | 'Administrativo' | 'Egresado' | 'Visitante' | string;
  // Question 3
  frecuenciaUso: 'Primera vez' | 'Ocasionalmente' | 'Frecuentemente' | 'Diariamente' | string;
  // Question 4 (1-5)
  estadoInstalaciones: number;
  // Question 5 (1-5)
  equiposFuncionamiento: number;
  // Question 6 (1-5)
  climatizacionVentilacion: number;
  // Question 7 (1-5)
  comodidadEspacio: number;
  // Question 8 (1-5)
  atencionSoporte: number;
  // Question 9
  cumpleNecesidades: 'Sí, completamente' | 'Sí, parcialmente' | 'No' | string;
  // Question 10
  sugerenciasMejora: string;
  // Sync status
  syncedToGoogleSheets?: boolean;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetName?: string;
  sheetTabName: string; // "encuesta IA"
  appsScriptWebhookUrl?: string;
  autoSync: boolean;
}
