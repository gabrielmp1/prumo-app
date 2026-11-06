/**
 * @jest-environment node
 */
import { createErrorLogRepo } from '../src/data/repositories/errorLogRepo';
import { createErrorCenter } from '../src/observability/center';
import { DevCenterTransport } from '../src/observability/transports/devCenterTransport';
import { openMemoryDatabase } from './tools/nodeSqlite';

function montar() {
  const transporte = new DevCenterTransport();
  let minuto = 0;
  const center = createErrorCenter({
    mode: 'dev',
    transports: [transporte],
    now: () => new Date(Date.parse('2026-11-06T10:00:00.000Z') + minuto * 60_000),
  });
  return {
    transporte,
    center,
    aos: (m: number) => {
      minuto = m;
    },
  };
}

// P0-S0-07 · ações da tela da Central sobre o transporte (com e sem banco).
describe('P0-S0-07 · Central: avisar a tela, resolver, novos desde a última abertura', () => {
  it('avisa quem está ouvindo a cada mudança e para de avisar ao cancelar', async () => {
    const { transporte, center } = montar();
    const ouvinte = jest.fn();
    const cancelar = transporte.subscribe(ouvinte);

    center.reportWarning('PLN-003', 'a');
    await transporte.resolve('PLN-003|a');
    await transporte.clear();
    expect(ouvinte).toHaveBeenCalledTimes(3);

    cancelar();
    center.reportWarning('PLN-003', 'b');
    expect(ouvinte).toHaveBeenCalledTimes(3);
  });

  it('a versão muda a cada alteração (para a tela saber que precisa redesenhar)', () => {
    const { transporte, center } = montar();
    const antes = transporte.version();
    center.reportWarning('PLN-003', 'a');
    expect(transporte.version()).not.toBe(antes);
  });

  it('marcar como resolvido tira o grupo da lista e do banco', async () => {
    const db = openMemoryDatabase();
    const repo = await createErrorLogRepo(db);
    const { transporte, center } = montar();
    transporte.attachStore(repo);
    center.reportWarning('PLN-003', 'a');
    center.reportError('DAT-003', new Error('b'));

    await transporte.resolve('PLN-003|a');

    expect(transporte.groups().map((g) => g.code)).toEqual(['DAT-003']);
    expect((await repo.list()).map((g) => g.code)).toEqual(['DAT-003']);
  });

  it('novos = grupos que aconteceram depois da última abertura da Central', async () => {
    const { transporte, center, aos } = montar();
    aos(0);
    center.reportWarning('PLN-003', 'antigo');
    await transporte.markSeen('2026-11-06T10:30:00.000Z');
    aos(60);
    center.reportError('DAT-003', new Error('novo'));

    expect(transporte.lastSeenAt()).toBe('2026-11-06T10:30:00.000Z');
    expect(transporte.newGroups().map((g) => g.code)).toEqual(['DAT-003']);
  });

  it('sem nenhuma abertura anterior, todos os grupos são novos', () => {
    const { transporte, center } = montar();
    center.reportWarning('PLN-003', 'a');
    expect(transporte.newGroups()).toHaveLength(1);
  });

  it('a última abertura fica guardada no banco e volta ao reabrir o app', async () => {
    const db = openMemoryDatabase();
    const primeiro = new DevCenterTransport();
    primeiro.attachStore(await createErrorLogRepo(db));
    await primeiro.markSeen('2026-11-06T10:30:00.000Z');

    const reaberto = new DevCenterTransport();
    reaberto.attachStore(await createErrorLogRepo(db));
    await reaberto.load();
    expect(reaberto.lastSeenAt()).toBe('2026-11-06T10:30:00.000Z');
  });
});
