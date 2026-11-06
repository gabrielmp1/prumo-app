import { renderRouter, screen } from 'expo-router/testing-library';
import { Link, Slot } from 'expo-router';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

import { errorCenter, reportWarning } from '../../observability';
import { TestTransport } from '../../observability/transports/testTransport';
import { useErrorCenter } from './useErrorCenter';

function Layout({ children }: { children?: React.ReactNode }) {
  useErrorCenter();
  return <>{children}</>;
}

function Inicio() {
  return (
    <Link href="./semana">
      <Text>Ir para semana</Text>
    </Link>
  );
}

function Semana() {
  return <Text>Semana</Text>;
}

// P0-S0-06 · o evento leva a tela atual e a trilha de navegação.
describe('P0-S0-06 · tela atual e trilha de navegação', () => {
  it('ao navegar, a Central registra a tela e a trilha "nav"', async () => {
    function RootLayout() {
      return (
        <Layout>
          <Slot />
        </Layout>
      );
    }
    await renderRouter({ _layout: RootLayout, index: Inicio, semana: Semana }, { initialUrl: '/' });
    await fireEvent.press(screen.getByText('Ir para semana'));
    expect(await screen.findByText('Semana')).toBeOnTheScreen();

    expectReportedError('PLN-003');
    reportWarning('PLN-003', 'x');
    const transporte = errorCenter.transports.find((t) => t instanceof TestTransport);
    const evento = transporte?.events.at(-1);
    expect(evento?.screen).toBe('/semana');
    expect(evento?.breadcrumbs.filter((b) => b.category === 'nav').map((b) => b.message)).toEqual(
      expect.arrayContaining(['/', '/semana']),
    );
  });
});
