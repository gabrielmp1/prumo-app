import fs from 'node:fs';
import path from 'node:path';

import { CODES, isErrorCode, moduleOf, type ErrorCode } from './codes';

// P0-S0-04 · catálogo de códigos (doc 04): fonte única, igual à tabela de códigos iniciais.
function tabelaDoDoc04(): Map<string, string> {
  const doc = fs.readFileSync(path.resolve(__dirname, '../../docs/04-central-de-erros.md'), 'utf8');
  const inicio = doc.indexOf('Códigos iniciais');
  const fim = doc.indexOf('Códigos previstos');
  const linhas = doc.slice(inicio, fim).split('\n');
  const tabela = new Map<string, string>();
  for (const linha of linhas) {
    const m = /^\|\s*`([A-Z]+-\d{3})`\s*\|\s*(\w+)\s*\|/.exec(linha);
    if (m?.[1] && m[2]) tabela.set(m[1], m[2]);
  }
  return tabela;
}

describe('P0-S0-04 · catálogo de códigos', () => {
  it('tem exatamente os códigos iniciais do doc 04, com a mesma severidade', () => {
    const doc = tabelaDoDoc04();
    expect(doc.size).toBeGreaterThanOrEqual(14);
    const catalogo = new Map(Object.entries(CODES).map(([c, info]) => [c, info.severity]));
    expect(catalogo).toEqual(doc);
  });

  it('cada código tem descrição, módulo e a história que o criou', () => {
    for (const info of Object.values(CODES)) {
      expect(info.description.length).toBeGreaterThan(0);
      expect(info.story).toMatch(/^P\d-S\d+-\d{2}$/);
    }
  });

  it('o módulo vem do prefixo do código', () => {
    expect(moduleOf('PLN-003')).toBe('planner');
    expect(moduleOf('DAT-001')).toBe('data');
    expect(moduleOf('UI-001')).toBe('ui');
    expect(moduleOf('PRF-001')).toBe('performance');
  });

  it('reconhece em tempo de execução só códigos do catálogo', () => {
    expect(isErrorCode('PLN-003')).toBe(true);
    expect(isErrorCode('PLN-999')).toBe(false);
    expect(isErrorCode('qualquer coisa')).toBe(false);
  });

  it('código fora do catálogo é erro de tipo', () => {
    const valido: ErrorCode = 'APP-001';
    // @ts-expect-error: 'XYZ-123' não está no catálogo; o tsc falha se este erro sumir.
    const invalido: ErrorCode = 'XYZ-123';
    expect([valido, invalido]).toHaveLength(2);
  });
});
