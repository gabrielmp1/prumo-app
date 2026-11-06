// Catálogo de códigos da Central de Erros. Fonte única: todo código usado no app está aqui
// e na tabela do doc 04 (um teste confere que os dois batem). Código fora daqui é erro de tipo.

type CatalogSeverity = 'warning' | 'error' | 'fatal';

interface CodeInfo {
  severity: CatalogSeverity; // severidade padrão
  description: string;
  story: string; // história que criou o código
  userMessage?: string; // texto para o usuário, quando aplicável
}

export const CODES = {
  'APP-001': { severity: 'fatal', description: 'Exceção JS não tratada', story: 'P0-S0-04' },
  'APP-002': {
    severity: 'error',
    description: 'Promessa rejeitada sem tratamento',
    story: 'P0-S0-04',
  },
  'UI-001': {
    severity: 'fatal',
    description: 'Tela quebrou (ErrorBoundary)',
    story: 'P0-S0-04',
    userMessage: 'Algo deu errado nesta tela.',
  },
  'DAT-001': {
    severity: 'fatal',
    description: 'Falha ao abrir banco ou rodar migração',
    story: 'P0-S0-04',
  },
  'DAT-002': {
    severity: 'error',
    description: 'Dado inválido na leitura/escrita (zod)',
    story: 'P0-S0-04',
  },
  'DAT-003': { severity: 'error', description: 'Falha ao salvar item', story: 'P0-S0-04' },
  'PLN-001': {
    severity: 'error',
    description: 'Invariante do planejador quebrada durante plan()',
    story: 'P0-S0-04',
  },
  'PLN-002': {
    severity: 'error',
    description: 'Invariante quebrada durante schedule()',
    story: 'P0-S0-04',
  },
  'PLN-003': {
    severity: 'warning',
    description: 'Tarefa não cabe até o prazo (informativo, para estatística)',
    story: 'P0-S0-04',
  },
  'QAD-001': {
    severity: 'warning',
    description: 'Texto não reconhecido, virou tarefa genérica',
    story: 'P0-S0-04',
  },
  'NTF-001': { severity: 'error', description: 'Falha ao agendar notificação', story: 'P0-S0-04' },
  'NTF-002': {
    severity: 'warning',
    description: 'Permissão de notificação negada',
    story: 'P0-S0-04',
  },
  'FIL-001': { severity: 'error', description: 'Falha ao copiar/abrir anexo', story: 'P0-S0-04' },
  'PRF-001': {
    severity: 'warning',
    description: 'Operação acima do orçamento de tempo',
    story: 'P0-S0-04',
  },
} as const satisfies Record<string, CodeInfo>;

export type ErrorCode = keyof typeof CODES;

const MODULE_BY_PREFIX: Record<string, string> = {
  APP: 'app',
  UI: 'ui',
  DAT: 'data',
  PLN: 'planner',
  QAD: 'quickAdd',
  NTF: 'notifications',
  FIL: 'files',
  VOZ: 'voice',
  WID: 'widgets',
  FLT: 'floating',
  SHR: 'share',
  SYN: 'sync',
  AUT: 'auth',
  IA: 'ai',
  PAY: 'payments',
  WPP: 'whatsapp',
  PRF: 'performance',
  SEC: 'security',
  NET: 'network',
  TLS: 'tools',
  TUR: 'class',
};

/** Módulo do app a que o código pertence, pelo prefixo (doc 04). */
export function moduleOf(code: ErrorCode): string {
  const prefix = code.slice(0, code.indexOf('-'));
  return MODULE_BY_PREFIX[prefix] ?? 'app';
}

export function isErrorCode(value: string): value is ErrorCode {
  return Object.prototype.hasOwnProperty.call(CODES, value);
}
