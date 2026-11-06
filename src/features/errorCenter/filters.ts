import type { ErrorGroup, Severity } from '../../observability/types';

export interface GroupFilter {
  severity?: Severity;
  module?: string;
  onlyNew?: boolean;
  /** Última abertura da Central (ISO); null = nunca abriu, tudo é novo. */
  lastSeenAt?: string | null;
}

export function filterGroups(groups: ErrorGroup[], filter: GroupFilter): ErrorGroup[] {
  const since = filter.lastSeenAt ?? null;
  return groups.filter(
    (g) =>
      (filter.severity === undefined || g.severity === filter.severity) &&
      (filter.module === undefined || g.module === filter.module) &&
      (!filter.onlyNew || since === null || g.lastAt > since),
  );
}

export function modulesOf(groups: ErrorGroup[]): string[] {
  return [...new Set(groups.map((g) => g.module))].sort();
}

/**
 * Conta toques seguidos (acesso escondido à Central). Devolve true no toque que completa a
 * sequência; toques com intervalo maior que `windowMs` recomeçam a contagem.
 */
export function createTapCounter({
  taps,
  windowMs,
  now = Date.now,
}: {
  taps: number;
  windowMs: number;
  now?: () => number;
}): () => boolean {
  let count = 0;
  let last = Number.NEGATIVE_INFINITY;
  return () => {
    const t = now();
    count = t - last > windowMs ? 1 : count + 1;
    last = t;
    if (count >= taps) {
      count = 0;
      last = Number.NEGATIVE_INFINITY;
      return true;
    }
    return false;
  };
}
