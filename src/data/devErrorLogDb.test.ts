/**
 * @jest-environment node
 */
import { openDevErrorLog } from './devErrorLogDb';

// O expo-sqlite nativo não roda no Jest: no lugar dele, o SQLite do Node com o mesmo SQL.
jest.mock('expo-sqlite', () => {
  const { openMemoryDatabase } = jest.requireActual<typeof import('../../test/tools/nodeSqlite')>(
    '../../test/tools/nodeSqlite',
  );
  return { openDatabaseAsync: jest.fn(() => Promise.resolve(openMemoryDatabase())) };
});

// P0-S0-06 · banco próprio da Central, separado do banco principal.
describe('P0-S0-06 · banco da Central de Erros no aparelho', () => {
  it('abre "prumo-dev-errors.db" e devolve o repositório pronto para gravar', async () => {
    const { openDatabaseAsync } = jest.requireMock<{ openDatabaseAsync: jest.Mock }>('expo-sqlite');
    const store = await openDevErrorLog();

    expect(openDatabaseAsync).toHaveBeenCalledWith('prumo-dev-errors.db');
    await store.record({
      id: 'a',
      code: 'APP-001',
      severity: 'fatal',
      message: 'x',
      module: 'app',
      breadcrumbs: [],
      appVersion: '0.0.1',
      occurredAt: '2026-11-06T10:00:00.000Z',
      fingerprint: 'APP-001|x',
    });
    expect(await store.list()).toHaveLength(1);
  });
});
