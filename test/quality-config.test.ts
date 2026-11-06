/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import { lintSnippets } from './tools/eslintRunner';

const ROOT = path.resolve(__dirname, '..');

type PackageJson = {
  scripts: Record<string, string>;
  jest: {
    coverageThreshold?: Record<string, { lines?: number; branches?: number }>;
    collectCoverageFrom?: string[];
  };
};

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as PackageJson;

describe('P0-S0-02 · qualidade automática', () => {
  it('cobertura de src/core tem limite de 90% em linhas e ramos', () => {
    expect(pkg.jest.coverageThreshold?.['./src/core/']).toEqual(
      expect.objectContaining({ lines: 90, branches: 90 }),
    );
    expect(pkg.jest.collectCoverageFrom).toEqual(expect.arrayContaining(['src/**/*.{ts,tsx}']));
  });

  it('scripts iguais aos do CLAUDE.md', () => {
    expect(pkg.scripts).toEqual(
      expect.objectContaining({
        typecheck: 'tsc --noEmit',
        lint: 'eslint .',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        e2e: 'maestro test e2e/',
        check: 'npm run typecheck && npm run lint && npm test',
      }),
    );
  });

  describe('ESLint aplica as regras do Definition of Done', () => {
    const casos: [nome: string, code: string, regra: string][] = [
      [
        'sem any',
        'export const x = (v: any): number => v;\n',
        '@typescript-eslint/no-explicit-any',
      ],
      [
        'sem @ts-ignore',
        '// @ts-ignore\nexport const x: number = 1;\n',
        '@typescript-eslint/ban-ts-comment',
      ],
      ['sem console.log', "console.log('oi');\n", 'no-console'],
      ['formatação do Prettier', 'export const x = {a:1}\n', 'prettier/prettier'],
    ];
    let regras: string[][] = [];

    beforeAll(() => {
      regras = lintSnippets(casos.map(([, code]) => ({ code, file: 'src/features/exemplo.ts' })));
    }, 60000);

    it.each(casos.map((c, i) => [c[0], c[2], i] as const))('%s', (_nome, regra, i) => {
      expect(regras[i]).toContain(regra);
    });
  });

  // Os tipos do Node existem no projeto por causa dos testes; o app roda no celular, sem Node.
  describe('módulos do Node só em testes e ferramentas', () => {
    const FS = "import fs from 'node:fs';\n\nexport const x = fs;\n";
    const PATH = "import path from 'path';\n\nexport const x = path;\n";
    const arquivos = [
      ['app/exemplo.tsx', FS, true],
      ['src/features/exemplo.ts', PATH, true],
      ['src/core/exemplo.ts', FS, true],
      ['test/exemplo.ts', FS, false],
      ['src/core/exemplo.test.ts', FS, false],
    ] as const;
    let regras: string[][] = [];

    beforeAll(() => {
      regras = lintSnippets(arquivos.map(([file, code]) => ({ file, code })));
    }, 60000);

    it.each(arquivos.map(([file, , barra], i) => [file, barra, i] as const))(
      '%s → barrado: %s',
      (_file, barra, i) => {
        expect(regras[i]?.includes('no-restricted-imports')).toBe(barra);
      },
    );
  });
});
