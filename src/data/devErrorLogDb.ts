import { openDatabaseAsync } from 'expo-sqlite';

import type { ErrorLogStore } from '../observability/types';
import { createErrorLogRepo } from './repositories/errorLogRepo';

// Banco separado do banco principal: se o principal falhar ao abrir (DAT-001),
// a Central ainda consegue guardar esse erro. Só é aberto em modo dev.
const DEV_ERROR_DB = 'prumo-dev-errors.db';

export async function openDevErrorLog(): Promise<ErrorLogStore> {
  return createErrorLogRepo(await openDatabaseAsync(DEV_ERROR_DB));
}
