import { isErrorCode } from '../../observability/codes';
import {
  SEVERITY_RANK,
  type ErrorEvent,
  type ErrorGroup,
  type ErrorLogStore,
  type Severity,
} from '../../observability/types';
import type { SqlDatabase } from '../sql';

/** A Central guarda no máximo este número de grupos; os mais antigos saem primeiro. */
export const MAX_ERROR_GROUPS = 500;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dev_error_log (
  fingerprint   TEXT PRIMARY KEY NOT NULL,
  code          TEXT NOT NULL,
  module        TEXT NOT NULL,
  severity      TEXT NOT NULL,
  severity_rank INTEGER NOT NULL,
  count         INTEGER NOT NULL,
  first_at      TEXT NOT NULL,
  last_at       TEXT NOT NULL,
  last_event    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS dev_error_log_last_at ON dev_error_log (last_at);
CREATE TABLE IF NOT EXISTS dev_error_meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const LAST_SEEN = 'last_seen_at';

// A contagem é feita pelo próprio banco: assim, eventos que chegam antes de o app terminar
// de carregar os grupos antigos não sobrescrevem a contagem.
const UPSERT = `
INSERT INTO dev_error_log
  (fingerprint, code, module, severity, severity_rank, count, first_at, last_at, last_event)
VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
ON CONFLICT (fingerprint) DO UPDATE SET
  count         = count + 1,
  last_at       = excluded.last_at,
  last_event    = excluded.last_event,
  severity      = CASE WHEN excluded.severity_rank > severity_rank THEN excluded.severity ELSE severity END,
  severity_rank = MAX(severity_rank, excluded.severity_rank)
`;

const PRUNE = `
DELETE FROM dev_error_log WHERE fingerprint NOT IN (
  SELECT fingerprint FROM dev_error_log ORDER BY last_at DESC, rowid DESC LIMIT ?
)
`;

interface Row {
  fingerprint: string;
  code: string;
  module: string;
  severity: string;
  count: number;
  first_at: string;
  last_at: string;
  last_event: string;
}

const SEVERITIES = Object.keys(SEVERITY_RANK) as Severity[];

function toSeverity(value: string): Severity {
  return SEVERITIES.find((s) => s === value) ?? 'error';
}

function parseEvent(row: Row): ErrorEvent {
  try {
    const parsed = JSON.parse(row.last_event) as ErrorEvent;
    if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') return parsed;
  } catch {
    // Cai no evento reconstruído abaixo: o grupo continua visível na Central.
  }
  return {
    id: row.fingerprint,
    code: isErrorCode(row.code) ? row.code : 'DAT-002',
    severity: toSeverity(row.severity),
    message: '(evento ilegível no banco)',
    module: row.module,
    breadcrumbs: [],
    appVersion: 'desconhecida',
    occurredAt: row.last_at,
    fingerprint: row.fingerprint,
  };
}

function toGroup(row: Row): ErrorGroup {
  const lastEvent = parseEvent(row);
  return {
    fingerprint: row.fingerprint,
    code: isErrorCode(row.code) ? row.code : lastEvent.code,
    module: row.module,
    severity: toSeverity(row.severity),
    count: row.count,
    firstAt: row.first_at,
    lastAt: row.last_at,
    lastEvent,
  };
}

/** Repositório da tabela `dev_error_log` (Central de Erros, só em dev). Cria a tabela se faltar. */
export async function createErrorLogRepo(db: SqlDatabase): Promise<ErrorLogStore> {
  await db.execAsync(SCHEMA);
  return {
    async record(event) {
      await db.runAsync(UPSERT, [
        event.fingerprint,
        event.code,
        event.module,
        event.severity,
        SEVERITY_RANK[event.severity],
        event.occurredAt,
        event.occurredAt,
        JSON.stringify(event),
      ]);
      await db.runAsync(PRUNE, [MAX_ERROR_GROUPS]);
    },
    async list() {
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM dev_error_log ORDER BY last_at DESC, rowid DESC',
        [],
      );
      return rows.map(toGroup);
    },
    async remove(fingerprint) {
      await db.runAsync('DELETE FROM dev_error_log WHERE fingerprint = ?', [fingerprint]);
    },
    async clear() {
      await db.runAsync('DELETE FROM dev_error_log', []);
    },
    async getLastSeen() {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM dev_error_meta WHERE key = ?',
        [LAST_SEEN],
      );
      return row?.value ?? null;
    },
    async setLastSeen(at) {
      await db.runAsync(
        'INSERT INTO dev_error_meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
        [LAST_SEEN, at],
      );
    },
  };
}
