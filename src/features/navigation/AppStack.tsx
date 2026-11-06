import { Stack } from 'expo-router';

/**
 * Navegação raiz. Rotas de desenvolvedor (Central de Erros) só existem em modo dev:
 * em produção, abrir /dev/erros leva para o início (Stack.Protected do Expo Router).
 */
export function AppStack({ devTools }: { devTools: boolean }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ajustes" />
      <Stack.Protected guard={devTools}>
        <Stack.Screen name="dev/erros" />
      </Stack.Protected>
    </Stack>
  );
}
