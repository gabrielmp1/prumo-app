import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(__dirname, 'lint-snippets.cjs');

export type Snippet = { code: string; file: string };

/** Lista as regras violadas em cada trecho, como se cada um fosse o arquivo `file` do projeto. */
export function lintSnippets(snippets: Snippet[]): string[][] {
  const input = JSON.stringify(
    snippets.map((s) => ({ code: s.code, filePath: path.join(ROOT, s.file) })),
  );
  const result = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, input, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`ESLint falhou ao rodar: ${result.stderr || String(result.error)}`);
  }
  return JSON.parse(result.stdout) as string[][];
}
