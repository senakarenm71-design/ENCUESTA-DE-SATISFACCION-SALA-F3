import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer,
  getDocs
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SurveyResponse } from '../types/survey';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check network/config.');
    }
    return false;
  }
}

const COLLECTION_PATH = 'survey_responses';

/**
 * Subscribe to all survey responses in real-time.
 * Every device will automatically receive new responses without page refresh.
 */
export function subscribeToSurveyResponses(
  onData: (responses: SurveyResponse[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, COLLECTION_PATH);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const results: SurveyResponse[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        results.push({
          id: d.id,
          timestamp: data.timestamp || '',
          fechaUso: data.fechaUso || '',
          relacionCentro: data.relacionCentro || 'Aprendiz',
          frecuenciaUso: data.frecuenciaUso || 'Ocasionalmente',
          estadoInstalaciones: Number(data.estadoInstalaciones) || 4,
          equiposFuncionamiento: Number(data.equiposFuncionamiento) || 4,
          climatizacionVentilacion: Number(data.climatizacionVentilacion) || 4,
          comodidadEspacio: Number(data.comodidadEspacio) || 4,
          atencionSoporte: Number(data.atencionSoporte) || 5,
          cumpleNecesidades: data.cumpleNecesidades || 'Sí, completamente',
          sugerenciasMejora: data.sugerenciasMejora || '',
          syncedToGoogleSheets: Boolean(data.syncedToGoogleSheets)
        });
      });

      // Sort newest first
      results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onData(results);
    },
    (error) => {
      console.warn('Firestore subscription notice:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new survey response to Firestore.
 * Anyone on any device can write to this collection.
 */
export async function saveResponseToFirestore(response: SurveyResponse): Promise<void> {
  const docRef = doc(db, COLLECTION_PATH, response.id);
  try {
    await setDoc(docRef, {
      ...response,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_PATH}/${response.id}`);
  }
}

/**
 * Update the Google Sheets sync status of a response in Firestore.
 */
export async function updateResponseSyncStatus(responseId: string, synced: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_PATH, responseId);
  try {
    await updateDoc(docRef, {
      syncedToGoogleSheets: synced,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_PATH}/${responseId}`);
  }
}
