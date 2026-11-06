import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CheckResult } from '../../observability/selfTest';
import { formatWhen } from './format';
import type { SelfTestRunner } from './selfTestRunner';

/** "3 ms"; abaixo de 1 ms, "< 1 ms" (as verificações costumam ser rápidas). */
export function formatMs(ms: number): string {
  return ms < 1 ? '< 1 ms' : `${Math.round(ms)} ms`;
}

function statusText(result: CheckResult): string {
  if (result.status === 'failed') return 'falhou';
  const n = result.problems.length;
  if (n === 0) return 'ok';
  return n === 1 ? '1 problema' : `${n} problemas`;
}

const STATUS_COLOR: Record<CheckResult['status'], string> = {
  ok: '#166534',
  problems: '#B45309',
  failed: '#B00020',
};

/** Autodiagnóstico na Central (P0-S0-08): botão e resultado da última rodada. */
export function SelfTestPanel({ runner }: { runner: SelfTestRunner }) {
  useSyncExternalStore(
    (listener) => runner.subscribe(listener),
    () => runner.version(),
  );
  const state = runner.state();
  const running = state.status === 'running';
  const label = running ? 'Rodando…' : 'Rodar autodiagnóstico';

  return (
    <View accessibilityLabel="Resultado do autodiagnóstico" style={styles.panel}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: running }}
        disabled={running}
        onPress={() => void runner.run()}
        style={[styles.action, running && styles.disabled]}
      >
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>

      {state.status === 'idle' ? <Text>O autodiagnóstico ainda não rodou</Text> : null}
      {state.status === 'error' ? <Text style={styles.failed}>{state.message}</Text> : null}
      {state.status === 'done' ? (
        <>
          <Text style={styles.muted}>
            Última rodada: {formatWhen(state.report.startedAt)} · {formatMs(state.report.ms)}
          </Text>
          {state.report.results.map((r) => (
            <ResultRow key={r.code} result={r} />
          ))}
        </>
      ) : null}
    </View>
  );
}

function ResultRow({ result }: { result: CheckResult }) {
  const status = statusText(result);
  const time = formatMs(result.ms);
  return (
    <View style={styles.result}>
      <View
        accessible
        accessibilityLabel={`${result.code}, ${result.name}: ${status}, ${time}`}
        style={styles.resultTop}
      >
        <Text style={styles.code}>{result.code}</Text>
        <Text style={styles.name}>{result.name}</Text>
        <Text style={[styles.status, { color: STATUS_COLOR[result.status] }]}>{status}</Text>
        <Text style={styles.muted}>{time}</Text>
      </View>
      {result.problems.map((p, i) => (
        <Text key={i} selectable style={styles.detail}>
          {p.message}
        </Text>
      ))}
      {result.error !== undefined ? (
        <Text selectable style={[styles.detail, styles.failed]}>
          {result.error}
        </Text>
      ) : null}
    </View>
  );
}

// Estilo provisório: os tokens do design "Caderno" entram na P0-S0-09.
const styles = StyleSheet.create({
  panel: { gap: 8, borderWidth: 1, borderRadius: 8, padding: 12 },
  action: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderRadius: 8,
  },
  actionText: { fontWeight: '600' },
  disabled: { opacity: 0.4 },
  result: { gap: 4 },
  resultTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' },
  code: { fontWeight: '700' },
  name: { flexShrink: 1 },
  status: { fontWeight: '600' },
  muted: { opacity: 0.7 },
  detail: { paddingLeft: 12 },
  failed: { color: '#B00020' },
});
