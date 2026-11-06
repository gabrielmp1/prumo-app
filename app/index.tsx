import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { devToolsEnabled, ErrorBadge, SimulateErrorButton } from '../src/features/errorCenter';

export { ErrorBoundary } from '../src/features/errorCenter';

// Tela provisória: a tela Dia substitui esta na Sprint 3.
export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <ErrorBadge visible={devToolsEnabled} onPress={() => router.push('/dev/erros')} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Prumo
      </Text>
      <Link href="/ajustes" style={styles.link} accessibilityRole="link">
        Ajustes
      </Link>
      <View style={styles.devTools}>
        <SimulateErrorButton visible={devToolsEnabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  top: {
    position: 'absolute',
    top: 48,
    right: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  link: {
    minHeight: 44,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
    fontSize: 16,
  },
  devTools: {
    position: 'absolute',
    bottom: 24,
  },
});
