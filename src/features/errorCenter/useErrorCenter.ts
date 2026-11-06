import Constants from 'expo-constants';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { breadcrumb, errorCenter } from '../../observability';
import { startErrorCenter } from './startErrorCenter';

let started = false;

/** Versão do app (app.json) e plataforma, para os relatórios: ex. "0.0.1" e "android 34". */
export function appInfo(): { appVersion: string; platform: string } {
  return {
    appVersion: Constants.expoConfig?.version ?? 'desconhecida',
    platform: `${Platform.OS} ${String(Platform.Version)}`,
  };
}

/**
 * Usado uma vez no layout raiz: liga a Central de Erros na abertura do app e registra a tela
 * atual e a trilha de navegação em cada mudança de rota (contexto dos relatórios).
 */
export function useErrorCenter(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (started) return;
    started = true;
    errorCenter.setAppInfo(appInfo());
    void startErrorCenter();
  }, []);

  useEffect(() => {
    errorCenter.setScreen(pathname);
    breadcrumb('nav', pathname);
  }, [pathname]);
}

/** Ferramentas de desenvolvedor (ex.: "Simular erro") só aparecem no modo dev. */
export const devToolsEnabled = errorCenter.mode === 'dev';
