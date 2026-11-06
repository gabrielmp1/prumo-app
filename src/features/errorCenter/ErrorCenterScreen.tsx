import * as Clipboard from 'expo-clipboard';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reportError } from '../../observability';
import { sanitizeReport, shortenBundleUrls } from '../../observability/sanitize';
import type { DevCenterTransport } from '../../observability/transports/devCenterTransport';
import type { ErrorGroup, Severity } from '../../observability/types';
import { filterGroups, modulesOf } from './filters';
import { componentPath, formatWhen, SEVERITY_COLOR, SEVERITY_LABEL } from './format';
import { formatAllReport, formatGroupReport } from './report';
import { SelfTestPanel } from './SelfTestPanel';
import { defaultSelfTestRunner, type SelfTestRunner } from './selfTestRunner';
import { SimulateErrorButton } from './SimulateErrorButton';
import { Screen } from '../../ui/Screen';
import { defaultDevCenter, useDevCenterVersion } from './useDevCenter';

const SEVERITY_FILTERS: (Severity | undefined)[] = [undefined, 'fatal', 'error', 'warning'];

export interface ErrorCenterScreenProps {
  transport?: DevCenterTransport;
  copy?: (text: string) => Promise<void>;
  now?: () => Date;
  selfTest?: SelfTestRunner;
}

async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

