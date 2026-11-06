// API pública da Central de Erros (doc 04). O resto do app importa daqui.
import { createErrorCenter } from './center';
import { resolveMode, transportsFor } from './mode';
import { createSelfTest } from './selfTest';
import { DEFAULT_CHECKS } from './selfTestChecks';

const mode = resolveMode(
  {
    // Lido pelo nome completo: o Expo troca EXPO_PUBLIC_* pelo valor na hora do build.
    EXPO_PUBLIC_ERROR_MODE: process.env.EXPO_PUBLIC_ERROR_MODE,
    NODE_ENV: process.env.NODE_ENV,
  },
  typeof __DEV__ !== 'undefined' && __DEV__,
);

export const errorCenter = createErrorCenter({ mode, transports: transportsFor(mode) });

/** Autodiagnóstico do app, já com as verificações padrão registradas (P0-S0-08). */
export const selfTest = createSelfTest({ center: errorCenter });
for (const selfCheck of DEFAULT_CHECKS) selfTest.registerCheck(selfCheck);

export const reportError = errorCenter.reportError;
export const reportFatal = errorCenter.reportFatal;
export const reportWarning = errorCenter.reportWarning;
export const check = errorCenter.check;
export const breadcrumb = errorCenter.breadcrumb;
export const withReporting = errorCenter.withReporting;
export const measure = errorCenter.measure;

export { CODES, isErrorCode, type ErrorCode } from './codes';
export { InvariantViolation, type ErrorCenter } from './center';
export type { Breadcrumb, BreadcrumbCategory, ErrorEvent, ErrorTransport, Severity } from './types';
export type {
  CheckResult,
  Problem,
  SelfTest,
  SelfTestCheck,
  SelfTestData,
  SelfTestReport,
} from './selfTest';
