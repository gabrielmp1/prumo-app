import { StyleSheet, Text, View } from 'react-native';

import { devToolsEnabled, SimulateErrorButton } from '../src/features/errorCenter';

export { ErrorBoundary } from '../src/features/errorCenter';

// Tela provisória: a tela Dia substitui esta na Sprint 3.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Prumo
      </Text>
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
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  devTools: {
    position: 'absolute',
    bottom: 24,
  },
});
