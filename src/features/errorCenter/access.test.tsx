import { fireEvent, render, screen as rntlScreen } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { createErrorCenter } from '../../observability/center';
import { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { AjustesScreen } from '../ajustes/AjustesScreen';
import { AppStack } from '../navigation/AppStack';
import { ErrorBadge } from './ErrorBadge';

function Central() {
  return <Text>Tela da Central</Text>;
}
function Inicio() {
  return <Text>Início</Text>;
}

function rotas(devTools: boolean) {
  return {
    _layout: () => <AppStack devTools={devTools} />,
    index: Inicio,
    ajustes: () => <AjustesScreen version="0.0.1" devTools={devTools} />,
    'dev/erros': Central,
  };
}

// P0-S0-07 · acesso: Ajustes → 5 toques na versão; selo com erros novos; nada disso em prod.
describe('P0-S0-07 · acesso à Central de Erros', () => {
  it('em dev, 5 toques na versão (em Ajustes) abrem a Central', async () => {
    await renderRouter(rotas(true), { initialUrl: '/ajustes' });
    const versao = screen.getByRole('button', { name: 'Versão 0.0.1' });
    for (let i = 0; i < 4; i++) await fireEvent.press(versao);
    expect(screen.queryByText('Tela da Central')).toBeNull();
    await fireEvent.press(versao);
    expect(await screen.findByText('Tela da Central')).toBeOnTheScreen();
  });

  it('em prod, os toques na versão não fazem nada', async () => {
    await renderRouter(rotas(false), { initialUrl: '/ajustes' });
    const versao = screen.getByText('Versão 0.0.1');
    for (let i = 0; i < 6; i++) await fireEvent.press(versao);
    expect(screen.queryByText('Tela da Central')).toBeNull();
  });

  it('em prod, a rota /dev/erros não existe (abre o início no lugar)', async () => {
    await renderRouter(rotas(false), { initialUrl: '/dev/erros' });
    expect(screen.queryByText('Tela da Central')).toBeNull();
    expect(screen.getByText('Início')).toBeOnTheScreen();
  });

  it('em dev, a rota /dev/erros abre a Central', async () => {
    await renderRouter(rotas(true), { initialUrl: '/dev/erros' });
    expect(screen.getByText('Tela da Central')).toBeOnTheScreen();
  });
});

describe('P0-S0-07 · selo vermelho de erros novos', () => {
  function comErros(n: number) {
    const transporte = new DevCenterTransport();
    const center = createErrorCenter({ mode: 'dev', transports: [transporte] });
    for (let i = 0; i < n; i++) center.reportWarning('PLN-003', `erro ${'x'.repeat(i)}`);
    return { transporte, center };
  }

  it('em dev com erros novos: mostra a contagem com rótulo para leitor de tela', async () => {
    const { transporte } = comErros(3);
    await render(<ErrorBadge transport={transporte} visible onPress={jest.fn()} />);
    expect(
      rntlScreen.getByRole('button', { name: '3 erros novos na Central de Erros' }),
    ).toBeOnTheScreen();
    expect(rntlScreen.getByText('3')).toBeOnTheScreen();
  });

  it('um erro novo: texto no singular', async () => {
    const { transporte } = comErros(1);
    await render(<ErrorBadge transport={transporte} visible onPress={jest.fn()} />);
    expect(
      rntlScreen.getByRole('button', { name: '1 erro novo na Central de Erros' }),
    ).toBeOnTheScreen();
  });

  it('tocar no selo abre a Central', async () => {
    const { transporte } = comErros(1);
    const abrir = jest.fn();
    await render(<ErrorBadge transport={transporte} visible onPress={abrir} />);
    await fireEvent.press(rntlScreen.getByTestId('selo-erros'));
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('sem erros novos: não aparece', async () => {
    const { transporte } = comErros(2);
    await transporte.markSeen('2999-01-01T00:00:00.000Z');
    await render(<ErrorBadge transport={transporte} visible onPress={jest.fn()} />);
    expect(rntlScreen.queryByTestId('selo-erros')).toBeNull();
  });

  it('em prod: não aparece', async () => {
    const { transporte } = comErros(3);
    await render(<ErrorBadge transport={transporte} visible={false} onPress={jest.fn()} />);
    expect(rntlScreen.queryByTestId('selo-erros')).toBeNull();
  });

  it('aparece sozinho quando chega um erro novo', async () => {
    const { transporte, center } = comErros(0);
    await render(<ErrorBadge transport={transporte} visible onPress={jest.fn()} />);
    expect(rntlScreen.queryByTestId('selo-erros')).toBeNull();
    center.reportWarning('PLN-003', 'novo');
    expect(await rntlScreen.findByTestId('selo-erros')).toBeOnTheScreen();
  });
});
