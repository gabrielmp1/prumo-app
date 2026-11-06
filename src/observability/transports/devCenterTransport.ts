import type { ErrorCode } from '../codes';
import { SEVERITY_RANK, type ErrorEvent, type ErrorTransport, type Severity } from '../types';

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

/**
 * Alimenta a tela "Central de Erros" (só em dev), agrupando repetições pela impressão digital.
 * Nesta versão guarda em memória; a P0-S0-06 passa a gravar no SQLite (`dev_error_log`).
 */
export class DevCenterTransport implements ErrorTransport {
  readonly name = 'devCenter';
  private readonly byFingerprint = new Map<string, ErrorGroup>();

  send(event: ErrorEvent): void {
    const group = this.byFingerprint.get(event.fingerprint);
    if (!group) {
      this.byFingerprint.set(event.fingerprint, {
        fingerprint: event.fingerprint,
        code: event.code,
        module: event.module,
        severity: event.severity,
        count: 1,
        firstAt: event.occurredAt,
        lastAt: event.occurredAt,
        lastEvent: event,
      });
      return;
    }
    group.count += 1;
    group.lastAt = event.occurredAt;
    group.lastEvent = event;
    if (SEVERITY_RANK[event.severity] > SEVERITY_RANK[group.severity]) {
      group.severity = event.severity;
    }
  }

  /** Grupos do mais recente para o mais antigo. */
  groups(): ErrorGroup[] {
    return [...this.byFingerprint.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }

  clear(): void {
    this.byFingerprint.clear();
  }
}
