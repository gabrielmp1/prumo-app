import type { ErrorEvent, ErrorTransport, Severity } from '../types';

export interface ConsoleSink {
  debug(text: string, ...details: unknown[]): void;
  info(text: string, ...details: unknown[]): void;
  warn(text: string, ...details: unknown[]): void;
  error(text: string, ...details: unknown[]): void;
}

const LEVEL: Record<Severity, keyof ConsoleSink> = {
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  fatal: 'error',
};

/** Mostra os eventos no terminal do Metro durante o desenvolvimento. Único lugar com console. */
export class ConsoleTransport implements ErrorTransport {
  readonly name = 'console';

  constructor(private readonly sink: ConsoleSink = console) {}

  send(event: ErrorEvent): void {
    const text = `[${event.code}] ${event.severity} · ${event.module} · ${event.message}`;
    if (event.context === undefined) {
      this.sink[LEVEL[event.severity]](text);
    } else {
      this.sink[LEVEL[event.severity]](text, event.context);
    }
  }
}
