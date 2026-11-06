import type { ErrorCode } from './codes';

// Tipos da Central de Erros (doc 04).

export type Severity = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export type ErrorMode = 'test' | 'dev' | 'prod';

export type BreadcrumbCategory = 'nav' | 'ui' | 'data' | 'net' | 'planner';

export type Context = Record<string, unknown>;

export interface Breadcrumb {
  category: BreadcrumbCategory;
  message: string;
  data?: Context;
  at: string; // ISO
}

export interface ErrorEvent {
  id: string;
  code: ErrorCode;
  severity: Severity;
  message: string; // técnico, para o desenvolvedor
  module: string;
  context?: Context;
  stack?: string;
  breadcrumbs: Breadcrumb[]; // últimas 50 ações
  screen?: string;
  appVersion: string;
  platform?: string; // ex.: "android 34"
  occurredAt: string; // ISO
  fingerprint: string; // código + mensagem normalizada → agrupa repetidos
}

/** Destino dos eventos: memória (testes), console, banco local (dev) ou Sentry (produção). */
export interface ErrorTransport {
  readonly name: string;
  send(event: ErrorEvent): void;
}

/** Repetições do mesmo erro (mesma impressão digital), como a Central mostra. */
export interface ErrorGroup {
  fingerprint: string;
  code: ErrorCode;
  module: string;
  severity: Severity; // a mais grave já vista no grupo
  count: number;
  firstAt: string;
  lastAt: string;
  lastEvent: ErrorEvent;
}

/** Onde a Central guarda os grupos para sobreviverem ao fechar o app (SQLite `dev_error_log`). */
export interface ErrorLogStore {
  /** Soma o evento ao grupo da sua impressão digital (ou cria o grupo). */
  record(event: ErrorEvent): Promise<void>;
  /** Grupos do mais recente para o mais antigo. */
  list(): Promise<ErrorGroup[]>;
  /** "Marcar como resolvido": apaga o grupo; se o erro voltar, recomeça do 1. */
  remove(fingerprint: string): Promise<void>;
  clear(): Promise<void>;
  /** Quando a tela da Central foi aberta pela última vez (ISO), para "só novos" e o selo. */
  getLastSeen(): Promise<string | null>;
  setLastSeen(at: string): Promise<void>;
}

/** Ordem de gravidade, da menor para a maior. */
export const SEVERITY_RANK: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};
