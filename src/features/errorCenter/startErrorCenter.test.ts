/**
 * @jest-environment node
 */
import { createErrorLogRepo } from '../../data/repositories/errorLogRepo';
import { createErrorCenter } from '../../observability/center';
import type { GlobalHandlerEnv } from '../../observability/globalHandlers';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { TestTransport } from '../../observability/transports/testTransport';
import { openMemoryDatabase } from '../../../test/tools/nodeSqlite';
import { startErrorCenter } from './startErrorCenter';

function envFalso(): GlobalHandlerEnv & { instalado: () => boolean } {
  let instalado = false;
  const original = () => undefined;
  return {
    errorUtils: {
      getGlobalHandler: () => original,
      setGlobalHandler: () => {
        instalado = true;
      },
    },
    instalado: () => instalado,
  };
}

// P0-S0-06 · ao abrir o app (dev): capturas globais + banco da Central + erros anteriores carregados.
describe('P0-S0-06 · inicialização da Central de Erros', () => {
  it('em dev: instala as capturas, abre o banco e carrega os erros anteriores', async () => {
    const db = openMemoryDatabase();
    const antigo = await createErrorLogRepo(db);
    await antigo.record({
      id: 'x',
      code: 'NTF-001',
      severity: 'error',
      message: 'Falha ao agendar',
      module: 'notifications',
      breadcrumbs: [],
      appVersion: '0.0.1',
      occurredAt: '2026-11-05T10:00:00.000Z',
      fingerprint: 'NTF-001|falha ao agendar',
    });

    const central = new DevCenterTransport();
    const center = createErrorCenter({ mode: 'dev', transports: [central] });
    const env = envFalso();
    await startErrorCenter({ center, env, openStore: () => createErrorLogRepo(db) });

    expect(env.instalado()).toBe(true);
    expect(central.groups().map((g) => g.code)).toEqual(['NTF-001']);
  });

  it('se o banco não abrir: reporta DAT-001 e o app segue com a Central só em memória', async () => {
    const central = new DevCenterTransport();
    const center = createErrorCenter({ mode: 'dev', transports: [central] });
    await expect(
      startErrorCenter({
        center,
        env: envFalso(),
        openStore: () => Promise.reject(new Error('sem espaço')),
      }),
    ).resolves.toBeUndefined();

    expect(central.groups()).toEqual([
      expect.objectContaining({ code: 'DAT-001', severity: 'fatal' }),
    ]);
  });

  it('sem DevCenterTransport (test/prod): não abre banco', async () => {
    const center = createErrorCenter({ mode: 'prod', transports: [] });
    const openStore = jest.fn();
    await startErrorCenter({ center, env: envFalso(), openStore });
    expect(openStore).not.toHaveBeenCalled();
  });

  it('em modo test não mexe nos handlers globais do Jest', async () => {
    const center = createErrorCenter({ mode: 'test', transports: [new TestTransport()] });
    const env = envFalso();
    await startErrorCenter({ center, env, openStore: jest.fn() });
    expect(env.instalado()).toBe(false);
  });
});

// P0-S0-08 · o autodiagnóstico roda em segundo plano ao abrir o app (modo dev).
describe('P0-S0-08 · autodiagnóstico na abertura do app', () => {
  it('em dev: roda depois de carregar a Central', async () => {
    const db = openMemoryDatabase();
    const central = new DevCenterTransport();
    const center = createErrorCenter({ mode: 'dev', transports: [central] });
    const ordem: string[] = [];
    const selfTestRunner = {
      run: jest.fn(async () => {
        ordem.push(`autodiagnóstico com ${String(await central.schemaVersion())}`);
      }),
    };
    await startErrorCenter({
      center,
      env: envFalso(),
      openStore: () => createErrorLogRepo(db),
      selfTestRunner,
    });
    expect(ordem).toEqual(['autodiagnóstico com 1']);
  });

  it('em dev, mesmo se o banco não abrir, o autodiagnóstico roda', async () => {
    const center = createErrorCenter({ mode: 'dev', transports: [new DevCenterTransport()] });
    const selfTestRunner = { run: jest.fn(() => Promise.resolve()) };
    await startErrorCenter({
      center,
      env: envFalso(),
      openStore: () => Promise.reject(new Error('sem espaço')),
      selfTestRunner,
    });
    expect(selfTestRunner.run).toHaveBeenCalledTimes(1);
  });

  it('fora do modo dev (sem Central): não roda', async () => {
    const center = createErrorCenter({ mode: 'prod', transports: [] });
    const selfTestRunner = { run: jest.fn(() => Promise.resolve()) };
    await startErrorCenter({ center, env: envFalso(), openStore: jest.fn(), selfTestRunner });
    expect(selfTestRunner.run).not.toHaveBeenCalled();
  });
});
