import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SqlDatabase, SqlValue } from '../../src/data/sql';

// Banco SQLite de verdade para os testes de integração, usando o SQLite que vem no Node 24.
// Mesma interface que o expo-sqlite oferece no app (execAsync/runAsync/getAllAsync/getFirstAsync).
export function openMemoryDatabase(): SqlDatabase & { close(): void } {
  const db = new DatabaseSync(':memory:');
  const bind = (params: SqlValue[]) => params.map((p) => (p ?? null) as SQLInputValue);
  return {
    async execAsync(source) {
      db.exec(source);
    },
    async runAsync(source, params = []) {
      const r = db.prepare(source).run(...bind(params));
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    async getAllAsync<T>(source: string, params: SqlValue[] = []) {
      return db.prepare(source).all(...bind(params)) as T[];
    },
    async getFirstAsync<T>(source: string, params: SqlValue[] = []) {
      return (db.prepare(source).get(...bind(params)) as T | undefined) ?? null;
    },
    close() {
      db.close();
    },
  };
}
