/**
 * @jest-environment node
 */
import type { ErrorEvent, Severity } from '../../observability/types';
import { openMemoryDatabase } from '../../../test/tools/nodeSqlite';
import { createErrorLogRepo, MAX_ERROR_GROUPS } from './errorLogRepo';

function evento(parcial: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    id: 'id-1',
    code: 'DAT-003',
    severity: 'error',
    message: 'Falha ao salvar item 1',
    module: 'data',
    breadcrumbs: [{ category: 'nav', message: '/dia', at: '2026-11-06T09:59:00.000Z' }],
    appVersion: '0.0.1',
    occurredAt: '2026-11-06T10:00:00.000Z',
    fingerprint: 'DAT-003|falha ao salvar item #',
    ...parcial,
  };
}

// P0-S0-06 · integração com SQLite de verdade (em memória): tabela dev_error_log.
describe('P0-S0-06 · errorLogRepo (dev_error_log)', () => {
  it('grava um evento e lê o grupo com o evento completo', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    await repo.record(evento());

    expect(await repo.list()).toEqual([
      {
        fingerprint: 'DAT-003|falha ao salvar item #',
        code: 'DAT-003',
        module: 'data',
        severity: 'error',
        count: 1,
        firstAt: '2026-11-06T10:00:00.000Z',
        lastAt: '2026-11-06T10:00:00.000Z',
        lastEvent: evento(),
      },
    ]);
  });

  it('agrupa pela impressão digital: conta, mantém a primeira e atualiza a última ocorrência', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    await repo.record(evento({ id: 'a', occurredAt: '2026-11-06T10:00:00.000Z' }));
    await repo.record(
      evento({
        id: 'b',
        message: 'Falha ao salvar item 2',
        occurredAt: '2026-11-06T11:00:00.000Z',
      }),
    );

    const [grupo] = await repo.list();
    expect(grupo).toEqual(
      expect.objectContaining({
        count: 2,
        firstAt: '2026-11-06T10:00:00.000Z',
        lastAt: '2026-11-06T11:00:00.000Z',
        lastEvent: expect.objectContaining({ id: 'b', message: 'Falha ao salvar item 2' }),
      }),
    );
  });

  it('a severidade do grupo é a mais grave já vista', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    const ordem: Severity[] = ['warning', 'fatal', 'error'];
    for (const severity of ordem) await repo.record(evento({ severity }));
    expect((await repo.list())[0]?.severity).toBe('fatal');
  });

  it(`guarda no máximo ${MAX_ERROR_GROUPS} grupos, removendo os mais antigos`, async () => {
    expect(MAX_ERROR_GROUPS).toBe(500);
    const repo = await createErrorLogRepo(openMemoryDatabase());
    const base = Date.parse('2026-11-06T00:00:00.000Z');
    for (let i = 0; i < MAX_ERROR_GROUPS + 5; i++) {
      await repo.record(
        evento({
          fingerprint: `G${i}`,
          occurredAt: new Date(base + i * 1000).toISOString(),
        }),
      );
    }
    const grupos = await repo.list();
    expect(grupos).toHaveLength(MAX_ERROR_GROUPS);
    expect(grupos[0]?.fingerprint).toBe(`G${MAX_ERROR_GROUPS + 4}`);
    expect(grupos.at(-1)?.fingerprint).toBe('G5');
  });

  it('lista do mais recente para o mais antigo', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    await repo.record(evento({ fingerprint: 'A', occurredAt: '2026-11-06T10:00:00.000Z' }));
    await repo.record(evento({ fingerprint: 'B', occurredAt: '2026-11-06T12:00:00.000Z' }));
    await repo.record(evento({ fingerprint: 'A', occurredAt: '2026-11-06T13:00:00.000Z' }));
    expect((await repo.list()).map((g) => g.fingerprint)).toEqual(['A', 'B']);
  });

  it('limpar apaga tudo', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    await repo.record(evento());
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  it('abrir de novo o mesmo banco mantém os dados (a tabela não é recriada)', async () => {
    const db = openMemoryDatabase();
    await (await createErrorLogRepo(db)).record(evento());
    const reaberto = await createErrorLogRepo(db);
    expect(await reaberto.list()).toHaveLength(1);
  });

  it('evento ilegível no banco não some nem quebra a lista', async () => {
    const db = openMemoryDatabase();
    const repo = await createErrorLogRepo(db);
    await repo.record(evento());
    await db.runAsync('UPDATE dev_error_log SET last_event = ?', ['{quebrado']);

    const [grupo] = await repo.list();
    expect(grupo).toEqual(
      expect.objectContaining({
        code: 'DAT-003',
        count: 1,
        lastEvent: expect.objectContaining({
          code: 'DAT-003',
          message: '(evento ilegível no banco)',
          breadcrumbs: [],
        }),
      }),
    );
  });
});

// P0-S0-07 · "Marcar como resolvido" e "só novos desde a última abertura".
describe('P0-S0-07 · errorLogRepo: resolvido e última abertura', () => {
  it('remover um grupo apaga só ele; se o erro voltar, o grupo recomeça do 1', async () => {
    const repo = await createErrorLogRepo(openMemoryDatabase());
    await repo.record(evento({ fingerprint: 'A' }));
    await repo.record(evento({ fingerprint: 'A' }));
    await repo.record(evento({ fingerprint: 'B' }));

    await repo.remove('A');
    expect((await repo.list()).map((g) => g.fingerprint)).toEqual(['B']);

    await repo.record(evento({ fingerprint: 'A' }));
    expect((await repo.list()).find((g) => g.fingerprint === 'A')?.count).toBe(1);
  });

  it('guarda quando a Central foi aberta pela última vez (vazio no começo)', async () => {
    const db = openMemoryDatabase();
    const repo = await createErrorLogRepo(db);
    expect(await repo.getLastSeen()).toBeNull();

    await repo.setLastSeen('2026-11-06T10:00:00.000Z');
    await repo.setLastSeen('2026-11-06T12:00:00.000Z');
    expect(await (await createErrorLogRepo(db)).getLastSeen()).toBe('2026-11-06T12:00:00.000Z');
  });
});
