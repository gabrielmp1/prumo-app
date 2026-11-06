import { errorCenter, reportWarning } from './index';
import { resolveMode, transportsFor } from './mode';
import { ConsoleTransport } from './transports/consoleTransport';
import { DevCenterTransport } from './transports/devCenterTransport';
import { TestTransport } from './transports/testTransport';

// P0-S0-04 · transportes escolhidos por EXPO_PUBLIC_ERROR_MODE (doc 04).
describe('P0-S0-04 · modo da Central de Erros', () => {
  it.each(['test', 'dev', 'prod'] as const)('EXPO_PUBLIC_ERROR_MODE=%s é respeitado', (modo) => {
    expect(resolveMode({ EXPO_PUBLIC_ERROR_MODE: modo }, true)).toBe(modo);
  });

  it('sem a variável: test no Jest, dev em desenvolvimento, prod no build final', () => {
    expect(resolveMode({ NODE_ENV: 'test' }, true)).toBe('test');
    expect(resolveMode({}, true)).toBe('dev');
    expect(resolveMode({}, false)).toBe('prod');
  });

  it('valor desconhecido cai no padrão (nunca liga um modo por engano)', () => {
    expect(resolveMode({ EXPO_PUBLIC_ERROR_MODE: 'debug' }, false)).toBe('prod');
  });

  it('test → só TestTransport', () => {
    const ts = transportsFor('test');
    expect(ts).toHaveLength(1);
    expect(ts[0]).toBeInstanceOf(TestTransport);
  });

  it('dev → DevCenterTransport + ConsoleTransport', () => {
    const ts = transportsFor('dev');
    expect(ts.map((t) => t.constructor)).toEqual([DevCenterTransport, ConsoleTransport]);
  });

  it('prod → nada sai do aparelho até existir o Sentry com consentimento (P3-S13-03)', () => {
    expect(transportsFor('prod')).toEqual([]);
  });
});

describe('P0-S0-04 · instância padrão', () => {
  it('no Jest, a instância padrão está em modo test com TestTransport', () => {
    expect(errorCenter.mode).toBe('test');
    const [transporte] = errorCenter.transports;
    if (!(transporte instanceof TestTransport)) throw new Error('esperava TestTransport');

    expectReportedError('PLN-003');
    reportWarning('PLN-003', 'tarefa não cabe');
    expect(transporte.events.at(-1)?.code).toBe('PLN-003');
  });
});
