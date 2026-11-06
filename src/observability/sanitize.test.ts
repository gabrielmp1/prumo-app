import { sanitizeReport, shortenBundleUrls } from './sanitize';

const BUNDLE =
  'http://9vsclq0-anonymous-8081.exp.direct/node_modules/expo-router/entry.bundle//&platform=android&dev=true&hot=false&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable';

// Relatório mais limpo: a URL do bundle vira "bundle:linha:coluna".
describe('shortenBundleUrls', () => {
  it('troca a URL do bundle por "bundle:linha:coluna" dentro da pilha', () => {
    expect(shortenBundleUrls(`    at SimulatedCrash (${BUNDLE}:100374:20)`)).toBe(
      '    at SimulatedCrash (bundle:100374:20)',
    );
  });

  it('funciona com várias linhas e sem parênteses', () => {
    const pilha = `at a (${BUNDLE}:1:2)\nat ${BUNDLE}:3:4`;
    expect(shortenBundleUrls(pilha)).toBe('at a (bundle:1:2)\nat bundle:3:4');
  });

  it('não mexe no resto do texto', () => {
    expect(shortenBundleUrls('at plan (plan.ts:10:5)')).toBe('at plan (plan.ts:10:5)');
  });
});

// Filtro de privacidade do relatório: obrigatório antes de enviar erros ao servidor (P3-S13-03).
describe('sanitizeReport', () => {
  it.each([
    ['URL de servidor', 'falhou em https://api.prumo.app/v1/sync?token=abc', 'falhou em <url>'],
    ['URL do Expo', 'abrindo exp://9vsclq0-anonymous-8081.exp.direct agora', 'abrindo <url> agora'],
    ['URL entre parênteses', 'at x (http://192.168.0.5:8081/index.js:1:2)', 'at x (<url>)'],
    [
      'caminho do Windows',
      'em C:\\Users\\ggabr\\Projetos\\prumo-app\\src\\x.ts',
      'em <usuário>\\Projetos\\prumo-app\\src\\x.ts',
    ],
    ['caminho do Windows com /', 'em C:/Users/ggabr/x.ts', 'em <usuário>/x.ts'],
    ['caminho do Linux', 'em /home/maria/prumo/x.ts', 'em <usuário>/prumo/x.ts'],
    ['caminho do Mac', 'em /Users/joao/prumo/x.ts', 'em <usuário>/prumo/x.ts'],
    ['e-mail', 'login de maria.silva+teste@gmail.com falhou', 'login de <e-mail> falhou'],
  ])('remove %s', (_nome, entrada, saida) => {
    expect(sanitizeReport(entrada)).toBe(saida);
  });

  it('URL do bundle vira "bundle:linha:coluna" (não some)', () => {
    expect(sanitizeReport(`at x (${BUNDLE}:7:8)`)).toBe('at x (bundle:7:8)');
  });

  it('mantém o que ajuda a investigar: códigos, telas, horários, nomes de componentes', () => {
    const texto =
      '## Erro UI-001 (x2) — ui\nTela: /dia\nÚltima vez: 06/11 14:10 (UTC-3) · 2026-11-06T17:10:07Z\nComponentes: SimulatedCrash > View';
    expect(sanitizeReport(texto)).toBe(texto);
  });
});
