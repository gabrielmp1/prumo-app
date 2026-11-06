import type { ErrorCode } from './codes';

// Normaliza a mensagem para agrupar repetições do mesmo erro com dados diferentes
// ("Falha ao salvar item 123" e "… 456" são o mesmo problema).
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const HEX_ID = /\b(?=[0-9a-f]*\d)[0-9a-f]{8,}\b/gi;
const NUMBER = /\d+/g;

export function normalizeMessage(message: string): string {
  return message
    .replace(UUID, '#')
    .replace(HEX_ID, '#')
    .replace(NUMBER, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fingerprintOf(code: ErrorCode, message: string): string {
  return `${code}|${normalizeMessage(message).toLowerCase()}`;
}
