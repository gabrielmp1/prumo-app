import * as fc from 'fast-check';

import { DEFAULT_CHECKS, devErrorDbVersionCheck } from './selfTestChecks';

// P0-S0-08 · verificação de exemplo APP-101: versão do banco da Central igual à esperada.
describe('P0-S0-08 · APP-101 · versão do banco da Central de Erros', () => {
  it('versão igual à esperada: nenhum problema', () => {
    expect(devErrorDbVersionCheck.run({ devErrorDb: { version: 1, expected: 1 } })).toEqual([]);
  });

  it('versão diferente (ex.: app antigo abrindo banco mais novo): um problema com as duas versões', () => {
    expect(devErrorDbVersionCheck.run({ devErrorDb: { version: 2, expected: 1 } })).toEqual([
      {
        message: 'Banco da Central de Erros na versão 2; o app espera a versão 1',
        context: { versao: 2, esperada: 1 },
      },
    ]);
  });

  it('banco da Central não abriu: sem problema aqui (a abertura já reportou DAT-001)', () => {
    expect(devErrorDbVersionCheck.run({ devErrorDb: null })).toEqual([]);
  });

  it('propriedade: há problema se, e somente se, as versões são diferentes', () => {
    fc.assert(
      fc.property(fc.nat(1000), fc.nat(1000), (version, expected) => {
        const problemas = devErrorDbVersionCheck.run({ devErrorDb: { version, expected } });
        expect(problemas).toHaveLength(version === expected ? 0 : 1);
      }),
    );
  });

  it('faz parte das verificações padrão do app, com código e nome', () => {
    expect(DEFAULT_CHECKS).toContain(devErrorDbVersionCheck);
    expect(devErrorDbVersionCheck.code).toBe('APP-101');
    expect(devErrorDbVersionCheck.name).toBe('Versão do banco da Central de Erros');
  });
});
