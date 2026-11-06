// Interface mínima de banco SQL usada pelos repositórios. O expo-sqlite (`SQLiteDatabase`)
// já tem esse formato; nos testes, um adaptador usa o SQLite do Node com o mesmo SQL.

export type SqlValue = string | number | null;

export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<{ changes: number }>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
}
