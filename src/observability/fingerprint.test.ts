import { fingerprintOf, normalizeMessage } from './fingerprint';

// P0-S0-04 · agrupamento: mesmo código + mensagem sem números/ids = mesmo grupo.
describe('P0-S0-04 · impressão digital (fingerprint)', () => {
  it('troca números, uuids e ids hexadecimais por #', () => {
    expect(normalizeMessage('Falha ao salvar item 123')).toBe('Falha ao salvar item #');
    expect(
      normalizeMessage(
        'Item 9f1c2a7e-3b4d-4e5f-8a9b-0c1d2e3f4a5b sumiu às 14:40 do dia 2026-11-06',
      ),
    ).toBe('Item # sumiu às #:# do dia #-#-#');
    expect(normalizeMessage('hash a3f9c0d1e2b4 inválido')).toBe('hash # inválido');
  });

  it('junta espaços repetidos', () => {
    expect(normalizeMessage('  Falha   ao salvar ')).toBe('Falha ao salvar');
  });

  it('ignora diferença de espaços e de maiúsculas', () => {
    expect(fingerprintOf('DAT-003', '  Falha   AO salvar ')).toBe(
      fingerprintOf('DAT-003', 'falha ao salvar'),
    );
  });

  it('"Falha ao salvar item 123" e "… 456" têm a mesma impressão digital', () => {
    expect(fingerprintOf('DAT-003', 'Falha ao salvar item 123')).toBe(
      fingerprintOf('DAT-003', 'Falha ao salvar item 456'),
    );
  });

  it('códigos diferentes nunca se agrupam', () => {
    expect(fingerprintOf('DAT-003', 'Falha 1')).not.toBe(fingerprintOf('DAT-002', 'Falha 1'));
  });

  it('mensagens diferentes não se agrupam', () => {
    expect(fingerprintOf('DAT-003', 'Falha ao salvar')).not.toBe(
      fingerprintOf('DAT-003', 'Falha ao abrir'),
    );
  });
});
