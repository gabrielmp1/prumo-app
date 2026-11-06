import * as fc from 'fast-check';

import { fromMinutes, toMinutes } from './time';

// P0-S0-02 · exemplo do core: horas "HH:MM" ↔ minutos desde 00:00 (usado pelo encaixe do dia).
describe('toMinutes', () => {
  it.each([
    ['00:00', 0],
    ['07:00', 420],
    ['14:40', 880],
    ['23:59', 1439],
    ['24:00', 1440],
  ])('converte %s em %i minutos', (hora, minutos) => {
    expect(toMinutes(hora)).toBe(minutos);
  });

  it.each(['', '7:00', '07:0', '07h00', '25:00', '12:60', '24:01', ' 07:00', 'aa:bb'])(
    'devolve null para hora inválida %p',
    (hora) => {
      expect(toMinutes(hora)).toBeNull();
    },
  );
});

describe('fromMinutes', () => {
  it.each([
    [0, '00:00'],
    [420, '07:00'],
    [885, '14:45'],
    [1440, '24:00'],
  ])('converte %i minutos em %s', (minutos, hora) => {
    expect(fromMinutes(minutos)).toBe(hora);
  });

  it.each([-1, 1441, 7.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'devolve null para %p minutos',
    (minutos) => {
      expect(fromMinutes(minutos)).toBeNull();
    },
  );
});

describe('propriedades', () => {
  it('ida e volta: toMinutes(fromMinutes(m)) === m para todo m entre 0 e 1440', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1440 }), (m) => {
        const hora = fromMinutes(m);
        return hora !== null && toMinutes(hora) === m;
      }),
    );
  });
});
