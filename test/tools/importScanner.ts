import fs from 'node:fs';
import path from 'node:path';

// Varre imports de um arquivo do src/core e aponta os proibidos pela regra de arquitetura (doc 02).
// Complementa o ESLint: aqui o caminho relativo é resolvido de verdade, sem depender de padrões.

const ROOT = path.resolve(__dirname, '..', '..');
const FORBIDDEN_PACKAGES = /^(react|react-native|expo|expo-[^/]+|@expo\/[^/]+)(\/.*)?$/;
const FORBIDDEN_DIRS = ['src/data', 'src/platform', 'src/features', 'src/ui', 'app'].map((d) =>
  path.join(ROOT, d),
);

// import/export ... from 'x' · import 'x' · require('x') · import('x')
const SPECIFIER =
  /(?:\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?|\bexport\s+[^'"]*?\s+from\s+|\brequire\s*\(\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g;

export type ImportViolation = { specifier: string };

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function resolveLocal(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('@/')) return path.join(ROOT, 'src', specifier.slice(2));
  if (specifier.startsWith('.')) return path.resolve(path.dirname(fromFile), specifier);
  return null;
}

function isInside(target: string, dir: string): boolean {
  const rel = path.relative(dir, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export function findForbiddenImports(source: string, filePath: string): ImportViolation[] {
  const violations: ImportViolation[] = [];
  for (const match of stripComments(source).matchAll(SPECIFIER)) {
    const specifier = match[1];
    if (!specifier) continue;
    const local = resolveLocal(specifier, filePath);
    const forbidden = local
      ? FORBIDDEN_DIRS.some((dir) => isInside(local, dir))
      : FORBIDDEN_PACKAGES.test(specifier);
    if (forbidden) violations.push({ specifier });
  }
  return violations;
}

/** Arquivos .ts/.tsx de um diretório, recursivamente. */
export function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}
