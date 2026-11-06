import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { CODES, reportFatal } from '../../observability';
import { Screen } from '../../ui/Screen';

// Erros já reportados: o Expo Router pode renderizar a mesma tela de erro mais de uma vez.
const reported = new WeakSet<Error>();

/**
 * Tela de erro de uma rota (doc 04). Cada tela exporta `ErrorBoundary` daqui; o Expo Router
 * mostra este componente no lugar da tela que quebrou e reporta UI-001 (fatal).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (reported.has(error)) return;
    reported.add(error);
    reportFatal('UI-001', error);
  }, [error]);

  return (
    <Screen contentStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.message}>
        {CODES['UI-001'].userMessage}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tentar de novo"
        onPress={() => void retry()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Tentar de novo</Text>
      </Pressable>
    </Screen>
  );
}

// Estilo provisório: os tokens do design "Caderno" entram na P0-S0-09.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
