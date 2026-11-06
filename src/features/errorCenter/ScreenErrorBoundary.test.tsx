import { fireEvent, render, screen } from '@testing-library/react-native';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { errorCenter } from '../../observability';
import { TestTransport } from '../../observability/transports/testTransport';
import { ErrorBoundary } from './ScreenErrorBoundary';
import { SimulateErrorButton } from './SimulateErrorButton';

function TelaQueQuebra(): never {
  throw new Error('tela quebrou');
}

// P0-S0-06 · ErrorBoundary por tela (doc 04): mensagem, "Tentar de novo" e UI-001.
describe('P0-S0-06 · ErrorBoundary da tela', () => {
  it('mostra a mensagem, o botão e reporta UI-001 (fatal) uma vez', async () => {
    expectReportedError('UI-001');
    const retry = jest.fn(() => Promise.resolve());
    const erro = new Error('tela quebrou');
    const { rerender } = await render(<ErrorBoundary error={erro} retry={retry} />);

    expect(screen.getByText('Algo deu errado nesta tela.')).toBeOnTheScreen();
    const botao = screen.getByRole('button', { name: 'Tentar de novo' });
    await fireEvent.press(botao);
    expect(retry).toHaveBeenCalledTimes(1);

    await rerender(<ErrorBoundary error={erro} retry={retry} />);
    const transporte = errorCenter.transports.find((t) => t instanceof TestTransport);
    expect(transporte?.events.filter((e) => e.code === 'UI-001')).toEqual([
      expect.objectContaining({ code: 'UI-001', severity: 'fatal' }),
    ]);
  });

  it('o botão tem área de toque de pelo menos 44 px', async () => {
    expectReportedError('UI-001');
    await render(<ErrorBoundary error={new Error('x')} retry={() => Promise.resolve()} />);
    const botao = screen.getByRole('button', { name: 'Tentar de novo' });
    expect(botao).toHaveStyle({ minHeight: 44 });
  });

  it('numa rota do Expo Router, a tela que lança mostra a mensagem em vez de quebrar o app', async () => {
    expectReportedError('UI-001');
    await renderRouter({ index: { default: TelaQueQuebra, ErrorBoundary } }, { initialUrl: '/' });
    expect(routerScreen.getByText('Algo deu errado nesta tela.')).toBeOnTheScreen();
  });

  it('"Tentar de novo" volta a mostrar a tela quando o problema passou', async () => {
    expectReportedError('UI-001');
    let quebrar = true;
    function TelaInstavel() {
      const [, forcar] = useState(0);
      if (quebrar) throw new Error('instável');
      return (
        <Pressable onPress={() => forcar((n) => n + 1)}>
          <Text>Tela ok</Text>
        </Pressable>
      );
    }
    await renderRouter({ index: { default: TelaInstavel, ErrorBoundary } }, { initialUrl: '/' });
    quebrar = false;
    await fireEvent.press(routerScreen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await routerScreen.findByText('Tela ok')).toBeOnTheScreen();
  });
});

describe('P0-S0-06 · botão escondido "Simular erro" (só em dev)', () => {
  it('não aparece fora do modo dev', async () => {
    await render(<SimulateErrorButton visible={false} />);
    expect(screen.queryByTestId('simular-erro')).toBeNull();
  });

  it('em dev, tocar faz a tela quebrar e a Central registrar UI-001', async () => {
    expectReportedError('UI-001');
    function Tela() {
      return <SimulateErrorButton visible />;
    }
    await renderRouter({ index: { default: Tela, ErrorBoundary } }, { initialUrl: '/' });
    await fireEvent.press(routerScreen.getByTestId('simular-erro'));
    expect(await routerScreen.findByText('Algo deu errado nesta tela.')).toBeOnTheScreen();
  });
});
