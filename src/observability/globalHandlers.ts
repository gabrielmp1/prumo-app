import type { ErrorCenter } from './center';

// Capturas globais (doc 04): exceção JS não tratada → APP-001; promessa rejeitada sem
// tratamento → APP-002. Os comportamentos padrão do React Native (tela vermelha e avisos
// em dev, encerramento em fatal) continuam: só acrescentamos o registro na Central.

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

export interface ErrorUtilsLike {
  getGlobalHandler(): GlobalHandler;
  setGlobalHandler(handler: GlobalHandler): void;
}

interface RejectionTrackerOptions {
  allRejections: boolean;
  onUnhandled: (id: number, rejection: unknown) => void;
  onHandled: (id: number) => void;
}

export interface HermesLike {
  enablePromiseRejectionTracker?: (options: RejectionTrackerOptions) => void;
}

export interface GlobalHandlerEnv {
  errorUtils?: ErrorUtilsLike;
  hermes?: HermesLike;
}

type ReportingCenter = Pick<ErrorCenter, 'reportFatal' | 'reportError'>;

/** O ambiente real: ErrorUtils do React Native e o rastreador de promessas do Hermes. */
export function defaultGlobalHandlerEnv(): GlobalHandlerEnv {
  const g = globalThis as { ErrorUtils?: ErrorUtilsLike; HermesInternal?: HermesLike };
  return { errorUtils: g.ErrorUtils, hermes: g.HermesInternal };
}

function rejectionMessage(id: number, rejection: unknown): string {
  const detail = rejection instanceof Error ? rejection.message : String(rejection);
  return `Uncaught (in promise, id: ${id}): "${detail}"`;
}

/** Instala as capturas. Devolve uma função que devolve o handler original de exceções. */
export function installGlobalHandlers(
  center: ReportingCenter,
  env: GlobalHandlerEnv = defaultGlobalHandlerEnv(),
): () => void {
  const { errorUtils, hermes } = env;
  if (!errorUtils) return () => undefined;

  const previous = errorUtils.getGlobalHandler();

  // Se o próprio registro falhar, não há onde registrar isso; o erro original segue para o
  // handler do React Native, que o mostra (tela vermelha em dev). Handler global nunca lança.
  const safely = (report: () => void) => {
    try {
      report();
    } catch {
      // Ver comentário acima.
    }
  };

  errorUtils.setGlobalHandler((error, isFatal) => {
    const fatal = isFatal === true;
    safely(() =>
      fatal
        ? center.reportFatal('APP-001', error, { isFatal: fatal })
        : center.reportError('APP-001', error, { isFatal: fatal }),
    );
    previous(error, isFatal);
  });

  hermes?.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (id, rejection) => {
      safely(() => center.reportError('APP-002', rejection, { promiseId: id }));
      // Mantém o aviso padrão do React Native ("Uncaught (in promise...)"), não fatal.
      previous(new Error(rejectionMessage(id, rejection), { cause: rejection }), false);
    },
    onHandled: () => undefined,
  });

  return () => errorUtils.setGlobalHandler(previous);
}
