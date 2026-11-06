import Constants from 'expo-constants';

import { appInfo } from './useErrorCenter';

// No Jest o expo-constants não lê o app.json (no celular, lê): simulamos o que ele entrega.
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: null } }));

const constants = Constants as unknown as { expoConfig: { version?: string } | null };

// P0-S0-07 · versão e plataforma no relatório ("Versão: 0.0.1 (sprint 0) · android 34").
describe('P0-S0-07 · informações do app para os relatórios', () => {
  afterEach(() => {
    constants.expoConfig = null;
  });

  it('lê a versão do app.json e a plataforma do aparelho', () => {
    constants.expoConfig = { version: '0.0.1' };
    const info = appInfo();
    expect(info.appVersion).toBe('0.0.1');
    expect(info.platform).toMatch(/^(android|ios|web) \S+$/);
  });

  it('sem configuração disponível: "desconhecida", sem quebrar', () => {
    expect(appInfo().appVersion).toBe('desconhecida');
  });
});
