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
