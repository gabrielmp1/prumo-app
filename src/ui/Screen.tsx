import { useContext, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

const NO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Contêiner de toda tela: afasta o conteúdo da barra de status, do entalhe e da barra de
 * navegação (BUG-002). Com `scroll`, o conteúdo rola dentro da área segura.
 */
export function Screen({
  children,
  scroll = false,
  contentStyle,
  testID = 'tela',
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  // Sem provedor (ex.: alguns testes), não há o que afastar.
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const safe: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
  return (
    <View testID={testID} style={[styles.root, safe]}>
      {scroll ? (
        <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView>
      ) : (
        <View style={[styles.root, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
