/**
 * @jest-environment node
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

type JestJson = {
  testResults: {
    assertionResults: { title: string; status: string; failureMessages: string[] }[];
  }[];
};

// P0-S0-05 · prova de ponta a ponta: roda o Jest de verdade sobre um arquivo de exemplo
// e confere que o test/setup.ts faz falhar só o que foi reportado sem expectativa.
describe('P0-S0-05 · test/setup.ts na prática', () => {
  let resultados: Map<string, { status: string; mensagem: string }>;

  beforeAll(() => {
    const jest = path.join(ROOT, 'node_modules', 'jest', 'bin', 'jest.js');
    const execucao = spawnSync(
      process.execPath,
      [
        jest,
        '--testMatch',
        '**/test/fixtures/unexpected-errors.fixture.ts',
        '--json',
        '--coverage=false',
        '--ci',
      ],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } },
    );
    const json = JSON.parse(execucao.stdout) as JestJson;
    const testes = json.testResults.flatMap((r) => r.assertionResults);
    resultados = new Map(
      testes.map((t) => [t.title, { status: t.status, mensagem: t.failureMessages.join('\n') }]),
    );
  }, 120000);

  it('sem expectativa: o teste falha e a mensagem cita o código e a mensagem do erro', () => {
    const r = resultados.get('sem expectativa: erro reportado faz o teste falhar');
    expect(r?.status).toBe('failed');
    expect(r?.mensagem).toContain('Erros reportados sem expectativa');
    expect(r?.mensagem).toContain('DAT-003 (error) Falha ao salvar item 42');
  });

  it('com expectativa: o teste passa', () => {
    expect(resultados.get('com expectativa: erro reportado não faz o teste falhar')?.status).toBe(
      'passed',
    );
  });

  it('a expectativa não vaza para o teste seguinte', () => {
    const r = resultados.get('a expectativa vale só para o teste em que foi marcada');
    expect(r?.status).toBe('failed');
    expect(r?.mensagem).toContain('PLN-003 (warning)');
  });
});
