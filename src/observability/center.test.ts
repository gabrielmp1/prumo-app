import { createErrorCenter, InvariantViolation, type ErrorCenterOptions } from './center';
import { DevCenterTransport } from './transports/devCenterTransport';
import { TestTransport } from './transports/testTransport';
import type { ErrorEvent, ErrorTransport } from './types';

// Relógios falsos: o "agora" e o cronômetro do measure são controlados pelo teste.
function montar(opcoes: Partial<ErrorCenterOptions> = {}) {
  const transporte = new TestTransport();
  let ms = 0;
  let id = 0;
  const center = createErrorCenter({
    mode: 'dev',
    transports: [transporte],
    appVersion: '0.0.1',
    now: () => new Date('2026-11-06T10:00:00.000Z'),
    monotonic: () => ms,
    newId: () => `id-${++id}`,
    ...opcoes,
  });
  return {
    center,
    transporte,
    avancar: (delta: number) => {
      ms += delta;
    },
  };
}

function ultimo(t: TestTransport): ErrorEvent {
  const e = t.events.at(-1);
  if (!e) throw new Error('nenhum evento reportado');
  return e;
}

describe('P0-S0-04 · cada função reporta com a severidade correta', () => {
  it('reportError → error, com mensagem e pilha do erro', () => {
    const { center, transporte } = montar();
    center.reportError('DAT-003', new Error('Falha ao salvar item 123'), { itemId: 'abc' });

    const e = ultimo(transporte);
    expect(e).toEqual(
      expect.objectContaining({
        id: 'id-1',
        code: 'DAT-003',
        severity: 'error',
        message: 'Falha ao salvar item 123',
        module: 'data',
        context: { itemId: 'abc' },
        appVersion: '0.0.1',
        occurredAt: '2026-11-06T10:00:00.000Z',
      }),
    );
    expect(e.stack).toContain('Falha ao salvar item 123');
    expect(e.fingerprint).toBe('DAT-003|falha ao salvar item #');
  });

  it('reportError aceita valor que não é Error', () => {
    const { center, transporte } = montar();
    center.reportError('APP-002', 'rejeitada sem motivo');
    center.reportError('APP-002', { motivo: 'timeout' });
    expect(transporte.events.map((e) => [e.message, e.stack])).toEqual([
      ['rejeitada sem motivo', undefined],
      ['{"motivo":"timeout"}', undefined],
    ]);
  });

  it('reportError com objeto que não vira JSON (circular) não quebra', () => {
    const { center, transporte } = montar();
    const circular: { eu?: unknown } = {};
    circular.eu = circular;
    expect(() => center.reportError('APP-002', circular)).not.toThrow();
    expect(ultimo(transporte).message).toBe('[object Object]');
  });

  it('reportFatal → fatal', () => {
    const { center, transporte } = montar();
    center.reportFatal('UI-001', new Error('tela quebrou'));
    expect(ultimo(transporte).severity).toBe('fatal');
  });

  it('reportWarning → warning', () => {
    const { center, transporte } = montar();
    center.reportWarning('PLN-003', 'Tarefa não cabe até o prazo', { tarefas: 2 });
    expect(ultimo(transporte)).toEqual(
      expect.objectContaining({ severity: 'warning', module: 'planner', context: { tarefas: 2 } }),
    );
  });

  it('P0-S0-07 · o evento leva a versão e a plataforma informadas na abertura do app', () => {
    const { center, transporte } = montar();
    center.setAppInfo({ appVersion: '0.3.0', platform: 'android 34' });
    center.reportWarning('PLN-003', 'x');
    expect(ultimo(transporte)).toEqual(
      expect.objectContaining({ appVersion: '0.3.0', platform: 'android 34' }),
    );
  });

  it('o evento leva a tela atual', () => {
    const { center, transporte } = montar();
    center.setScreen('/dia');
    center.reportWarning('QAD-001', 'texto não reconhecido');
    expect(ultimo(transporte).screen).toBe('/dia');
  });
});

describe('P0-S0-04 · trilha de ações', () => {
  it('guarda as ações em ordem, com categoria, mensagem, dados e hora', () => {
    const { center, transporte } = montar();
    center.breadcrumb('nav', '/dia');
    center.breadcrumb('ui', 'toque no bloco', { blocoId: 'b1' });
    center.reportWarning('PLN-003', 'x');

    expect(ultimo(transporte).breadcrumbs).toEqual([
      { category: 'nav', message: '/dia', at: '2026-11-06T10:00:00.000Z' },
      {
        category: 'ui',
        message: 'toque no bloco',
        data: { blocoId: 'b1' },
        at: '2026-11-06T10:00:00.000Z',
      },
    ]);
  });

  it('fica limitada às últimas 50 ações', () => {
    const { center, transporte } = montar();
    for (let i = 1; i <= 60; i++) center.breadcrumb('ui', `toque ${i}`);
    center.reportWarning('PLN-003', 'x');

    const trilha = ultimo(transporte).breadcrumbs;
    expect(trilha).toHaveLength(50);
    expect(trilha[0]?.message).toBe('toque 11');
    expect(trilha.at(-1)?.message).toBe('toque 60');
  });

  it('o evento guarda uma cópia: ações novas não mudam eventos antigos', () => {
    const { center, transporte } = montar();
    center.breadcrumb('nav', '/dia');
    center.reportWarning('PLN-003', 'x');
    center.breadcrumb('nav', '/semana');
    expect(transporte.events[0]?.breadcrumbs).toHaveLength(1);
  });
});

