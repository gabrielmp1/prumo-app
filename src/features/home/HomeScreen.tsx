import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../ui/Screen';
import { ErrorBadge } from '../errorCenter/ErrorBadge';
import { SimulateErrorButton } from '../errorCenter/SimulateErrorButton';

// Tela provisória: a tela Dia substitui esta na Sprint 3.
export function HomeScreen({ devTools }: { devTools: boolean }) {
  const router = useRouter();
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.top}>
        <ErrorBadge visible={devTools} onPress={() => router.push('/dev/erros')} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Prumo
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajustes"
        onPress={() => router.push('/ajustes')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Ajustes</Text>
      </Pressable>
      <View style={styles.devTools}>
        <SimulateErrorButton visible={devTools} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  top: {
    position: 'absolute',
    top: 8,
    right: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  link: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 16,
  },
  devTools: {
    position: 'absolute',
    bottom: 24,
  },
});
