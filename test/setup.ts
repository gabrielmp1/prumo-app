// Roda antes de cada arquivo de teste (jest.setupFilesAfterEnv). Doc 03:
// um erro reportado sem expectativa quebra o teste, em vez de passar despercebido.
import { errorCenter, type ErrorCode } from '../src/observability';
import { TestTransport } from '../src/observability/transports/testTransport';
import { assertNoUnexpectedErrors } from './tools/unexpectedErrors';

declare global {
  /** Marca o código como esperado no teste atual: reportá-lo não faz o teste falhar. */
  var expectReportedError: (code: ErrorCode) => void;
}

const transport = errorCenter.transports.find((t) => t instanceof TestTransport);
if (!transport) {
  throw new Error(
    `A Central de Erros não está em modo test (modo atual: ${errorCenter.mode}). ` +
      'Confira EXPO_PUBLIC_ERROR_MODE no ambiente dos testes.',
  );
}

globalThis.expectReportedError = (code) => {
  transport.expected.add(code);
};

afterEach(() => {
  assertNoUnexpectedErrors(transport);
});
