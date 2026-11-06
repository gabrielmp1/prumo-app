import { createErrorCenter } from './center';
import { installGlobalHandlers, type GlobalHandlerEnv } from './globalHandlers';
import { TestTransport } from './transports/testTransport';

type Handler = (error: unknown, isFatal?: boolean) => void;
type TrackerOptions = {
  allRejections: boolean;
  onUnhandled: (id: number, rejection: unknown) => void;
  onHandled: (id: number) => void;
};

function montar() {
  const transporte = new TestTransport();
  const center = createErrorCenter({ mode: 'dev', transports: [transporte] });
  const anterior = jest.fn<void, Parameters<Handler>>();
  let atual: Handler = anterior;
  let rastreador: TrackerOptions | undefined;
  const env: GlobalHandlerEnv = {
    errorUtils: {
      getGlobalHandler: () => atual,
      setGlobalHandler: (h) => {
        atual = h;
      },
    },
    hermes: {
      enablePromiseRejectionTracker: (opcoes) => {
        rastreador = opcoes;
      },
    },
  };
  return {
    center,
    transporte,
    anterior,
    env,
    lancar: (erro: unknown, isFatal?: boolean) => atual(erro, isFatal),
    rejeitar: (id: number, motivo: unknown) => rastreador?.onUnhandled(id, motivo),
    rastreador: () => rastreador,
  };
}

// P0-S0-06 · capturas globais: exceção JS não tratada (APP-001) e promessa rejeitada (APP-002).
describe('P0-S0-06 · capturas globais', () => {
  it('exceção fatal não tratada → APP-001 fatal, e o handler original continua sendo chamado', () => {
    const m = montar();
    installGlobalHandlers(m.center, m.env);
    const erro = new Error('quebrou tudo');
    m.lancar(erro, true);

    expect(m.transporte.events).toEqual([
      expect.objectContaining({
        code: 'APP-001',
        severity: 'fatal',
        message: 'quebrou tudo',
        context: { isFatal: true },
      }),
    ]);
    expect(m.anterior).toHaveBeenCalledWith(erro, true);
  });

  it('exceção não fatal → APP-001 como error', () => {
    const m = montar();
    installGlobalHandlers(m.center, m.env);
    m.lancar(new Error('ops'), false);
    expect(m.transporte.events[0]).toEqual(
      expect.objectContaining({ code: 'APP-001', severity: 'error', context: { isFatal: false } }),
    );
  });

  it('promessa rejeitada sem tratamento → APP-002, e o aviso padrão do React Native continua', () => {
    const m = montar();
    installGlobalHandlers(m.center, m.env);
    expect(m.rastreador()?.allRejections).toBe(true);

    m.rejeitar(7, new Error('timeout'));

    expect(m.transporte.events).toEqual([
      expect.objectContaining({
        code: 'APP-002',
        severity: 'error',
        message: 'timeout',
        context: { promiseId: 7 },
      }),
    ]);
    expect(m.anterior).toHaveBeenCalledTimes(1);
    const [avisoPadrao, fatal] = m.anterior.mock.calls[0] ?? [];
    expect(String(avisoPadrao)).toContain('Uncaught (in promise, id: 7)');
    expect(fatal).toBe(false);
  });

  it('sem Hermes (ex.: web, Jest): instala só o handler de exceções', () => {
    const m = montar();
    expect(() => installGlobalHandlers(m.center, { ...m.env, hermes: undefined })).not.toThrow();
    m.lancar(new Error('x'), true);
    expect(m.transporte.events).toHaveLength(1);
  });

  it('desinstalar devolve o handler original', () => {
    const m = montar();
    const desinstalar = installGlobalHandlers(m.center, m.env);
    desinstalar();
    m.lancar(new Error('x'), true);
    expect(m.transporte.events).toHaveLength(0);
    expect(m.anterior).toHaveBeenCalledTimes(1);
  });

  it('se o próprio relatório falhar, o handler original ainda recebe o erro', () => {
    const m = montar();
    const center = {
      ...m.center,
      reportFatal: () => {
        throw new Error('central quebrada');
      },
    };
    installGlobalHandlers(center, m.env);
    const erro = new Error('original');
    m.lancar(erro, true);
    expect(m.anterior).toHaveBeenCalledWith(erro, true);
  });
});
