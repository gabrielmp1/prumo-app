import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useErrorCenter } from '../src/features/errorCenter';

// Erro no próprio layout também mostra a tela "Algo deu errado" em vez de fechar o app.
export { ErrorBoundary } from '../src/features/errorCenter';

export default function RootLayout() {
  useErrorCenter();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
