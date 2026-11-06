import { StatusBar } from 'expo-status-bar';

import { devToolsEnabled, useErrorCenter } from '../src/features/errorCenter';
import { AppStack } from '../src/features/navigation/AppStack';

// Erro no próprio layout também mostra a tela "Algo deu errado" em vez de fechar o app.
export { ErrorBoundary } from '../src/features/errorCenter';

export default function RootLayout() {
  useErrorCenter();
  return (
    <>
      <AppStack devTools={devToolsEnabled} />
      <StatusBar style="auto" />
    </>
  );
}