/** Tela "Central de Erros" (só em dev, doc 04): lista, filtros, detalhe e relatório. */
export function ErrorCenterScreen({
  transport = defaultDevCenter(),
  copy = copyToClipboard,
  now = () => new Date(),
  selfTest = defaultSelfTestRunner,
}: ErrorCenterScreenProps) {
  useDevCenterVersion(transport);
  // "Só novos" compara com a abertura anterior; abrir a tela marca tudo como visto.
  const [previousSeen] = useState(() => transport?.lastSeenAt() ?? null);
  useEffect(() => {
    void transport?.markSeen(now().toISOString());
    // Só na abertura da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [severity, setSeverity] = useState<Severity | undefined>();
  const [module, setModule] = useState<string | undefined>();
  const [onlyNew, setOnlyNew] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();

  if (!transport) {
    return (
      <Screen contentStyle={styles.screen}>
        <Text>A Central de Erros só existe no modo de desenvolvimento.</Text>
      </Screen>
    );
  }

  const all = transport.groups();
  const shown = filterGroups(all, {
    severity,
    module,
    onlyNew,
    lastSeenAt: previousSeen,
  });

  async function copyReport(text: string) {
    try {
      // Filtro de privacidade: sem URLs de servidor, pastas do usuário nem e-mails.
      await copy(sanitizeReport(text));
      setFeedback('Relatório copiado');
    } catch (error) {
      reportError('UI-002', error, { acao: 'copiar relatório' });
      setFeedback('Não foi possível copiar');
    }
  }

  const group = selected ? all.find((g) => g.fingerprint === selected) : undefined;
  if (group) {
    return (
      <GroupDetail
        group={group}
        feedback={feedback}
        onBack={() => setSelected(undefined)}
        onCopy={() => void copyReport(formatGroupReport(group))}
        onResolve={async () => {
          await transport.resolve(group.fingerprint);
          setSelected(undefined);
        }}
      />
    );
  }

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Central de Erros
      </Text>

      <View style={styles.row}>
        <Action label="Copiar tudo" onPress={() => void copyReport(formatAllReport(all))} />
        <Action label="Limpar tudo" onPress={() => void transport.clear()} />
        <SimulateErrorButton visible />
      </View>
      <SelfTestPanel runner={selfTest} />

      {feedback ? (
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}
      {transport.persistFailures > 0 ? (
        <Text style={styles.warning}>
          {transport.persistFailures === 1
            ? '1 erro não foi gravado no aparelho'
            : `${transport.persistFailures} erros não foram gravados no aparelho`}{' '}
          ({transport.lastPersistError}).
        </Text>
      ) : null}

      <View style={styles.row}>
        {SEVERITY_FILTERS.map((s) => (
          <Chip
            key={s ?? 'todas'}
            label={s ? SEVERITY_LABEL[s] : 'Todas'}
            selected={severity === s}
            onPress={() => setSeverity(s)}
          />
        ))}
        <Chip label="Só novos" selected={onlyNew} onPress={() => setOnlyNew((v) => !v)} />
      </View>
      <View style={styles.row}>
        <Chip
          label="Todos os módulos"
          selected={module === undefined}
          onPress={() => setModule(undefined)}
        />
        {modulesOf(all).map((m) => (
          <Chip
            key={m}
            label={m}
            accessibilityLabel={`Módulo ${m}`}
            selected={module === m}
            onPress={() => setModule(m)}
          />
        ))}
      </View>

      {all.length === 0 ? (
        <Text style={styles.empty}>Nenhum erro registrado</Text>
      ) : shown.length === 0 ? (
        <Text style={styles.empty}>Nenhum erro com esses filtros</Text>
      ) : (
        shown.map((g) => (
          <GroupRow key={g.fingerprint} group={g} onPress={() => setSelected(g.fingerprint)} />
        ))
      )}
    </Screen>
  );
}

function GroupRow({ group, onPress }: { group: ErrorGroup; onPress: () => void }) {
  const label = SEVERITY_LABEL[group.severity];
  const when = formatWhen(group.lastAt);
  const times = group.count === 1 ? '1 vez' : `${group.count} vezes`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${group.code}, ${label}, ${times}, última em ${when}`}
      onPress={onPress}
      style={[styles.item, { borderLeftColor: SEVERITY_COLOR[group.severity] }]}
    >
      <View style={styles.itemTop}>
        <Text style={styles.code}>{group.code}</Text>
        <Text style={styles.count}>x{group.count}</Text>
        <Text style={[styles.severity, { color: SEVERITY_COLOR[group.severity] }]}>{label}</Text>
        <Text style={styles.muted}>{group.module}</Text>
        <Text style={styles.muted}>{when}</Text>
      </View>
      <Text numberOfLines={2}>{group.lastEvent.message}</Text>
    </Pressable>
  );
}

function GroupDetail({
  group,
  feedback,
  onBack,
  onCopy,
  onResolve,
}: {
  group: ErrorGroup;
  feedback: string | undefined;
  onBack: () => void;
  onCopy: () => void;
  onResolve: () => Promise<void>;
}) {
  const e = group.lastEvent;
  return (
    <Screen scroll contentStyle={styles.screen}>
      <Action label="Voltar" onPress={onBack} />
      <Text accessibilityRole="header" style={styles.title}>
        {group.code} · {group.module}
      </Text>
      <Text style={[styles.severity, { color: SEVERITY_COLOR[group.severity] }]}>
        {SEVERITY_LABEL[group.severity]} · {group.count === 1 ? '1 vez' : `${group.count} vezes`} ·
        primeira em {formatWhen(group.firstAt)} · última em {formatWhen(group.lastAt)}
      </Text>
      <View style={styles.row}>
        <Action label="Copiar relatório" onPress={onCopy} />
        <Action label="Marcar como resolvido" onPress={() => void onResolve()} />
      </View>
      {feedback ? (
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}
      <Field label="Mensagem">
        <Text selectable>{e.message}</Text>
      </Field>
      <Field label="Contexto">
        <Text selectable style={styles.mono}>
          {e.context === undefined ? '(nenhum)' : JSON.stringify(e.context)}
        </Text>
      </Field>
      <Field label="Componentes (o que quebrou primeiro)">
        <Text selectable style={styles.mono}>
          {componentPath(e.componentStack) ?? '(não disponível)'}
        </Text>
      </Field>
      <Field label="Tela">
        <Text>{e.screen ?? '(desconhecida)'}</Text>
      </Field>
      <Field label="Versão">
        <Text>{e.appVersion}</Text>
      </Field>
      <Field label="Plataforma">
        <Text>{e.platform ?? '(desconhecida)'}</Text>
      </Field>
      <Field label="Trilha (mais recente por último)">
        {e.breadcrumbs.length === 0 ? <Text>(vazia)</Text> : null}
        {e.breadcrumbs.map((b, i) => (
          <Text key={i} style={styles.mono}>{`${b.category}:${b.message}`}</Text>
        ))}
      </Field>
      <Field label="Pilha">
        <Text selectable style={styles.mono}>
          {e.stack ? shortenBundleUrls(e.stack) : '(nenhuma)'}
        </Text>
      </Field>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.action}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Chip({
  label,
  accessibilityLabel,
  selected,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={selected ? styles.chipTextSelected : undefined}>{label}</Text>
    </Pressable>
  );
}

// Estilo provisório: os tokens do design "Caderno" entram na P0-S0-09.
const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
  },
  actionText: { fontWeight: '600' },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  chipSelected: { backgroundColor: '#111827' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  feedback: { fontWeight: '600' },
  warning: { color: '#B00020' },
  empty: { paddingVertical: 24, textAlign: 'center' },
  item: { borderLeftWidth: 6, paddingVertical: 8, paddingHorizontal: 12, gap: 4, minHeight: 44 },
  itemTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' },
  code: { fontWeight: '700' },
  count: { fontWeight: '600' },
  severity: { fontWeight: '600' },
  muted: { opacity: 0.7 },
  field: { gap: 4 },
  fieldLabel: { fontWeight: '700' },
  mono: { fontFamily: 'monospace', fontSize: 12 },
});
