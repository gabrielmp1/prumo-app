// Autodiagnóstico (doc 04): verificações automáticas sobre os dados REAIS do aparelho.
// Cada história que cria uma regra verificável registra aqui a sua verificação (DoD).
import type { ErrorCenter } from './center';
import { CODES, type CodeInfo, type SelfTestCode } from './codes';
import type { Context } from './types';

export type { SelfTestCode } from './codes';

/**
 * Dados reais lidos do aparelho antes da rodada. Cada história acrescenta o que a sua
 * verificação precisa; as verificações só leem (são funções puras).
 */
export interface SelfTestData {
  /** Banco da Central de Erros: versão gravada e versão esperada; null se não abriu. */
  devErrorDb: { version: number; expected: number } | null;
}

/** Problema encontrado por uma verificação. Vai para a Central com o código da verificação. */
export interface Problem {
  message: string;
  context?: Context;
}

export interface SelfTestCheck {
  code: SelfTestCode;
  name: string;
  run(data: SelfTestData): Problem[];
}

export type CheckStatus = 'ok' | 'problems' | 'failed';

export interface CheckResult {
  code: SelfTestCode;
  name: string;
  status: CheckStatus;
  problems: Problem[];
  ms: number;
  /** Mensagem do que a verificação lançou (só quando `status` é "failed"). */
  error?: string;
}

export interface SelfTestReport {
  startedAt: string; // ISO
  ms: number;
  results: CheckResult[];
}

export interface SelfTest {
  registerCheck(check: SelfTestCheck): void;
  checks(): readonly SelfTestCheck[];
  /** Roda todas as verificações. Nunca lança: verificação que lança vira APP-003. */
  run(data: SelfTestData): SelfTestReport;
}

export interface SelfTestOptions {
  center: ErrorCenter;
  now?: () => Date;
  /** Cronômetro em ms (não volta no tempo). */
  monotonic?: () => number;
}

function defaultMonotonic(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function isSelfTestCode(value: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(CODES, value)) return false;
  const info: CodeInfo = (CODES as Record<string, CodeInfo>)[value] as CodeInfo;
  return info.selfTest === true;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createSelfTest({
  center,
  now = () => new Date(),
  monotonic = defaultMonotonic,
}: SelfTestOptions): SelfTest {
  const registered: SelfTestCheck[] = [];

  function runOne(check: SelfTestCheck, data: SelfTestData): CheckResult {
    const start = monotonic();
    const base = { code: check.code, name: check.name };
    try {
      const problems = check.run(data);
      const ms = monotonic() - start;
      for (const problem of problems) {
        center.reportWarning(check.code, problem.message, problem.context);
      }
      return { ...base, status: problems.length > 0 ? 'problems' : 'ok', problems, ms };
    } catch (error) {
      const ms = monotonic() - start;
      // Uma verificação com defeito não pode derrubar o app nem impedir as outras.
      center.reportError('APP-003', error, { verificacao: check.code });
      return { ...base, status: 'failed', problems: [], ms, error: messageOf(error) };
    }
  }

  return {
    registerCheck(check) {
      // Erros de programação: lançam para aparecer já no teste de quem registrou.
      if (!isSelfTestCode(check.code)) {
        throw new Error(`${check.code} não é código de autodiagnóstico no catálogo (codes.ts)`);
      }
      if (registered.some((c) => c.code === check.code)) {
        throw new Error(`Já existe uma verificação com o código ${check.code}`);
      }
      registered.push(check);
    },

    checks() {
      return registered;
    },

    run(data) {
      const startedAt = now().toISOString();
      const start = monotonic();
      const results = registered.map((check) => runOne(check, data));
      return { startedAt, ms: monotonic() - start, results };
    },
  };
}
