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
  occurredAt: string; // ISO
  fingerprint: string; // código + mensagem normalizada → agrupa repetidos
}

/** Destino dos eventos: memória (testes), console, banco local (dev) ou Sentry (produção). */
export interface ErrorTransport {
  readonly name: string;
  send(event: ErrorEvent): void;
}

/** Ordem de gravidade, da menor para a maior. */
export const SEVERITY_RANK: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};
