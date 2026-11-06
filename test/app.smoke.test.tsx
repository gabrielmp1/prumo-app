import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '../app/_layout';
import Ajustes from '../app/ajustes';
import CentralDeErros from '../app/dev/erros';
import HomeScreen from '../app/index';

// No Jest o expo-constants não lê o app.json: simulamos a versão.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.0.1' } },
}));

// App real, com os arquivos de rota de verdade. No Jest a Central está em modo "test",
// que se comporta como produção para as ferramentas de desenvolvedor (ficam escondidas).
const rotas = {
  _layout: RootLayout,
  index: HomeScreen,
  ajustes: Ajustes,
  'dev/erros': CentralDeErros,
};

// P0-S0-01 · teste de fumaça: o app abre na tela inicial sem erro.
describe('P0-S0-01 · tela inicial', () => {
  it('abre na rota "/" mostrando o nome "Prumo"', async () => {
    await renderRouter(rotas, { initialUrl: '/' });

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('header', { name: 'Prumo' })).toBeOnTheScreen();
  });
});

// P0-S0-07 · fora do modo dev: sem selo, sem "Simular erro", sem rota /dev/erros.
describe('P0-S0-07 · ferramentas de desenvolvedor ausentes fora do modo dev', () => {
  it('a tela inicial não mostra o selo nem o "Simular erro"', async () => {
    await renderRouter(rotas, { initialUrl: '/' });
    expect(screen.queryByTestId('selo-erros')).toBeNull();
    expect(screen.queryByTestId('simular-erro')).toBeNull();
  });

  it('abrir /dev/erros leva para o início', async () => {
    await renderRouter(rotas, { initialUrl: '/dev/erros' });
    expect(screen.queryByRole('header', { name: 'Central de Erros' })).toBeNull();
    expect(screen.getByRole('header', { name: 'Prumo' })).toBeOnTheScreen();
  });

  it('Ajustes abre pela tela inicial e mostra a versão do app', async () => {
    await renderRouter(rotas, { initialUrl: '/' });
    await fireEvent.press(screen.getByText('Ajustes'));
    expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(screen.getByText('Versão 0.0.1')).toBeOnTheScreen();
  });
});
