import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '../../ui/Screen';
import { createTapCounter } from '../errorCenter/filters';

/**
 * Ajustes (provisório: as opções chegam nas próximas sprints). Em modo dev, tocar 5 vezes
 * seguidas na versão abre a Central de Erros (doc 04).
 */
export function AjustesScreen({ version, devTools }: { version: string; devTools: boolean }) {
  const router = useRouter();
  const tap = useMemo(() => createTapCounter({ taps: 5, windowMs: 3000 }), []);

  const label = `Versão ${version}`;
  return (
    <Screen contentStyle={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Ajustes
      </Text>
      <Pressable
        accessibilityRole={devTools ? 'button' : 'text'}
        accessibilityLabel={label}
        onPress={() => {
          if (devTools && tap()) router.push('/dev/erros');
        }}
        style={styles.version}
      >
        <Text>{label}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  version: { minHeight: 44, justifyContent: 'center' },
});
