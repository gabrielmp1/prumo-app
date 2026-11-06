import type { TestTransport } from '../../src/observability/transports/testTransport';
import type { ErrorEvent } from '../../src/observability/types';

function format(events: ErrorEvent[]): string {
  return events.map((e) => `- ${e.code} (${e.severity}) ${e.message}`).join('\n');
}

/**
 * Roda depois de cada teste (doc 03): falha se algum erro foi reportado sem
 * `expectReportedError(código)`. Sempre limpa o transporte, para um teste não contaminar o próximo.
 */
export function assertNoUnexpectedErrors(transport: TestTransport): void {
  const unexpected = transport.events.filter((e) => !transport.expected.has(e.code));
  transport.reset();
  if (unexpected.length > 0) {
    throw new Error(`Erros reportados sem expectativa:\n${format(unexpected)}`);
  }
}
