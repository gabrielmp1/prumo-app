import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '../app/_layout';
import HomeScreen from '../app/index';

// P0-S0-01 · teste de fumaça: o app abre na tela inicial sem erro.
describe('P0-S0-01 · tela inicial', () => {
  it('abre na rota "/" mostrando o nome "Prumo"', async () => {
    await renderRouter({ _layout: RootLayout, index: HomeScreen }, { initialUrl: '/' });

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('header', { name: 'Prumo' })).toBeOnTheScreen();
  });
});
