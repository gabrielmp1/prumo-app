/**
 * @jest-environment node
 */
import { createErrorLogRepo } from '../src/data/repositories/errorLogRepo';
import { createErrorCenter } from '../src/observability/center';
import { DevCenterTransport } from '../src/observability/transports/devCenterTransport';
import type { ErrorLogStore } from '../src/observability/types';
import { openMemoryDatabase } from './tools/nodeSqlite';

function abrirApp(transporte: DevCenterTransport) {
  let n = 0;
  return createErrorCenter({
    mode: 'dev',
    transports: [transporte],
    now: () => new Date(Date.parse('2026-11-06T10:00:00.000Z') + n * 1000),
    newId: () => `id-${++n}`,
  });
}

// P0-S0-06 · DevCenterTransport grava no SQLite; ao reabrir o app, os erros continuam lá.
describe('P0-S0-06 · persistência da Central de Erros', () => {
  it('ao reabrir o app, os erros anteriores continuam lá, com a contagem certa', async () => {
    const db = openMemoryDatabase();

    // 1ª abertura: dois erros iguais e um diferente.
    const antes = new DevCenterTransport();
    antes.attachStore(await createErrorLogRepo(db));
    const app1 = abrirApp(antes);
    app1.reportError('DAT-003', new Error('Falha ao salvar item 1'));
    app1.reportError('DAT-003', new Error('Falha ao salvar item 2'));
    app1.reportWarning('PLN-003', 'Tarefa não cabe');
    await antes.flush();

    // 2ª abertura: transporte novo, mesmo banco.
    const depois = new DevCenterTransport();
    depois.attachStore(await createErrorLogRepo(db));
    await depois.load();

    expect(depois.groups().map((g) => [g.code, g.count])).toEqual(
      expect.arrayContaining([
        ['DAT-003', 2],
        ['PLN-003', 1],
      ]),
    );
    expect(depois.groups()).toHaveLength(2);
  });

  it('erros reportados antes do banco abrir não se perdem', async () => {
    const db = openMemoryDatabase();
    const transporte = new DevCenterTransport();
    abrirApp(transporte).reportFatal('APP-001', new Error('cedo demais'));

    transporte.attachStore(await createErrorLogRepo(db));
    await transporte.flush();

    const reaberto = await createErrorLogRepo(db);
    expect((await reaberto.list()).map((g) => g.code)).toEqual(['APP-001']);
  });

  it('erros que chegam durante o load não somem nem contam duas vezes', async () => {
    const db = openMemoryDatabase();
    const transporte = new DevCenterTransport();
    transporte.attachStore(await createErrorLogRepo(db));
    const app = abrirApp(transporte);
    app.reportError('DAT-003', new Error('Falha 1'));
    const carregando = transporte.load();
    app.reportError('DAT-003', new Error('Falha 2'));
    await carregando;
    await transporte.flush();

    expect(transporte.groups().map((g) => g.count)).toEqual([2]);
  });

  it('limpar apaga também do banco', async () => {
    const db = openMemoryDatabase();
    const transporte = new DevCenterTransport();
    const repo = await createErrorLogRepo(db);
    transporte.attachStore(repo);
    abrirApp(transporte).reportWarning('PLN-003', 'x');
    await transporte.clear();
    expect(await repo.list()).toEqual([]);
    expect(transporte.groups()).toEqual([]);
  });

  it('falha ao gravar não derruba o app: fica registrada no próprio transporte', async () => {
    const quebrado: ErrorLogStore = {
      record: () => Promise.reject(new Error('disco cheio')),
      list: () => Promise.resolve([]),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      getLastSeen: () => Promise.resolve(null),
      setLastSeen: () => Promise.resolve(),
    };
    const transporte = new DevCenterTransport();
    transporte.attachStore(quebrado);
    abrirApp(transporte).reportWarning('PLN-003', 'x');
    await transporte.flush();

    expect(transporte.groups()).toHaveLength(1);
    expect(transporte.persistFailures).toBe(1);
    expect(transporte.lastPersistError).toBe('disco cheio');
  });

  it('a memória também fica limitada a 500 grupos', () => {
    const transporte = new DevCenterTransport();
    const app = abrirApp(transporte);
    for (let i = 0; i < 505; i++) app.reportWarning('PLN-003', `grupo ${'x'.repeat(i)}`);
    expect(transporte.groups()).toHaveLength(500);
  });
});
