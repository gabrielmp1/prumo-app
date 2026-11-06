import { createErrorCenter } from './center';
import type { SelfTestCheck, SelfTestCode, SelfTestData } from './selfTest';
import { TestTransport } from './transports/testTransport';

// O catálogo ainda tem um só código de autodiagnóstico (APP-101). Para provar a ordem e o
// "as outras continuam", este teste acrescenta um código fictício, que só existe aqui.
// O test/setup.ts já carregou o selfTest com o catálogo real; por isso ele é carregado de novo,
// isolado, com o catálogo trocado.
let createSelfTest: typeof import('./selfTest').createSelfTest = () => {
  throw new Error('selfTest não carregado');
};
jest.isolateModules(() => {
  jest.doMock('./codes', () => {
    const real = jest.requireActual<typeof import('./codes')>('./codes');
    return {
      ...real,
      CODES: {
        ...real.CODES,
        'APP-199': {
          severity: 'warning',
          selfTest: true,
          description: 'Fictício (só no teste)',
          story: 'P0-S0-08',
        },
      },
    };
  });
  createSelfTest = jest.requireActual<typeof import('./selfTest')>('./selfTest').createSelfTest;
});
const FICTICIO = 'APP-199' as unknown as SelfTestCode;

const DADOS: SelfTestData = { devErrorDb: { version: 1, expected: 1 } };

function montar() {
  const transporte = new TestTransport();
  const center = createErrorCenter({ mode: 'dev', transports: [transporte] });
  // Cronômetro falso: cada leitura avança 5 ms.
  let relogio = 0;
  const selfTest = createSelfTest({
    center,
    now: () => new Date('2026-11-06T15:00:00.000Z'),
    monotonic: () => {
      relogio += 5;
      return relogio;
    },
  });
  return { selfTest, transporte };
}

function verificacao(parcial: Partial<SelfTestCheck> = {}): SelfTestCheck {
  return { code: 'APP-101', name: 'Exemplo', run: () => [], ...parcial };
}

describe('P0-S0-08 · autodiagnóstico: registro de verificações', () => {
  it('registerCheck({ code, name, run }) guarda as verificações, na ordem de registro', () => {
    const { selfTest } = montar();
    const a = verificacao({ name: 'A' });
    const b = verificacao({ code: FICTICIO, name: 'B' });
    selfTest.registerCheck(a);
    selfTest.registerCheck(b);
    expect(selfTest.checks()).toEqual([a, b]);
  });

  it('não aceita duas verificações com o mesmo código (erro de programação, aparece no teste)', () => {
    const { selfTest } = montar();
    selfTest.registerCheck(verificacao({ name: 'A' }));
    expect(() => selfTest.registerCheck(verificacao({ name: 'B' }))).toThrow(/APP-101/);
    expect(selfTest.checks()).toHaveLength(1);
  });

  it('só aceita códigos de autodiagnóstico do catálogo', () => {
    const { selfTest } = montar();
    // @ts-expect-error: APP-003 não é código de autodiagnóstico; o tsc falha se este erro sumir.
    const errado: SelfTestCheck = verificacao({ code: 'APP-003' });
    expect(() => selfTest.registerCheck(errado)).toThrow(/autodiagnóstico/);
    expect(selfTest.checks()).toEqual([]);
  });
});

describe('P0-S0-08 · autodiagnóstico: execução', () => {
  it('resultado: lista de verificações com ok/problemas e o tempo de cada uma', () => {
    const { selfTest, transporte } = montar();
    selfTest.registerCheck(verificacao({ name: 'Tudo certo' }));
    selfTest.registerCheck(
      verificacao({ code: FICTICIO, name: 'Com problema', run: () => [{ message: 'p1' }] }),
    );

    expect(selfTest.run(DADOS)).toEqual({
      startedAt: '2026-11-06T15:00:00.000Z',
      ms: 25, // início, 2 × (antes, depois), fim → 6 leituras de 5 ms: 30 - 5
      results: [
        { code: 'APP-101', name: 'Tudo certo', status: 'ok', problems: [], ms: 5 },
        {
          code: FICTICIO,
          name: 'Com problema',
          status: 'problems',
          problems: [{ message: 'p1' }],
          ms: 5,
        },
      ],
    });
    expect(transporte.events).toHaveLength(1);
  });

  it('a verificação recebe os dados reais do aparelho', () => {
    const { selfTest } = montar();
    const run = jest.fn(() => []);
    selfTest.registerCheck(verificacao({ run }));
    selfTest.run(DADOS);
    expect(run).toHaveBeenCalledWith(DADOS);
  });

  it('cada problema entra na Central como aviso, com o código da verificação e o contexto', () => {
    const { selfTest, transporte } = montar();
    selfTest.registerCheck(
      verificacao({ run: () => [{ message: 'p1', context: { versao: 3 } }, { message: 'p2' }] }),
    );
    selfTest.run(DADOS);

    expect(transporte.events.map((e) => [e.code, e.severity, e.message, e.context])).toEqual([
      ['APP-101', 'warning', 'p1', { versao: 3 }],
      ['APP-101', 'warning', 'p2', undefined],
    ]);
  });

  it('verificação que lança vira APP-003 em vez de derrubar o app, e as outras continuam', () => {
    const { selfTest, transporte } = montar();
    const depois = jest.fn(() => []);
    selfTest.registerCheck(
      verificacao({
        name: 'Quebrada',
        run: () => {
          throw new Error('dados estranhos');
        },
      }),
    );
    selfTest.registerCheck(verificacao({ code: FICTICIO, name: 'Depois', run: depois }));

    const relatorio = selfTest.run(DADOS);

    expect(relatorio.results).toEqual([
      {
        code: 'APP-101',
        name: 'Quebrada',
        status: 'failed',
        problems: [],
        ms: 5,
        error: 'dados estranhos',
      },
      { code: FICTICIO, name: 'Depois', status: 'ok', problems: [], ms: 5 },
    ]);
    expect(depois).toHaveBeenCalled();
    expect(transporte.events).toEqual([
      expect.objectContaining({
        code: 'APP-003',
        severity: 'error',
        message: 'dados estranhos',
        context: { verificacao: 'APP-101' },
      }),
    ]);
  });

  it('o que for lançado (até um texto solto) vira mensagem legível', () => {
    const { selfTest } = montar();
    selfTest.registerCheck(
      verificacao({
        run: () => {
          throw 'texto lançado';
        },
      }),
    );
    expect(selfTest.run(DADOS).results[0]).toMatchObject({
      status: 'failed',
      error: 'texto lançado',
    });
  });

  it('sem verificações registradas: relatório vazio', () => {
    expect(montar().selfTest.run(DADOS).results).toEqual([]);
  });
});
