import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AjustesScreen } from '../src/features/ajustes/AjustesScreen';
import { ErrorCenterScreen } from '../src/features/errorCenter/ErrorCenterScreen';
import { ErrorBoundary } from '../src/features/errorCenter/ScreenErrorBoundary';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { DevCenterTransport } from '../src/observability/transports/devCenterTransport';
import { Screen } from '../src/ui/Screen';

jest.mock('expo-router', () => ({
  ...jest.requireActual<object>('expo-router'),
  useRouter: () => ({ push: jest.fn() }),
}));

// Aparelho com barra de status de 47 px e barra de navegação de 34 px.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function noAparelho(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

// BUG-002 · o conteúdo das telas não pode ficar por baixo da barra de status do Android.
describe('BUG-002 · telas respeitam a área segura', () => {
  it('Screen afasta o conteúdo das barras do sistema', async () => {
    await noAparelho(
      <Screen>
        <Text>conteúdo</Text>
      </Screen>,
    );
    expect(screen.getByTestId('tela')).toHaveStyle({ paddingTop: 47, paddingBottom: 34 });
  });

  it('sem informação de área segura (ex.: testes): não quebra, sem afastamento', async () => {
    await render(
      <Screen>
        <Text>conteúdo</Text>
      </Screen>,
    );
    expect(screen.getByTestId('tela')).toHaveStyle({ paddingTop: 0 });
  });

  it.each<[string, () => ReactElement]>([
    ['Central de Erros (lista)', () => <ErrorCenterScreen transport={new DevCenterTransport()} />],
    ['Central de Erros (fora do modo dev)', () => <ErrorCenterScreen />],
    ['Ajustes', () => <AjustesScreen version="0.0.1" devTools />],
    ['Tela inicial', () => <HomeScreen devTools={false} />],
  ])('%s usa a área segura', async (_nome, tela) => {
    await noAparelho(tela());
    expect(screen.getByTestId('tela')).toHaveStyle({ paddingTop: 47 });
  });

  it('tela "Algo deu errado" usa a área segura', async () => {
    expectReportedError('UI-001');
    await noAparelho(<ErrorBoundary error={new Error('x')} retry={() => Promise.resolve()} />);
    expect(screen.getByTestId('tela')).toHaveStyle({ paddingTop: 47 });
  });
});
