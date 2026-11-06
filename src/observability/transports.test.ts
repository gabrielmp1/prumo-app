import { ConsoleTransport, type ConsoleSink } from './transports/consoleTransport';
import { DevCenterTransport } from './transports/devCenterTransport';
import { TestTransport } from './transports/testTransport';
import type { ErrorEvent, Severity } from './types';

function evento(parcial: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    id: 'id-1',
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

describe('P0-S0-04 · TestTransport', () => {
  it('guarda os eventos em memória e limpa no reset', () => {
    const t = new TestTransport();
    t.send(evento());
    t.expected.add('DAT-003');
    expect(t.events).toHaveLength(1);
    t.reset();
    expect(t.events).toHaveLength(0);
    expect(t.expected.size).toBe(0);
  });
});

describe('P0-S0-04 · DevCenterTransport (memória)', () => {
  it('agrupa por impressão digital e guarda primeira e última ocorrência', () => {
    const t = new DevCenterTransport();
    t.send(evento({ id: 'a', occurredAt: '2026-11-06T10:00:00.000Z' }));
    t.send(evento({ id: 'b', occurredAt: '2026-11-06T11:00:00.000Z' }));

    expect(t.groups()).toEqual([
      expect.objectContaining({
        fingerprint: 'DAT-003|falha ao salvar item #',
        code: 'DAT-003',
        severity: 'error',
        module: 'data',
        count: 2,
        firstAt: '2026-11-06T10:00:00.000Z',
        lastAt: '2026-11-06T11:00:00.000Z',
        lastEvent: expect.objectContaining({ id: 'b' }),
      }),
    ]);
  });

  it('lista os grupos do mais recente para o mais antigo', () => {
    const t = new DevCenterTransport();
    t.send(evento({ fingerprint: 'A', occurredAt: '2026-11-06T10:00:00.000Z' }));
    t.send(evento({ fingerprint: 'B', occurredAt: '2026-11-06T12:00:00.000Z' }));
    t.send(evento({ fingerprint: 'A', occurredAt: '2026-11-06T13:00:00.000Z' }));
    expect(t.groups().map((g) => g.fingerprint)).toEqual(['A', 'B']);
  });

  it('a severidade do grupo é a mais grave já vista', () => {
    const t = new DevCenterTransport();
    t.send(evento({ severity: 'warning' }));
    t.send(evento({ severity: 'fatal' }));
    t.send(evento({ severity: 'error' }));
    expect(t.groups()[0]?.severity).toBe('fatal');
  });

  it('limpar apaga tudo', () => {
    const t = new DevCenterTransport();
    t.send(evento());
    t.clear();
    expect(t.groups()).toEqual([]);
  });
});

describe('P0-S0-04 · ConsoleTransport', () => {
  function sinkFalso() {
    const chamadas: [string, string][] = [];
    const registrar = (nivel: string) => (texto: string) => {
      chamadas.push([nivel, texto]);
    };
    const sink: ConsoleSink = {
      debug: registrar('debug'),
      info: registrar('info'),
      warn: registrar('warn'),
      error: registrar('error'),
    };
    return { sink, chamadas };
  }

  it.each<[Severity, string]>([
    ['debug', 'debug'],
    ['info', 'info'],
    ['warning', 'warn'],
    ['error', 'error'],
    ['fatal', 'error'],
  ])('severidade %s vai para console.%s com código e mensagem', (severity, nivel) => {
    const { sink, chamadas } = sinkFalso();
    new ConsoleTransport(sink).send(evento({ severity }));
    expect(chamadas).toEqual([[nivel, `[DAT-003] ${severity} · data · Falha ao salvar item 1`]]);
  });

  it('quando há contexto, ele vai junto como segundo argumento', () => {
    const recebidos: unknown[][] = [];
    const sink: ConsoleSink = {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: (...args: unknown[]) => {
        recebidos.push(args);
      },
    };
    new ConsoleTransport(sink).send(evento({ context: { itemId: 'abc' } }));
    expect(recebidos).toEqual([
      ['[DAT-003] error · data · Falha ao salvar item 1', { itemId: 'abc' }],
    ]);
  });
});
