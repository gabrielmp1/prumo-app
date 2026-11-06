import { Pressable, StyleSheet, Text } from 'react-native';

import type { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import { defaultDevCenter, useDevCenterVersion } from './useDevCenter';

/** Selo vermelho com a quantidade de erros novos (só em dev). Tocar abre a Central. */
export function ErrorBadge({
  transport = defaultDevCenter(),
  visible,
  onPress,
}: {
  transport?: DevCenterTransport;
  visible: boolean;
  onPress: () => void;
}) {
  useDevCenterVersion(transport);
  const count = transport?.newGroups().length ?? 0;
  if (!visible || count === 0) return null;
  const label =
    count === 1 ? '1 erro novo na Central de Erros' : `${count} erros novos na Central de Erros`;
  return (
    <Pressable
      testID="selo-erros"
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.badge}
    >
      <Text style={styles.text}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#B00020',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  text: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
