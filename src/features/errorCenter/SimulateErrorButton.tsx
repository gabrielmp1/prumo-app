import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

function SimulatedCrash(): never {
  throw new Error('Erro simulado pela Central de Erros');
}

/**
 * Botão discreto, só em modo dev: faz a tela atual quebrar de propósito, para testar o
 * ErrorBoundary e a Central de Erros no celular (e no E2E).
 */
export function SimulateErrorButton({ visible }: { visible: boolean }) {
  const [crash, setCrash] = useState(false);
  if (!visible) return null;
  if (crash) return <SimulatedCrash />;
  return (
    <Pressable
      testID="simular-erro"
      accessibilityRole="button"
      accessibilityLabel="Simular erro"
      onPress={() => setCrash(true)}
      style={styles.button}
    >
      <Text style={styles.text}>Simular erro</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    opacity: 0.4,
  },
  text: {
    fontSize: 12,
  },
});
