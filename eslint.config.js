// ESLint do Prumo: base da Expo (React, hooks, imports, React Native) + recomendadas do
// TypeScript + Prettier, mais as regras do Definition of Done e a regra de arquitetura do core.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const tseslint = require('typescript-eslint');

const TS_FILES = ['**/*.{ts,tsx}'];
const APP_FILES = ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'];
const TEST_FILES = ['**/*.test.{ts,tsx}'];

// O app roda no celular, sem Node. Os tipos do Node existem só por causa dos testes.
const nodeBuiltins = {
  regex:
    '^(node:.*|fs|path|os|child_process|crypto|http|https|net|stream|url|util|worker_threads)(/.*)?$',
  message: 'Módulos do Node não existem no celular: use só em testes e ferramentas.',
};

// src/core é puro: sem React, sem Expo, sem I/O (doc 02). O teste test/architecture.test.ts
// confere o mesmo resolvendo os caminhos de verdade.
const coreRestrictedImports = [
  {
    regex: '^(react|react-native)(/.*)?$',
    message: 'src/core é puro: não importe React nem React Native.',
  },
  {
    regex: '^(expo|expo-[^/]+|@expo/[^/]+)(/.*)?$',
    message: 'src/core é puro: não importe módulos da Expo.',
  },
  {
    regex: '^(@/|(\\.\\./)+)(data|platform|features|ui)(/.*)?$',
    message: 'src/core não depende de data, platform, features nem ui: eles é que usam o core.',
  },
  {
    regex: '^(\\.\\./)+app(/.*)?$',
    message: 'src/core não depende das telas.',
  },
];

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.expo/**', 'coverage/**', 'docs/**', 'node_modules/**', 'expo-env.d.ts'],
  },
  expoConfig,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: TS_FILES })),
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: TS_FILES,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    files: APP_FILES,
    ignores: TEST_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: [nodeBuiltins] }],
    },
  },
  {
    // Repete nodeBuiltins: no ESLint, a configuração que vem depois substitui a regra inteira.
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...coreRestrictedImports, nodeBuiltins] }],
    },
  },
  {
    // Testes do core podem usar Node, mas continuam sem React/Expo/data.
    files: ['src/core/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: coreRestrictedImports }],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message: 'No core, o "agora" chega sempre como parâmetro (ADR-003).',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'No core, o "agora" chega sempre como parâmetro (ADR-003).',
        },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  prettierRecommended,
]);
