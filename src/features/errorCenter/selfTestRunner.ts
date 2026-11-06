import { DEV_ERROR_DB_VERSION } from '../../data/repositories/errorLogRepo';
import { errorCenter, selfTest as defaultSelfTest, type ErrorCenter } from '../../observability';
import type { SelfTest, SelfTestData, SelfTestReport } from '../../observability/selfTest';
import type { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { defaultDevCenter } from './useDevCenter';

export type SelfTestState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; report: SelfTestReport }
  | { status: 'error'; message: string };

/** Rodada do autodiagnóstico vista pela tela: estado atual e aviso a cada mudança. */
export interface SelfTestRunner {
  state(): SelfTestState;
  /** Lê os dados do aparelho e roda as verificações. Nunca rejeita. */
  run(): Promise<void>;
  subscribe(listener: () => void): () => void;
  version(): number;
}

export interface SelfTestRunnerOptions {
  selfTest: SelfTest;
  loadData: () => Promise<SelfTestData>;
  center: ErrorCenter;
}

/** Junta os dados reais que as verificações precisam. */
export async function loadSelfTestData(
  transport: DevCenterTransport | undefined,
): Promise<SelfTestData> {
  const version = transport ? await transport.schemaVersion() : null;
  return {
    devErrorDb: version === null ? null : { version, expected: DEV_ERROR_DB_VERSION },
  };
}

export function createSelfTestRunner({
  selfTest,
  loadData,
  center,
}: SelfTestRunnerOptions): SelfTestRunner {
  let current: SelfTestState = { status: 'idle' };
  let inFlight: Promise<void> | undefined;
  let changes = 0;
  const listeners = new Set<() => void>();

  function set(next: SelfTestState): void {
    current = next;
    changes += 1;
    for (const listener of listeners) listener();
  }

  async function runOnce(): Promise<void> {
    set({ status: 'running' });
    let data: SelfTestData;
    try {
      data = await loadData();
    } catch (error) {
      center.reportError('DAT-001', error, { etapa: 'autodiagnóstico' });
      set({ status: 'error', message: 'Não foi possível ler os dados do aparelho.' });
      return;
    }
    set({ status: 'done', report: selfTest.run(data) });
  }

  return {
    state: () => current,
    run() {
      // Dois toques seguidos (ou toque durante a rodada da abertura) usam a mesma rodada.
      inFlight ??= runOnce().finally(() => {
        inFlight = undefined;
      });
      return inFlight;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version: () => changes,
  };
}

/** Rodada do app: autodiagnóstico padrão com os dados da Central de Erros. */
export const defaultSelfTestRunner = createSelfTestRunner({
  selfTest: defaultSelfTest,
  loadData: () => loadSelfTestData(defaultDevCenter()),
  center: errorCenter,
});
