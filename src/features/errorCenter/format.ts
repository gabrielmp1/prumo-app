import type { Severity } from '../../observability/types';

export const SEVERITY_LABEL: Record<Severity, string> = {
  fatal: 'Fatal',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Info',
  debug: 'Depuração',
};

// Cor só reforça: a severidade sempre aparece também em texto (acessibilidade).
// Provisório até os tokens do design "Caderno" (P0-S0-09).
export const SEVERITY_COLOR: Record<Severity, string> = {
  fatal: '#B00020',
  error: '#C2410C',
  warning: '#A16207',
  info: '#1D4ED8',
  debug: '#4B5563',
};

const two = (n: number) => String(n).padStart(2, '0');

/** "2026-11-06T13:05:00.000Z" → "06/11 10:05" no fuso do aparelho. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** Fuso do aparelho naquele instante: "UTC-3", "UTC+5:30", "UTC". */
export function utcOffsetLabel(iso: string): string {
  const minutes = -new Date(iso).getTimezoneOffset();
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '-';
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `UTC${sign}${h}${m ? `:${two(m)}` : ''}`;
}

/** "06/11 14:10 (UTC-3) · 2026-11-06T17:10:07Z": hora local para ler, UTC para comparar. */
export function formatLocalAndUtc(iso: string): string {
  const utc = new Date(iso).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return `${formatWhen(iso)} (${utcOffsetLabel(iso)}) · ${utc}`;
}

const MAX_COMPONENTS = 5;

// Componentes que não são nossos: primitivos do React Native e peças internas do React,
// do Expo Router e da navegação. Só ajudam a achar o erro os componentes do app.
const INTERNAL_NAMES = new Set([
  'View',
  'Text',
  'Image',
  'ScrollView',
  'FlatList',
  'SectionList',
  'TextInput',
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Modal',
  'KeyboardAvoidingView',
  'StatusBar',
  'ActivityIndicator',
  'Suspense',
  'Fragment',
  'StrictMode',
  'Unknown',
  'Anonymous',
  'Route',
  'Try',
  'ExpoRoot',
  'Slot',
  'Stack',
  'Link',
  'SceneView',
  'CellRenderer',
  'AppContainer',
  'LogBoxStateSubscription',
]);

const INTERNAL_PATTERNS = [
  /^RCT/, // componentes nativos do React Native (RCTView, RCTText...)
  /^RNS/, // react-native-screens
  /^RNC/, // bibliotecas da comunidade (ex.: react-native-safe-area-context)
  /^Animated/,
  /^Virtualized/,
  /^Native/,
  /^Base[A-Z]/,
  /^With[A-Z]/,
  /Provider(Compat)?$/,
  /Context$/,
  /Navigator$/,
  /Navigation[A-Z]?\w*$/,
  /^Screen(Stack|Container|ContentWrapper)/,
  /^Debugging/,
];

function isInternal(name: string): boolean {
  return INTERNAL_NAMES.has(name) || INTERNAL_PATTERNS.some((p) => p.test(name));
}

/**
 * Pilha de componentes do React ("in X (at ...)" ou "at X (...)") → "X > Y > Z", do componente
 * que quebrou para fora, só com os componentes do app (até 5). Undefined se não sobrar nenhum.
 */
export function componentPath(componentStack: string | undefined): string | undefined {
  if (!componentStack) return undefined;
  const names = componentStack
    .split('\n')
    .map((line) => /^\s*(?:in|at)\s+([^\s(]+)/.exec(line)?.[1])
    .filter((name): name is string => name !== undefined && !isInternal(name))
    .filter((name, i, all) => name !== all[i - 1]);
  if (names.length === 0) return undefined;
  const shown = names.slice(0, MAX_COMPONENTS);
  const hidden = names.length - shown.length;
  return [...shown, ...(hidden > 0 ? [`… (+${hidden})`] : [])].join(' > ');
}
