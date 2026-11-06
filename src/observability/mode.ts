import { ConsoleTransport } from './transports/consoleTransport';
import { DevCenterTransport } from './transports/devCenterTransport';
import { TestTransport } from './transports/testTransport';
import type { ErrorMode, ErrorTransport } from './types';

const MODES: readonly ErrorMode[] = ['test', 'dev', 'prod'];

export interface ModeEnv {
  EXPO_PUBLIC_ERROR_MODE?: string;
  NODE_ENV?: string;
}

/** EXPO_PUBLIC_ERROR_MODE manda; sem ela: test no Jest, dev em desenvolvimento, prod no build final. */
export function resolveMode(env: ModeEnv, isDev: boolean): ErrorMode {
  const explicit = MODES.find((m) => m === env.EXPO_PUBLIC_ERROR_MODE);
  if (explicit) return explicit;
  if (env.NODE_ENV === 'test') return 'test';
  return isDev ? 'dev' : 'prod';
}

export function transportsFor(mode: ErrorMode): ErrorTransport[] {
  switch (mode) {
    case 'test':
      return [new TestTransport()];
    case 'dev':
      return [new DevCenterTransport(), new ConsoleTransport()];
    case 'prod':
      // Nada sai do aparelho até o Sentry com consentimento (P3-S13-03).
      return [];
  }
}
