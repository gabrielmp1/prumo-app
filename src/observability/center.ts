import { moduleOf, type ErrorCode } from './codes';
import { fingerprintOf } from './fingerprint';
import { RingBuffer } from './ringBuffer';
import type {
  Breadcrumb,
  BreadcrumbCategory,
  Context,
  ErrorEvent,
  ErrorMode,
  ErrorTransport,
  Severity,
} from './types';

const BREADCRUMB_LIMIT = 50;

/** Invariante quebrada em modo test: lança para o problema aparecer na hora (doc 03). */
export class InvariantViolation extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly context?: Context,
  ) {
    super(`Invariante quebrada: ${code}${context ? ` ${JSON.stringify(context)}` : ''}`);
    this.name = 'InvariantViolation';
  }
}

export interface ErrorCenterOptions {
  mode: ErrorMode;
  transports: ErrorTransport[];
  appVersion?: string;
  /** Relógio de parede (hora dos eventos). */
  now?: () => Date;
  /** Cronômetro em ms para o measure (não volta no tempo). */
  monotonic?: () => number;
  newId?: () => string;
}

export interface ErrorCenter {
  readonly mode: ErrorMode;
  readonly transports: readonly ErrorTransport[];
  reportError(code: ErrorCode, error: unknown, context?: Context): ErrorEvent;
  reportFatal(code: ErrorCode, error: unknown, context?: Context): ErrorEvent;
  reportWarning(code: ErrorCode, message: string, context?: Context): ErrorEvent;
  /** Invariante: em test lança; em dev/prod reporta e segue. Devolve a própria condição. */
  check(condition: boolean, code: ErrorCode, context?: Context): boolean;
  breadcrumb(category: BreadcrumbCategory, message: string, data?: Context): void;
  /** Embrulha uma função assíncrona: erro é reportado e repropagado, ou troca pelo `fallback`. */
  withReporting<A extends unknown[], R>(
    code: ErrorCode,
    fn: (...args: A) => Promise<R>,
    options?: { fallback: R },
  ): (...args: A) => Promise<R>;
  /** Mede o tempo de `fn`; acima do orçamento reporta PRF-001. Aceita função síncrona ou assíncrona. */
  measure<R>(name: string, fn: () => R, budgetMs: number): R;
  setScreen(screen: string | undefined): void;
}

function defaultNewId(): string {
  // Só precisa ser único no aparelho: hora + contador + aleatório.
  defaultNewId.counter = (defaultNewId.counter + 1) % 1_000_000;
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${defaultNewId.counter.toString(36)}-${random}`;
}
defaultNewId.counter = 0;

function defaultMonotonic(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

export function createErrorCenter(options: ErrorCenterOptions): ErrorCenter {
  const {
    mode,
    transports,
    appVersion = 'dev',
    now = () => new Date(),
    monotonic = defaultMonotonic,
    newId = defaultNewId,
  } = options;
  const trail = new RingBuffer<Breadcrumb>(BREADCRUMB_LIMIT);
  let screen: string | undefined;

  function emit(
    code: ErrorCode,
    severity: Severity,
    message: string,
    context?: Context,
    stack?: string,
  ): ErrorEvent {
    const event: ErrorEvent = {
      id: newId(),
      code,
      severity,
      message,
      module: moduleOf(code),
      ...(context !== undefined && { context }),
      ...(stack !== undefined && { stack }),
      breadcrumbs: trail.toArray(),
      ...(screen !== undefined && { screen }),
      appVersion,
      occurredAt: now().toISOString(),
      fingerprint: fingerprintOf(code, message),
    };
    for (const transport of transports) {
      try {
        transport.send(event);
      } catch {
        // Um transporte quebrado não pode derrubar o app nem impedir os outros.
        // Não há onde reportar sem risco de laço; os demais transportes já receberam o evento.
      }
    }
    return event;
  }

  const center: ErrorCenter = {
    mode,
    transports,

    reportError(code, error, context) {
      const { message, stack } = describeError(error);
      return emit(code, 'error', message, context, stack);
    },

    reportFatal(code, error, context) {
      const { message, stack } = describeError(error);
      return emit(code, 'fatal', message, context, stack);
    },

    reportWarning(code, message, context) {
      return emit(code, 'warning', message, context);
    },

    check(condition, code, context) {
      if (condition) return true;
      if (mode === 'test') throw new InvariantViolation(code, context);
      emit(code, 'error', `Invariante quebrada: ${code}`, context);
      return false;
    },

    breadcrumb(category, message, data) {
      trail.push({
        category,
        message,
        ...(data !== undefined && { data }),
        at: now().toISOString(),
      });
    },

    withReporting(code, fn, opts) {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          center.reportError(code, error);
          if (opts) return opts.fallback;
          throw error;
        }
      };
    },

    measure(name, fn, budgetMs) {
      const start = monotonic();
      const finish = () => {
        const ms = Math.round(monotonic() - start);
        if (ms > budgetMs) {
          emit('PRF-001', 'warning', `${name} levou ${ms} ms (orçamento ${budgetMs} ms)`, {
            operacao: name,
            ms,
            orcamentoMs: budgetMs,
          });
        }
      };
      const result = fn();
      if (isPromiseLike(result)) {
        // Mesma promessa, só que o tempo é conferido quando ela termina (se rejeitar, não mede).
        const timed: unknown = Promise.resolve(result).then((value) => {
          finish();
          return value;
        });
        return timed as typeof result;
      }
      finish();
      return result;
    },

    setScreen(next) {
      screen = next;
    },
  };
  return center;
}
