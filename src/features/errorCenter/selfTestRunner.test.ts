/**
 * @jest-environment node
 */
import { createErrorLogRepo, DEV_ERROR_DB_VERSION } from '../../data/repositories/errorLogRepo';
import { createErrorCenter } from '../../observability/center';
import { createSelfTest, type SelfTestData } from '../../observability/selfTest';
import { devErrorDbVersionCheck } from '../../observability/selfTestChecks';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { openMemoryDatabase } from '../../../test/tools/nodeSqlite';
import { createSelfTestRunner, loadSelfTestData } from './selfTestRunner';

function montar(loadData: () => Promise<SelfTestData>) {
  const central = new DevCenterTransport();
  const center = createErrorCenter({ mode: 'dev', transports: [central] });
  const selfTest = createSelfTest({ center });
  selfTest.registerCheck(devErrorDbVersionCheck);
  const runner = createSelfTestRunner({ selfTest, loadData, center });
  return { central, runner };
}

const OK: SelfTestData = { devErrorDb: { version: 1, expected: 1 } };

describe('P0-S0-08 · rodar o autodiagnóstico (Central e abertura do app)', () => {
  it('estado vazio antes da primeira rodada', () => {
    expect(montar(() => Promise.resolve(OK)).runner.state()).toEqual({ status: 'idle' });
  });

  it('rodando enquanto lê os dados; depois mostra o relatório', async () => {
    let liberar: (d: SelfTestData) => void = () => undefined;
    const { runner } = montar(() => new Promise((resolve) => (liberar = resolve)));
    const avisos = jest.fn();
    runner.subscribe(avisos);

    const rodada = runner.run();
    expect(runner.state()).toEqual({ status: 'running' });
    liberar(OK);
    await rodada;

    expect(runner.state()).toMatchObject({
      status: 'done',
      report: { results: [{ code: 'APP-101', status: 'ok' }] },
    });
    expect(avisos).toHaveBeenCalledTimes(2); // rodando, pronto
  });

  it('dois toques seguidos não rodam duas vezes ao mesmo tempo', async () => {
    const loadData = jest.fn(() => Promise.resolve(OK));
    const { runner } = montar(loadData);
    await Promise.all([runner.run(), runner.run()]);
    expect(loadData).toHaveBeenCalledTimes(1);
  });

  it('problemas encontrados entram na lista da Central como aviso', async () => {
    const { runner, central } = montar(() =>
      Promise.resolve({ devErrorDb: { version: 3, expected: 1 } }),
    );
    await runner.run();
    expect(central.groups()).toEqual([
      expect.objectContaining({ code: 'APP-101', severity: 'warning' }),
    ]);
  });

  it('estado de erro: sem conseguir ler os dados do aparelho, avisa e reporta DAT-001', async () => {
    const { runner, central } = montar(() => Promise.reject(new Error('banco travado')));
    await expect(runner.run()).resolves.toBeUndefined();

    expect(runner.state()).toEqual({
      status: 'error',
      message: 'Não foi possível ler os dados do aparelho.',
    });
    expect(central.groups()).toEqual([
      expect.objectContaining({
        code: 'DAT-001',
        lastEvent: expect.objectContaining({ context: { etapa: 'autodiagnóstico' } }),
      }),
    ]);
  });

  it('cancelar o aviso para de avisar', async () => {
    const { runner } = montar(() => Promise.resolve(OK));
    const aviso = jest.fn();
    runner.subscribe(aviso)();
    await runner.run();
    expect(aviso).not.toHaveBeenCalled();
    expect(runner.version()).toBe(2);
  });
});

describe('P0-S0-08 · dados reais para o autodiagnóstico', () => {
  it('lê a versão do banco da Central e a versão que o app espera', async () => {
    const central = new DevCenterTransport();
    central.attachStore(await createErrorLogRepo(openMemoryDatabase()));
    expect(await loadSelfTestData(central)).toEqual({
      devErrorDb: { version: DEV_ERROR_DB_VERSION, expected: DEV_ERROR_DB_VERSION },
    });
  });

  it('banco da Central não abriu (ou fora do modo dev): sem dados do banco', async () => {
    expect(await loadSelfTestData(new DevCenterTransport())).toEqual({ devErrorDb: null });
    expect(await loadSelfTestData(undefined)).toEqual({ devErrorDb: null });
  });
});
