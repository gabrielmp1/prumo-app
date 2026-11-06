import { shortenBundleUrls } from '../../observability/sanitize';
import type { Breadcrumb, ErrorGroup } from '../../observability/types';
import { componentPath, formatLocalAndUtc } from './format';

// "Copiar relatório" (doc 04): Markdown pronto para colar no Claude Code com /investigar-erro.

const MAX_TRAIL = 10;
const MAX_STACK_LINES = 15;

function formatTrail(trail: Breadcrumb[]): string {
  if (trail.length === 0) return '(vazia)';
  const shown = trail.slice(-MAX_TRAIL).map((b) => `${b.category}:${b.message}`);
  const hidden = trail.length - shown.length;
  return [...(hidden > 0 ? [`(+${hidden} anteriores)`] : []), ...shown].join(' → ');
}

function formatStack(stack: string | undefined): string[] {
  if (!stack) return ['Pilha: (nenhuma)'];
  const lines = shortenBundleUrls(stack).split('\n');
  const shown = lines.slice(0, MAX_STACK_LINES);
  const hidden = lines.length - shown.length;
  return ['Pilha:', '```', ...shown, ...(hidden > 0 ? [`    … (+${hidden} linhas)`] : []), '```'];
}

/** "0.3.0" → sprint 3 (as versões seguem a tag da sprint, v0.<sprint>.0). */
function formatVersion(appVersion: string, platform: string | undefined): string {
  const sprint = /^\d+\.(\d+)\./.exec(appVersion)?.[1];
  const version = sprint === undefined ? appVersion : `${appVersion} (sprint ${sprint})`;
  return `${version} · ${platform ?? 'plataforma desconhecida'}`;
}

export function formatGroupReport(group: ErrorGroup): string {
  const e = group.lastEvent;
  return [
    `## Erro ${group.code} (x${group.count}) — ${group.module}`,
    `Severidade: ${group.severity}`,
    `Primeira vez: ${formatLocalAndUtc(group.firstAt)}`,
    `Última vez: ${formatLocalAndUtc(group.lastAt)}`,
    `Mensagem: ${e.message}`,
    `Contexto: ${e.context === undefined ? '(nenhum)' : JSON.stringify(e.context)}`,
    `Tela: ${e.screen ?? '(desconhecida)'}`,
    `Componentes: ${componentPath(e.componentStack) ?? '(não disponível)'}`,
    `Trilha: ${formatTrail(e.breadcrumbs)}`,
    ...formatStack(e.stack),
    `Versão: ${formatVersion(e.appVersion, e.platform)}`,
  ].join('\n');
}

export function formatAllReport(groups: ErrorGroup[]): string {
  const title = `# Relatório da Central de Erros (${groups.length} grupos)`;
  if (groups.length === 0) return `${title}\n\nNenhum erro registrado.`;
  return [title, ...groups.map(formatGroupReport)].join('\n\n');
}
