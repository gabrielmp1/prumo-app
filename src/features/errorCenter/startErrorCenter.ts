import { openDevErrorLog } from '../../data/devErrorLogDb';
import { errorCenter, type ErrorCenter } from '../../observability';
import {
  defaultGlobalHandlerEnv,
  installGlobalHandlers,
  type GlobalHandlerEnv,
} from '../../observability/globalHandlers';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import type { ErrorLogStore } from '../../observability/types';

export interface StartErrorCenterOptions {
  center?: ErrorCenter;
  env?: GlobalHandlerEnv;
  openStore?: () => Promise<ErrorLogStore>;
}

/**
 * Chamado uma vez na abertura do app: instala as capturas globais e, em dev, liga a Central
 * ao banco e carrega os erros de aberturas anteriores. Nunca rejeita: falha vira DAT-001.
 */
export async function startErrorCenter({
  center = errorCenter,
  env = defaultGlobalHandlerEnv(),
  openStore = openDevErrorLog,
}: StartErrorCenterOptions = {}): Promise<void> {
  // No Jest, as capturas globais são do próprio Jest; não mexemos nelas.
  if (center.mode !== 'test') installGlobalHandlers(center, env);

  const devCenter = center.transports.find((t) => t instanceof DevCenterTransport);
  if (!devCenter) return;
  try {
    devCenter.attachStore(await openStore());
    await devCenter.load();
  } catch (error) {
    center.reportFatal('DAT-001', error, { banco: 'prumo-dev-errors.db' });
  }
}
