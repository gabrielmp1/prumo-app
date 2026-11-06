import { openDevErrorLog } from '../../data/devErrorLogDb';
import { errorCenter, type ErrorCenter } from '../../observability';
import {
  defaultGlobalHandlerEnv,
  installGlobalHandlers,
  type GlobalHandlerEnv,
} from '../../observability/globalHandlers';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import type { ErrorLogStore } from '../../observability/types';
import { defaultSelfTestRunner } from './selfTestRunner';

export interface StartErrorCenterOptions {
  center?: ErrorCenter;
  env?: GlobalHandlerEnv;
  openStore?: () => Promise<ErrorLogStore>;
  selfTestRunner?: { run(): Promise<void> };
}

/**
 * Chamado uma vez na abertura do app: instala as capturas globais e, em dev, liga a Central
 * ao banco, carrega os erros de aberturas anteriores e roda o autodiagnóstico (P0-S0-08).
 * Nunca rejeita: falha do banco vira DAT-001.
 */
export async function startErrorCenter({
  center = errorCenter,
  env = defaultGlobalHandlerEnv(),
  openStore = openDevErrorLog,
  selfTestRunner = defaultSelfTestRunner,
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
  // Em segundo plano: quem chama não espera (useErrorCenter usa `void`). Problemas vão para a Central.
  await selfTestRunner.run();
}
