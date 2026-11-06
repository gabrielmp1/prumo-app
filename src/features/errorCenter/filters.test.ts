import type { ErrorGroup, Severity } from '../../observability/types';
import { createTapCounter, filterGroups, modulesOf } from './filters';

function grupo(code: ErrorGroup['code'], severity: Severity, module: string, lastAt: string) {
  return { fingerprint: `${code}|${lastAt}`, code, severity, module, lastAt } as ErrorGroup;
}

const grupos = [
  grupo('UI-001', 'fatal', 'ui', '2026-11-06T12:00:00.000Z'),
  grupo('DAT-003', 'error', 'data', '2026-11-06T11:00:00.000Z'),
  grupo('PLN-003', 'warning', 'planner', '2026-11-06T09:00:00.000Z'),
  grupo('DAT-002', 'error', 'data', '2026-11-06T08:00:00.000Z'),
];

// P0-S0-07 · filtros da Central: severidade, módulo e "só novos".
describe('P0-S0-07 · filtros', () => {
  it('sem filtro: tudo', () => {
    expect(filterGroups(grupos, {})).toHaveLength(4);
  });

  it('por severidade', () => {
    expect(filterGroups(grupos, { severity: 'error' }).map((g) => g.code)).toEqual([
      'DAT-003',
      'DAT-002',
    ]);
  });

  it('por módulo', () => {
    expect(filterGroups(grupos, { module: 'planner' }).map((g) => g.code)).toEqual(['PLN-003']);
  });

  it('só novos desde a última abertura', () => {
    const r = filterGroups(grupos, { onlyNew: true, lastSeenAt: '2026-11-06T10:00:00.000Z' });
    expect(r.map((g) => g.code)).toEqual(['UI-001', 'DAT-003']);
  });

  it('só novos sem abertura anterior: tudo é novo', () => {
    expect(filterGroups(grupos, { onlyNew: true, lastSeenAt: null })).toHaveLength(4);
  });

  it('filtros combinados', () => {
    const r = filterGroups(grupos, {
      severity: 'error',
      module: 'data',
      onlyNew: true,
      lastSeenAt: '2026-11-06T10:00:00.000Z',
    });
    expect(r.map((g) => g.code)).toEqual(['DAT-003']);
  });

  it('lista os módulos presentes, sem repetir, em ordem alfabética', () => {
    expect(modulesOf(grupos)).toEqual(['data', 'planner', 'ui']);
  });
});

// P0-S0-07 · acesso escondido: 5 toques na versão, em sequência.
describe('P0-S0-07 · contador de toques', () => {
  function relogio() {
    let ms = 0;
    return { now: () => ms, passar: (d: number) => (ms += d) };
  }

  it('libera no 5º toque seguido', () => {
    const r = relogio();
    const tocar = createTapCounter({ taps: 5, windowMs: 3000, now: r.now });
    const resultados = [1, 2, 3, 4, 5].map(() => {
      r.passar(300);
      return tocar();
    });
    expect(resultados).toEqual([false, false, false, false, true]);
  });

  it('toques espaçados demais recomeçam a contagem', () => {
    const r = relogio();
    const tocar = createTapCounter({ taps: 5, windowMs: 3000, now: r.now });
    for (let i = 0; i < 4; i++) tocar();
    r.passar(5000);
    expect(tocar()).toBe(false);
  });

  it('depois de liberar, recomeça do zero', () => {
    const r = relogio();
    const tocar = createTapCounter({ taps: 2, windowMs: 3000, now: r.now });
    tocar();
    expect(tocar()).toBe(true);
    expect(tocar()).toBe(false);
  });
});
