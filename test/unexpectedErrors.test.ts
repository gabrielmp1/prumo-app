import { reportWarning } from '../src/observability';
import { TestTransport } from '../src/observability/transports/testTransport';
import type { ErrorEvent } from '../src/observability/types';
import { assertNoUnexpectedErrors } from './tools/unexpectedErrors';

function evento(parcial: Partial<ErrorEvent>): ErrorEvent {
  return {
    id: 'id',
    code: 'DAT-003',
    severity: 'error',
    message: 'Falha ao salvar item 1',
    module: 'data',
    breadcrumbs: [],
    appVersion: '0.0.1',
    occurredAt: '2026-11-06T10:00:00.000Z',
    fingerprint: 'DAT-003|falha ao salvar item #',
    ...parcial,
  };
}

// P0-S0-05 · a verificação que roda depois de cada teste (doc 03).
describe('P0-S0-05 · erros reportados sem expectativa', () => {
  it('sem eventos: passa', () => {
    expect(() => assertNoUnexpectedErrors(new TestTransport())).not.toThrow();
  });

  it('erro reportado sem expectativa: falha mostrando código, severidade e mensagem', () => {
    const t = new TestTransport();
    t.send(evento({ code: 'DAT-003', message: 'Falha ao salvar item 1' }));
    expect(() => assertNoUnexpectedErrors(t)).toThrow(
      'Erros reportados sem expectativa:\n- DAT-003 (error) Falha ao salvar item 1',
    );
  });

  it('erro esperado: passa', () => {
    const t = new TestTransport();
    t.expected.add('PLN-003');
    t.send(evento({ code: 'PLN-003', severity: 'warning', message: 'não cabe' }));
    expect(() => assertNoUnexpectedErrors(t)).not.toThrow();
  });

  it('com um esperado e um inesperado: falha citando só o inesperado', () => {
    const t = new TestTransport();
    t.expected.add('PLN-003');
    t.send(evento({ code: 'PLN-003', severity: 'warning', message: 'não cabe' }));
    t.send(evento({ code: 'NTF-001', message: 'sem permissão' }));
    expect(() => assertNoUnexpectedErrors(t)).toThrow(
      /^Erros reportados sem expectativa:\n- NTF-001 \(error\) sem permissão$/,
    );
  });

  it('sempre limpa eventos e expectativas, passando ou falhando (um teste não contamina o próximo)', () => {
    const t = new TestTransport();
    t.expected.add('PLN-003');
    t.send(evento({ code: 'DAT-003' }));
    expect(() => assertNoUnexpectedErrors(t)).toThrow();
    expect(t.events).toEqual([]);
    expect(t.expected.size).toBe(0);
  });
});

describe('P0-S0-05 · expectReportedError na suíte real', () => {
  it('com expectativa, o erro reportado não quebra o teste', () => {
    expectReportedError('PLN-003');
    reportWarning('PLN-003', 'Tarefa não cabe até o prazo');
  });
});
