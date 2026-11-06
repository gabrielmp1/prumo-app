import type { SelfTestCheck } from './selfTest';

// Verificações do autodiagnóstico que já existem. Cada história acrescenta a sua aqui.

/** APP-101 · o banco da Central de Erros está na versão de esquema que o app espera. */
export const devErrorDbVersionCheck: SelfTestCheck = {
  code: 'APP-101',
  name: 'Versão do banco da Central de Erros',
  run({ devErrorDb }) {
    // Banco que não abriu já foi reportado como DAT-001 na abertura do app.
    if (!devErrorDb || devErrorDb.version === devErrorDb.expected) return [];
    const { version, expected } = devErrorDb;
    return [
      {
        message: `Banco da Central de Erros na versão ${version}; o app espera a versão ${expected}`,
        context: { versao: version, esperada: expected },
      },
    ];
  },
};

export const DEFAULT_CHECKS: readonly SelfTestCheck[] = [devErrorDbVersionCheck];
