import fs from 'node:fs';
import path from 'node:path';

import { CODES, isErrorCode, moduleOf, type ErrorCode } from './codes';

// P0-S0-04 · catálogo de códigos (doc 04): fonte única, sempre igual ao que o doc 04 diz.
const DOC = fs.readFileSync(path.resolve(__dirname, '../../docs/04-central-de-erros.md'), 'utf8');

/** Linhas de tabela com um único código: `| \`XXX-000\` | severidade | ... |`. */
function codigosNoTrecho(inicio: string, fim?: string): Map<string, string> {
  const de = DOC.indexOf(inicio);
  const ate = fim ? DOC.indexOf(fim) : DOC.length;
  const tabela = new Map<string, string>();
  for (const linha of DOC.slice(de, ate).split('\n')) {
    const m = /^\|\s*`([A-Z]+-\d{3})`\s*\|\s*([\w.]+)\s*\|/.exec(linha);
    if (m?.[1] && m[2]) tabela.set(m[1], m[2]);
  }
  return tabela;
}

describe('P0-S0-04 · catálogo de códigos', () => {
  it('tem todos os códigos iniciais do doc 04, com a mesma severidade', () => {
    const iniciais = codigosNoTrecho('Códigos iniciais', 'Códigos previstos');
    expect(iniciais.size).toBe(14);
    for (const [codigo, severidade] of iniciais) {
      expect([codigo, CODES[codigo as ErrorCode]?.severity]).toEqual([codigo, severidade]);
    }
  });

  it('todo código do catálogo está documentado no doc 04 com a mesma severidade', () => {
    const documentados = codigosNoTrecho('Códigos iniciais');
    for (const [codigo, info] of Object.entries(CODES)) {
      // Autodiagnóstico aparece no doc como "autodiag." (P0-S0-08).
      const noDoc = 'selfTest' in info && info.selfTest ? 'autodiag.' : info.severity;
      expect([codigo, documentados.get(codigo)]).toEqual([codigo, noDoc]);
    }
  });

  it('P0-S0-08 · códigos de autodiagnóstico: severidade aviso e centena 1xx', () => {
    const autodiag = Object.entries(CODES).filter(([, info]) => 'selfTest' in info);
    expect(autodiag.map(([codigo]) => codigo)).toContain('APP-101');
    for (const [codigo, info] of autodiag) {
      expect([codigo, info.severity]).toEqual([codigo, 'warning']);
      expect(codigo).toMatch(/^[A-Z]+-1\d{2}$/);
    }
  });

  it('P0-S0-08 · APP-003: verificação do autodiagnóstico que lançou exceção', () => {
    expect(CODES['APP-003']).toMatchObject({ severity: 'error', story: 'P0-S0-08' });
    expect(CODES['APP-101']).toMatchObject({ story: 'P0-S0-08' });
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
