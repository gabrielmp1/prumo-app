/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import { lintSnippets } from './tools/eslintRunner';
import { findForbiddenImports, listSourceFiles } from './tools/importScanner';

const ROOT = path.resolve(__dirname, '..');
const CORE = path.join(ROOT, 'src', 'core');

// P0-S0-02 · regra de arquitetura: src/core é puro (doc 02).
describe('P0-S0-02 · src/core não importa nada proibido', () => {
  describe('leitor de imports', () => {
    const arquivo = path.join(CORE, 'planner', 'plan.ts');

    it.each([
      ["import React from 'react';", 'react'],
      ["import { View } from 'react-native';", 'react-native'],
      ["import * as SQLite from 'expo-sqlite';", 'expo-sqlite'],
      ["import Constants from 'expo';", 'expo'],
      ["import { x } from '@expo/vector-icons';", '@expo/vector-icons'],
      [
        "import { itemsRepo } from '../../data/repositories/itemsRepo';",
        '../../data/repositories/itemsRepo',
      ],
      ["import { net } from '@/platform/net';", '@/platform/net'],
      ["export { Dia } from '../../features/dia';", '../../features/dia'],
      ["import { Button } from '@/ui/Button';", '@/ui/Button'],
      ["const fs = require('expo-file-system');", 'expo-file-system'],
      ["const m = await import('react-native');", 'react-native'],
    ])('acusa %s', (fonte, esperado) => {
      expect(findForbiddenImports(fonte, arquivo).map((v) => v.specifier)).toEqual([esperado]);
    });

    it.each([
      "import { addDays } from '../dates';",
      "import type { Task } from '../types';",
      "import fc from 'fast-check';",
      "import { check } from '@/observability';",
      "// import React from 'react';",
    ])('permite %s', (fonte) => {
      expect(findForbiddenImports(fonte, arquivo)).toEqual([]);
    });
  });

  it('nenhum arquivo de src/core tem import proibido', () => {
    const arquivos = listSourceFiles(CORE);
    expect(arquivos.length).toBeGreaterThan(0);

    const violacoes = arquivos.flatMap((arquivo) =>
      findForbiddenImports(fs.readFileSync(arquivo, 'utf8'), arquivo).map(
        (v) => `${path.relative(ROOT, arquivo)}: ${v.specifier}`,
      ),
    );
    expect(violacoes).toEqual([]);
  });

  describe('ESLint', () => {
    const REACT = "import React from 'react';\n\nexport const x = React;\n";
    const casos = {
      react: { file: 'src/core/exemplo.ts', code: REACT },
      expo: {
        file: 'src/core/exemplo.ts',
        code: "import * as SQLite from 'expo-sqlite';\n\nexport const x = SQLite;\n",
      },
      dataRelativo: {
        file: 'src/core/planner/exemplo.ts',
        code: "import { itemsRepo } from '../../data/repositories/itemsRepo';\n\nexport const x = itemsRepo;\n",
      },
      platformAlias: {
        file: 'src/core/exemplo.ts',
        code: "import { net } from '@/platform/net';\n\nexport const x = net;\n",
      },
      reactForaDoCore: { file: 'src/features/exemplo.ts', code: REACT },
      dateNow: {
        file: 'src/core/exemplo.ts',
        code: 'export const agora = (): number => Date.now();\n',
      },
    };
    let regras: Record<keyof typeof casos, string[]>;

    beforeAll(() => {
      const nomes = Object.keys(casos) as (keyof typeof casos)[];
      const resultado = lintSnippets(nomes.map((n) => casos[n]));
      regras = Object.fromEntries(nomes.map((n, i) => [n, resultado[i] ?? []])) as typeof regras;
    }, 60000);

    it.each(['react', 'expo', 'dataRelativo', 'platformAlias'] as const)(
      'barra import proibido em src/core (%s)',
      (caso) => {
        expect(regras[caso]).toContain('no-restricted-imports');
      },
    );

    it('não barra o mesmo import fora do core', () => {
      expect(regras.reactForaDoCore).not.toContain('no-restricted-imports');
    });

    it('barra Date.now() no core (o "agora" é sempre parâmetro)', () => {
      expect(regras.dateNow).toContain('no-restricted-properties');
    });
  });
});
