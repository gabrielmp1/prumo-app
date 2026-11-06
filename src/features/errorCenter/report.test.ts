import type { ErrorGroup } from '../../observability/types';
import { formatAllReport, formatGroupReport } from './report';

function grupo(parcial: Partial<ErrorGroup> = {}): ErrorGroup {
  return {
    fingerprint: 'PLN-003|tarefa não cabe até o prazo',
    code: 'PLN-003',
    module: 'planner',
    severity: 'warning',
    count: 4,
    firstAt: '2026-11-06T09:00:00.000Z',
    lastAt: '2026-11-06T10:00:00.000Z',
    lastEvent: {
      id: 'e4',
      code: 'PLN-003',
      severity: 'warning',
      message: 'Tarefa não cabe até o prazo',
      module: 'planner',
      context: { tarefas: 2, dia: '2026-11-06' },
      stack:
        'Error: Tarefa não cabe até o prazo\n    at plan (http://9vsclq0-anonymous-8081.exp.direct/node_modules/expo-router/entry.bundle//&platform=android&dev=true:100374:20)\n    at run (x.ts:1:1)',
      componentStack:
        '\n    in SimulatedCrash (at SimulateErrorButton.tsx:20)\n    in SimulateErrorButton\n    in RCTView (created by View)\n    in View',
      breadcrumbs: [
        { category: 'nav', message: '/dia', at: '2026-11-06T09:58:00.000Z' },
        { category: 'ui', message: 'toque bloco', at: '2026-11-06T09:59:00.000Z' },
        { category: 'data', message: 'salvar tarefa', at: '2026-11-06T09:59:30.000Z' },
      ],
      screen: '/dia',
      appVersion: '0.3.0',
      platform: 'Android 14',
      occurredAt: '2026-11-06T10:00:00.000Z',
      fingerprint: 'PLN-003|tarefa não cabe até o prazo',
    },
    ...parcial,
  };
}

// P0-S0-07 · "Copiar relatório": Markdown pronto para colar no Claude Code (doc 04).
describe('P0-S0-07 · relatório da Central de Erros', () => {
  it('um grupo: saída exata', () => {
    expect(formatGroupReport(grupo())).toBe(
      [
        '## Erro PLN-003 (x4) — planner',
        'Severidade: warning',
        'Primeira vez: 06/11 06:00 (UTC-3) · 2026-11-06T09:00:00Z',
        'Última vez: 06/11 07:00 (UTC-3) · 2026-11-06T10:00:00Z',
        'Mensagem: Tarefa não cabe até o prazo',
        'Contexto: {"tarefas":2,"dia":"2026-11-06"}',
        'Tela: /dia',
        'Componentes: SimulatedCrash > SimulateErrorButton > RCTView > View',
        'Trilha: nav:/dia → ui:toque bloco → data:salvar tarefa',
        'Pilha:',
        '```',
        'Error: Tarefa não cabe até o prazo',
        '    at plan (bundle:100374:20)',
        '    at run (x.ts:1:1)',
        '```',
        'Versão: 0.3.0 (sprint 3) · Android 14',
      ].join('\n'),
    );
  });

  it('sem contexto, tela, trilha, pilha ou plataforma: diz isso em vez de omitir', () => {
    const base = grupo();
    const vazio = grupo({
      count: 1,
      lastEvent: {
        ...base.lastEvent,
        context: undefined,
        stack: undefined,
        componentStack: undefined,
        screen: undefined,
        platform: undefined,
        breadcrumbs: [],
        appVersion: '0.0.1',
      },
    });
    const texto = formatGroupReport(vazio);
    expect(texto).toContain('## Erro PLN-003 (x1) — planner');
    expect(texto).toContain('Contexto: (nenhum)');
    expect(texto).toContain('Tela: (desconhecida)');
    expect(texto).toContain('Componentes: (não disponível)');
    expect(texto).toContain('Trilha: (vazia)');
    expect(texto).toContain('Pilha: (nenhuma)');
    expect(texto).toContain('Versão: 0.0.1 (sprint 0) · plataforma desconhecida');
  });

  it('trilha longa: mostra as 10 últimas ações e quantas ficaram de fora', () => {
    const base = grupo();
    const muitas = Array.from({ length: 14 }, (_, i) => ({
      category: 'ui' as const,
      message: `toque ${i + 1}`,
      at: '2026-11-06T09:00:00.000Z',
    }));
    const texto = formatGroupReport(
      grupo({ lastEvent: { ...base.lastEvent, breadcrumbs: muitas } }),
    );
    expect(texto).toContain('Trilha: (+4 anteriores) → ui:toque 5 → ');
    expect(texto).toContain('ui:toque 14\n');
  });

  it('pilha longa: corta em 15 linhas', () => {
    const base = grupo();
    const stack = Array.from({ length: 30 }, (_, i) => `linha ${i + 1}`).join('\n');
    const texto = formatGroupReport(grupo({ lastEvent: { ...base.lastEvent, stack } }));
    expect(texto).toContain('linha 15\n    … (+15 linhas)\n```');
    expect(texto).not.toContain('linha 16');
  });

  it('pilha de componentes no formato "at" (React 19) também vira lista de nomes', () => {
    const base = grupo();
    const componentStack =
      '\n    at SimulatedCrash (http://x/entry.bundle:1:2)\n    at View (<anonymous>)';
    const texto = formatGroupReport(grupo({ lastEvent: { ...base.lastEvent, componentStack } }));
    expect(texto).toContain('Componentes: SimulatedCrash > View\n');
  });

  it('pilha de componentes longa: 8 nomes e quantos ficaram de fora', () => {
    const base = grupo();
    const componentStack = Array.from({ length: 11 }, (_, i) => `    in C${i + 1}`).join('\n');
    const texto = formatGroupReport(grupo({ lastEvent: { ...base.lastEvent, componentStack } }));
    expect(texto).toContain('Componentes: C1 > C2 > C3 > C4 > C5 > C6 > C7 > C8 > … (+3)\n');
  });

  it('BUG-002 · horário local com fuso e UTC sem milissegundos', () => {
    const texto = formatGroupReport(
      grupo({ firstAt: '2026-11-06T17:10:07.123Z', lastAt: '2026-11-06T17:10:07.123Z' }),
    );
    expect(texto).toContain('Última vez: 06/11 14:10 (UTC-3) · 2026-11-06T17:10:07Z');
  });

  it('todos: título com a quantidade e um bloco por grupo, separados por linha em branco', () => {
    const a = grupo();
    const b = grupo({ code: 'DAT-003', module: 'data', fingerprint: 'DAT-003|x', count: 1 });
    expect(formatAllReport([a, b])).toBe(
      `# Relatório da Central de Erros (2 grupos)\n\n${formatGroupReport(a)}\n\n${formatGroupReport(b)}`,
    );
  });

  it('todos, sem erros', () => {
    expect(formatAllReport([])).toBe(
      '# Relatório da Central de Erros (0 grupos)\n\nNenhum erro registrado.',
    );
  });
});
