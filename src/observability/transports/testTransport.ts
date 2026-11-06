import type { ErrorCode } from '../codes';
import type { ErrorEvent, ErrorTransport } from '../types';

/** Guarda os eventos em memória para os testes conferirem (doc 03, "Falhar o teste se um erro for reportado"). */
export class TestTransport implements ErrorTransport {
  readonly name = 'test';
  readonly events: ErrorEvent[] = [];
  /** Códigos que o teste atual espera ver reportados (ver expectReportedError, P0-S0-05). */
  readonly expected = new Set<ErrorCode>();

  send(event: ErrorEvent): void {
    this.events.push(event);
  }

  reset(): void {
    this.events.length = 0;
    this.expected.clear();
  }
}
