/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

function ler(arquivo: string): string {
  const completo = path.join(ROOT, arquivo);
  return fs.existsSync(completo) ? fs.readFileSync(completo, 'utf8') : '';
}

// P0-S0-03 · integração contínua no GitHub (doc 03, seção "Integração contínua").
describe('P0-S0-03 · workflow de CI', () => {
  const ci = ler('.github/workflows/ci.yml');

  it('existe em .github/workflows/ci.yml', () => {
    expect(ci).not.toBe('');
  });

  it('roda em todo push e pull request', () => {
    expect(ci).toMatch(/^on:\s*\n(\s+.*\n)*?\s+push:/m);
    expect(ci).toMatch(/^on:\s*\n(\s+.*\n)*?\s+pull_request:/m);
  });

  it('usa a mesma versão do Node do desenvolvimento (24)', () => {
    expect(ci).toMatch(/node-version:\s*['"]?24['"]?/);
  });

  it('instala, verifica tipos, lint e testes com cobertura, nessa ordem', () => {
    const passos = ['npm ci', 'npm run typecheck', 'npm run lint', 'npm run test:coverage'].map(
      (cmd) => ci.indexOf(`run: ${cmd}`),
    );
    expect(passos.every((i) => i >= 0)).toBe(true);
    expect([...passos].sort((a, b) => a - b)).toEqual(passos);
  });

  it('analisa vulnerabilidades das dependências do app (doc 07)', () => {
    expect(ci).toContain('run: npm audit --omit=dev --audit-level=high');
  });

  it('publica o relatório de cobertura como artefato, mesmo se os testes falharem', () => {
    expect(ci).toMatch(/uses:\s*actions\/upload-artifact@v\d+/);
    expect(ci).toMatch(/path:\s*coverage\//);
    expect(ci).toMatch(/if:\s*\$\{\{\s*always\(\)\s*\}\}/);
  });

  it('só pede permissão de leitura do repositório', () => {
    expect(ci).toMatch(/^permissions:\s*\n\s+contents:\s*read/m);
  });
});

describe('P0-S0-03 · README', () => {
  const readme = ler('README.md');

  it('tem o selo de status da CI', () => {
    expect(readme).toMatch(
      /\[!\[CI\]\(https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/workflows\/ci\.yml\/badge\.svg\)\]/,
    );
  });

  it('documenta a proteção da branch main exigindo a CI verde', () => {
    expect(readme).toMatch(/## Proteção da branch main/);
    expect(readme).toMatch(/verificação `ci`/);
  });
});
