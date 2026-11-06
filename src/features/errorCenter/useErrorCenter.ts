import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { breadcrumb, errorCenter } from '../../observability';
import { startErrorCenter } from './startErrorCenter';

let started = false;

/**
 * Usado uma vez no layout raiz: liga a Central de Erros na abertura do app e registra a tela
 * atual e a trilha de navegação em cada mudança de rota (contexto dos relatórios).
 */
export function useErrorCenter(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (started) return;
    started = true;
    void startErrorCenter();
  }, []);

  useEffect(() => {
    errorCenter.setScreen(pathname);
    breadcrumb('nav', pathname);
  }, [pathname]);
}

/** Ferramentas de desenvolvedor (ex.: "Simular erro") só aparecem no modo dev. */
export const devToolsEnabled = errorCenter.mode === 'dev';