describe('P0-S0-04 · agrupamento por impressão digital', () => {
  it('"Falha ao salvar item 123" e "… 456" viram um grupo com contagem 2', () => {
    const central = new DevCenterTransport();
    const { center } = montar({ transports: [central] });

    center.reportError('DAT-003', new Error('Falha ao salvar item 123'));
    center.reportError('DAT-003', new Error('Falha ao salvar item 456'));
    center.reportError('DAT-002', new Error('Falha ao salvar item 789'));

    const grupos = central.groups();
    expect(grupos).toHaveLength(2);
    const salvar = grupos.find((g) => g.code === 'DAT-003');
    expect(salvar?.count).toBe(2);
    expect(salvar?.lastEvent.message).toBe('Falha ao salvar item 456');
  });
});

describe('P0-S0-04 · check (invariantes)', () => {
  it('condição verdadeira: não faz nada e devolve true', () => {
    const { center, transporte } = montar({ mode: 'test' });
    expect(center.check(true, 'PLN-001')).toBe(true);
    expect(transporte.events).toHaveLength(0);
  });

  it('em modo test, check(false) lança exceção com o código', () => {
    const { center } = montar({ mode: 'test' });
    expect(() => center.check(false, 'PLN-001', { dia: '2026-11-06' })).toThrow(InvariantViolation);
    expect(() => center.check(false, 'PLN-001')).toThrow(/PLN-001/);
  });

  it.each(['dev', 'prod'] as const)(
    'em modo %s, check(false) reporta como error e segue',
    (mode) => {
      const { center, transporte } = montar({ mode });
      expect(center.check(false, 'PLN-002', { bloco: 'b1' })).toBe(false);
      expect(ultimo(transporte)).toEqual(
        expect.objectContaining({ code: 'PLN-002', severity: 'error', context: { bloco: 'b1' } }),
      );
    },
  );
});

describe('P0-S0-04 · withReporting', () => {
  it('sem erro: devolve o resultado e não reporta', async () => {
    const { center, transporte } = montar();
    const somar = center.withReporting('DAT-003', async (a: number, b: number) => a + b);
    await expect(somar(2, 3)).resolves.toBe(5);
    expect(transporte.events).toHaveLength(0);
  });

  it('com erro e sem valor padrão: reporta e repropaga o mesmo erro', async () => {
    const { center, transporte } = montar();
    const erro = new Error('disco cheio');
    const salvar = center.withReporting('DAT-003', async () => {
      throw erro;
    });
    await expect(salvar()).rejects.toBe(erro);
    expect(ultimo(transporte)).toEqual(
      expect.objectContaining({ code: 'DAT-003', severity: 'error', message: 'disco cheio' }),
    );
  });

  it('com erro e valor padrão: reporta e devolve o valor padrão', async () => {
    const { center, transporte } = montar();
    const ler = center.withReporting(
      'DAT-002',
      async (): Promise<string[]> => {
        throw new Error('inválido');
      },
      { fallback: [] },
    );
    await expect(ler()).resolves.toEqual([]);
    expect(ultimo(transporte).code).toBe('DAT-002');
  });
});

describe('P0-S0-04 · measure (orçamento de tempo)', () => {
  it('acima do orçamento: reporta PRF-001 com a operação e o tempo', () => {
    const { center, transporte, avancar } = montar();
    const resultado = center.measure(
      'plan',
      () => {
        avancar(80);
        return 'ok';
      },
      50,
    );
    expect(resultado).toBe('ok');
    expect(ultimo(transporte)).toEqual(
      expect.objectContaining({
        code: 'PRF-001',
        severity: 'warning',
        context: { operacao: 'plan', ms: 80, orcamentoMs: 50 },
      }),
    );
  });

  it('dentro do orçamento: não reporta', () => {
    const { center, transporte, avancar } = montar();
    center.measure('plan', () => avancar(50), 50);
    expect(transporte.events).toHaveLength(0);
  });

  it('função assíncrona: mede até a promessa terminar', async () => {
    const { center, transporte, avancar } = montar();
    const valor = await center.measure(
      'abrir dia',
      async () => {
        await Promise.resolve();
        avancar(400);
        return 7;
      },
      300,
    );
    expect(valor).toBe(7);
    expect(ultimo(transporte).context).toEqual({
      operacao: 'abrir dia',
      ms: 400,
      orcamentoMs: 300,
    });
  });

  it('se a função lança, o erro passa adiante e o tempo não é reportado', () => {
    const { center, transporte, avancar } = montar();
    expect(() =>
      center.measure(
        'plan',
        () => {
          avancar(999);
          throw new Error('quebrou');
        },
        50,
      ),
    ).toThrow('quebrou');
    expect(transporte.events).toHaveLength(0);
  });
});

describe('P0-S0-04 · robustez', () => {
  it('um transporte que falha não impede os outros de receber o evento', () => {
    const quebrado: ErrorTransport = {
      name: 'quebrado',
      send: () => {
        throw new Error('sem disco');
      },
    };
    const bom = new TestTransport();
    const { center } = montar({ transports: [quebrado, bom] });

    expect(() => center.reportWarning('PLN-003', 'x')).not.toThrow();
    expect(bom.events).toHaveLength(1);
  });
});
