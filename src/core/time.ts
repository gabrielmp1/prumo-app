// Horas do dia como "HH:MM" (convenção do doc de algoritmos) ↔ minutos desde 00:00.
// "24:00" é aceito porque o período da noite e o fim do dia podem terminar à meia-noite.

const HHMM = /^(\d{2}):(\d{2})$/;
const DAY_MINUTES = 24 * 60;

/** "14:40" → 880. Devolve null se o texto não for uma hora válida entre 00:00 e 24:00. */
export function toMinutes(hhmm: string): number | null {
  const match = HHMM.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59) return null;
  const total = hours * 60 + minutes;
  return total > DAY_MINUTES ? null : total;
}

/** 885 → "14:45". Devolve null fora de 0–1440 ou se não for um número inteiro. */
export function fromMinutes(total: number): string | null {
  if (!Number.isInteger(total) || total < 0 || total > DAY_MINUTES) return null;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
