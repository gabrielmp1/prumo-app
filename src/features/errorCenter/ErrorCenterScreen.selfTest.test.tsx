import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { createErrorCenter } from '../../observability/center';
import { createSelfTest, type SelfTestData } from '../../observability/selfTest';
import { devErrorDbVersionCheck } from '../../observability/selfTestChecks';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { ErrorCenterScreen } from './ErrorCenterScreen';
import { createSelfTestRunner } from './selfTestRunner';
import { formatMs } from './SelfTestPanel';

function montar(loadData: () => Promise<SelfTestData>, extra?: 'quebrada') {
  const transporte = new DevCenterTransport();
  const center = createErrorCenter({ mode: 'dev', transports: [transporte] });
  // Cronômetro falso: cada verificação "leva" 3 ms.
  let relogio = 0;
  const selfTest = createSelfTest({
    center,
    monotonic: () => {
      relogio += 3;
      return relogio;
    },
  });
  selfTest.registerCheck(
    extra === 'quebrada'
      ? {
          ...devErrorDbVersionCheck,
          run: () => {
            throw new Error('dados estranhos');
          },
        }
      : devErrorDbVersionCheck,
  );
  const runner = createSelfTestRunner({ selfTest, loadData, center });
  return {
    transporte,
    runner,
    abrir: () =>
      render(
        <ErrorCenterScreen
          transport={transporte}
          selfTest={runner}
          now={() => new Date('2026-11-06T15:00:00.000Z')}
        />,
      ),
  };
}

const painel = () => screen.getByLabelText('Resultado do autodiagnóstico');

describe('P0-S0-08 · autodiagnóstico na Central de Erros', () => {
  it('estado vazio: "O autodiagnóstico ainda não rodou"', async () => {
    await montar(() => Promise.resolve({ devErrorDb: null })).abrir();
    expect(within(painel()).getByText('O autodiagnóstico ainda não rodou')).toBeOnTheScreen();
  });

  it('rodando: botão desativado com "Rodando…"', async () => {
    let liberar: (d: SelfTestData) => void = () => undefined;
    const m = montar(() => new Promise((resolve) => (liberar = resolve)));
    await m.abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Rodar autodiagnóstico' }));
    expect(screen.getByRole('button', { name: 'Rodando…' })).toBeDisabled();

    liberar({ devErrorDb: { version: 1, expected: 1 } });
    expect(await screen.findByRole('button', { name: 'Rodar autodiagnóstico' })).toBeEnabled();
  });

  it('normal: uma linha por verificação com nome, "ok" e o tempo', async () => {
    const m = montar(() => Promise.resolve({ devErrorDb: { version: 1, expected: 1 } }));
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Rodar autodiagnóstico' }));

    const linha = await screen.findByLabelText(
      'APP-101, Versão do banco da Central de Erros: ok, 3 ms',
    );
    expect(within(linha).getByText('ok')).toBeOnTheScreen();
    expect(within(linha).getByText('3 ms')).toBeOnTheScreen();
  });

  it('normal com problema: "1 problema", a mensagem embaixo e o aviso na lista da Central', async () => {
    const m = montar(() => Promise.resolve({ devErrorDb: { version: 2, expected: 1 } }));
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Rodar autodiagnóstico' }));

    expect(
      await screen.findByLabelText(
        'APP-101, Versão do banco da Central de Erros: 1 problema, 3 ms',
      ),
    ).toBeOnTheScreen();
    expect(
      within(painel()).getByText('Banco da Central de Erros na versão 2; o app espera a versão 1'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^APP-101, Aviso, 1 vez/ })).toBeOnTheScreen();
  });

  it('erro: a verificação que lançou aparece como "falhou", com a mensagem, e vira APP-003', async () => {
    const m = montar(() => Promise.resolve({ devErrorDb: null }), 'quebrada');
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Rodar autodiagnóstico' }));

    const linha = await screen.findByLabelText(
      'APP-101, Versão do banco da Central de Erros: falhou, 3 ms',
    );
    expect(within(linha).getByText('falhou')).toBeOnTheScreen();
    expect(within(painel()).getByText('dados estranhos')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^APP-003, Erro, 1 vez/ })).toBeOnTheScreen();
  });

  it('erro ao ler os dados do aparelho: mensagem clara no painel', async () => {
    const m = montar(() => Promise.reject(new Error('banco travado')));
    await m.abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Rodar autodiagnóstico' }));

    expect(
      await within(painel()).findByText('Não foi possível ler os dados do aparelho.'),
    ).toBeOnTheScreen();
  });

  it('mostra o resultado da rodada automática (abertura do app) sem precisar tocar', async () => {
    const m = montar(() => Promise.resolve({ devErrorDb: { version: 1, expected: 1 } }));
    await m.runner.run();
    await m.abrir();
    expect(
      screen.getByLabelText('APP-101, Versão do banco da Central de Erros: ok, 3 ms'),
    ).toBeOnTheScreen();
  });
});

describe('P0-S0-08 · tempo de cada verificação', () => {
  it('em ms inteiros; abaixo de 1 ms, "< 1 ms"', () => {
    expect(formatMs(0)).toBe('< 1 ms');
    expect(formatMs(0.4)).toBe('< 1 ms');
    expect(formatMs(1)).toBe('1 ms');
    expect(formatMs(2.6)).toBe('3 ms');
  });
});
