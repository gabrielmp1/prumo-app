# 04 — Central de Erros

Durante o desenvolvimento e o teste fechado, todo erro, aviso e invariante quebrada aparece
**dentro do app**, numa tela própria. No lançamento, a mesma API passa a enviar para o Sentry,
que alerta a equipe. O código das funções não muda: só o "transporte".

## Objetivos

1. Nenhum erro silencioso. Todo `catch` reporta.
2. Cada erro tem um **código** que diz o módulo e o tipo (ex.: `PLN-003`), para achar a causa rápido.
3. Contexto suficiente para reproduzir: o que o usuário fez antes (trilha), versão, tela, dados relevantes.
4. Relatório copiável para colar no Claude Code (`/investigar-erro`).
5. Privacidade: em produção, nada de títulos, notas ou anexos do usuário sai do aparelho.

## API (src/observability)

```ts
type Severity = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

interface ErrorEvent {
  id: string;
  code: ErrorCode;            // do catálogo, ex. 'PLN-003'
  severity: Severity;
  message: string;            // técnico, para o desenvolvedor
  module: string;             // 'planner', 'data', 'notifications'...
  context?: Record<string, unknown>;
  stack?: string;
  breadcrumbs: Breadcrumb[];  // últimas 50 ações (navegação, toques, chamadas)
  screen?: string;
  appVersion: string;
  occurredAt: string;         // ISO
  fingerprint: string;        // code + message normalizada → agrupa repetidos
}

reportError(code, error, context?)          // severity 'error'
reportFatal(code, error, context?)          // erros que derrubaram a tela
reportWarning(code, message, context?)
check(condition, code, context?)            // invariante: em teste lança; em dev/prod reporta e segue
breadcrumb(category, message, data?)        // 'nav' | 'ui' | 'data' | 'net' | 'planner'
withReporting(code, fn)                     // embrulha função async: try/catch + report
measure(name, fn, budgetMs)                 // mede tempo; acima do orçamento → PRF-001
```

Detalhes da implementação (P0-S0-04, `src/observability`):
- `withReporting(code, fn, { fallback }?)` devolve uma nova função com os mesmos parâmetros.
  Em erro: reporta e repropaga o mesmo erro, ou devolve `fallback` se ele foi passado.
- `measure` aceita função síncrona ou assíncrona (mede até a promessa terminar). Se a função
  lança, o erro segue adiante e o tempo não é reportado. Contexto do `PRF-001`: `{ operacao, ms, orcamentoMs }`.
- `check` devolve a própria condição; em `dev`/`prod`, a falha é reportada com severidade `error`.
- `fingerprint` = `código|mensagem normalizada` (números, uuids e ids hexadecimais viram `#`;
  espaços e maiúsculas ignorados).
- Um transporte que falha não impede os outros de receber o evento.
- Para testes com relógio falso, `createErrorCenter({ now, monotonic, newId, ... })` cria uma
  instância isolada; o app usa a instância padrão exportada por `src/observability/index.ts`.

Transportes (`ErrorTransport`), escolhidos por `EXPO_PUBLIC_ERROR_MODE`:

| Modo | Transportes ativos | Uso |
|---|---|---|
| `test` | `TestTransport` (memória) | Jest — falha o teste em erro inesperado |
| `dev` | `DevCenterTransport` (SQLite `dev_error_log`) + `ConsoleTransport` | Desenvolvimento e teste fechado |
| `prod` | `SentryTransport` (com `scrub()`) + `DevCenterTransport` desligado | Lançamento |

Sem a variável: `test` no Jest, `dev` em desenvolvimento (`__DEV__`), `prod` no build final; valor
desconhecido cai nesse padrão. Até a P3-S13-03, o modo `prod` não tem transporte nenhum: nada sai do aparelho.

## Capturas automáticas (instaladas no Sprint 0)

- `ErrorBoundary` em volta de cada tela: mostra "Algo deu errado nesta tela. Tentar de novo" e reporta `UI-001` (fatal).
- `ErrorUtils.setGlobalHandler` para exceções JS não tratadas → `APP-001`.
- Promessas rejeitadas sem tratamento → `APP-002`.
- Falhas de validação zod em leitura/escrita → `DAT-002` (com o caminho do campo, sem o valor).
- Orçamento de desempenho estourado → `PRF-001`.

Como foi implementado (P0-S0-06):
- **ErrorBoundary por tela:** cada arquivo de rota em `app/` faz `export { ErrorBoundary } from
  '../src/features/errorCenter'` (recurso do Expo Router). Toda tela nova deve repetir essa linha.
  O layout raiz também exporta, para erros no próprio layout.
- **Exceções não tratadas:** o handler do `ErrorUtils` reporta `APP-001` (`fatal` quando o React
  Native diz que é fatal, senão `error`) e depois chama o handler original (tela vermelha em dev).
- **Promessas rejeitadas:** no React Native 0.88 elas não passam pelo `ErrorUtils`; o app religa o
  rastreador do Hermes (`HermesInternal.enablePromiseRejectionTracker`), reporta `APP-002` com
  `{ promiseId }` e mantém o aviso padrão do React Native.
- **Persistência:** banco próprio `prumo-dev-errors.db` (separado do banco principal, para conseguir
  guardar até um `DAT-001` do banco principal), tabela `dev_error_log` com um registro por grupo.
  O banco faz a contagem (`count = count + 1`), guarda a severidade mais grave e o último evento
  (JSON), e mantém no máximo 500 grupos (os mais antigos saem). Erros reportados antes de o banco
  abrir ficam numa fila e são gravados quando ele abre. Falha ao gravar não é reportada (seria um
  laço): fica contada no transporte (`persistFailures`) para a tela da Central mostrar.
- **Abertura do app:** `useErrorCenter()` no layout raiz instala as capturas, abre o banco (só em
  dev), carrega os erros anteriores e registra a tela atual e a trilha `nav` a cada rota.
  Se o banco não abrir: `DAT-001` e a Central segue só em memória.

## Tela "Central de Erros" (só em dev)

Acesso: Ajustes → tocar 5 vezes na versão, ou atalho no topo quando houver erros (selo vermelho com a contagem).

- **Lista agrupada por código**, com contagem, última ocorrência e severidade (cor + texto).
- Filtros: severidade, módulo, "só novos desde a última abertura".
- **Detalhe:** mensagem, pilha, contexto, trilha de ações, tela, versão.
- **Copiar relatório** (um erro ou todos): gera Markdown pronto para o Claude Code:
  ```
  ## Erro PLN-003 (x4) — planner
  Mensagem: ...
  Contexto: {...}
  Trilha: nav:/dia → ui:toque bloco → data:salvar tarefa ...
  Pilha: ...
  Versão: 0.3.0 (sprint 3) · Android 14
  ```
- **Rodar autodiagnóstico** (ver abaixo) e mostrar o resultado.
- **Marcar como resolvido** / **Limpar tudo**.
- **Gerar dados de exemplo** e **Simular erro** (para testar a própria central).

## Autodiagnóstico (`selfTest.ts`)

Roda na abertura do app (em segundo plano, modo dev) e sob demanda. Cada verificação é uma
função pura que recebe os dados reais e devolve problemas encontrados. Exemplos:

| Código | Verificação |
|---|---|
| `PLN-101` | Algum bloco planejado viola as invariantes do planejador (reusa `invariants.ts`) |
| `DAT-101` | Itens que não passam na validação zod (quarentena) |
| `DAT-102` | Anexos que apontam para arquivos que não existem mais |
| `NTF-101` | Compromisso com lembrete sem notificação agendada (ou notificação órfã) |
| `SYN-101` | (F2) Itens na fila de sincronização há mais de 24 h |
| `PRF-101` | `plan()` levou mais que o orçamento com os dados atuais |

Toda história que cria regra verificável **deve** adicionar sua verificação aqui (está no DoD).

## Catálogo de códigos (`src/observability/codes.ts`)

Prefixos por módulo. Cada código tem: severidade padrão, descrição, mensagem para o usuário
(quando aplicável) e a história que o criou.

| Prefixo | Módulo |
|---|---|
| `APP` | Ciclo de vida, erros globais |
| `UI` | Telas e componentes |
| `DAT` | Banco, migrações, validação |
| `PLN` | Planejador e encaixe |
| `QAD` | Adicionar rápido (parser) |
| `NTF` | Notificações e lembretes |
| `FIL` | Arquivos e anexos |
| `VOZ` | Reconhecimento de voz |
| `WID` | Widgets da tela inicial |
| `FLT` | Ícone flutuante |
| `SHR` | Compartilhar para o Prumo |
| `SYN` | Sincronização (F2) |
| `AUT` | Conta e login (F2) |
| `IA` | Captura e funções de IA (F2) |
| `PAY` | Cobrança (F3) |
| `WPP` | WhatsApp (F3) |
| `PRF` | Desempenho |
| `SEC` | Criptografia, chaves, bloqueio do app |
| `NET` | Camada de rede e consentimentos |
| `TLS` | Ferramentas de PDF e scanner |

Códigos iniciais (o Sprint 0 cria o arquivo com estes; cada história acrescenta os seus):

| Código | Sev. | Descrição |
|---|---|---|
| `APP-001` | fatal | Exceção JS não tratada |
| `APP-002` | error | Promessa rejeitada sem tratamento |
| `UI-001` | fatal | Tela quebrou (ErrorBoundary) |
| `DAT-001` | fatal | Falha ao abrir banco ou rodar migração |
| `DAT-002` | error | Dado inválido na leitura/escrita (zod) |
| `DAT-003` | error | Falha ao salvar item |
| `PLN-001` | error | Invariante do planejador quebrada durante `plan()` |
| `PLN-002` | error | Invariante quebrada durante `schedule()` |
| `PLN-003` | warning | Tarefa não cabe até o prazo (informativo, para estatística) |
| `QAD-001` | warning | Texto não reconhecido, virou tarefa genérica |
| `NTF-001` | error | Falha ao agendar notificação |
| `NTF-002` | warning | Permissão de notificação negada |
| `FIL-001` | error | Falha ao copiar/abrir anexo |
| `PRF-001` | warning | Operação acima do orçamento de tempo |

Códigos previstos pelas histórias (cada história os cria quando for implementada):

| Código | Sev. | Descrição | História |
|---|---|---|---|
| `APP-003` | error | Uma verificação do autodiagnóstico lançou exceção | P0-S0-08 |
| `APP-101` | autodiag. | Versão do banco diferente da esperada | P0-S0-08 |
| `DAT-101` | autodiag. | Itens em quarentena (inválidos) | P1-S1-02 |
| `DAT-102` | autodiag. | Anexo aponta para arquivo inexistente | P1-S4-03 |
| `DAT-103` | autodiag. | Versão do esquema diferente da esperada | P1-S1-01 |
| `FIL-101` | autodiag. | Arquivo na pasta do app sem anexo correspondente | P1-S4-03 |
| `PLN-004` | warning | Ocorrência com fim antes do início (corrigida para 60 min) | P1-S2-02 |
| `PLN-005` | error | Ação do usuário gerou bloco fixado no passado | P1-S6-02 |
| `PLN-006` | error | Fator de ritmo fora do limite 0,5–2,5 | P2-S8-03 |
| `PLN-101` | autodiag. | Plano atual viola invariantes do planejador | P1-S2-03 |
| `NTF-101` | autodiag. | Notificações agendadas diferentes das esperadas | P1-S6-01 |
| `PRF-101` | autodiag. | `plan()` acima do orçamento com os dados atuais | P1-S2-05 |
| `VOZ-001` / `VOZ-002` / `VOZ-003` | error / warning / warning | Falha do reconhecedor / permissão negada / aparelho sem serviço de voz | P2-S9-01 |
| `WID-001` / `WID-002` | error | Falha ao atualizar widget / ação do widget falhou | P1-S7-04, P2-S9-03 |
| `NTF-003` | error | Falha ao atualizar a notificação "Agora" | P2-S9-04 |
| `FLT-001` / `FLT-002` | error / warning | Bolha flutuante: falha ao exibir / permissão retirada | P3-S19-01 |
| `SHR-001` / `SHR-002` | warning / error | Conteúdo não suportado / falha ao copiar | P2-S9-02 |
| `AUT-001` | error | Falha de login | P2-S10-02 |
| `SYN-001` / `SYN-002` | error / info | Falha de envio / conflito resolvido | P2-S10-03 |
| `SYN-101` | autodiag. | Itens na fila de sincronização há mais de 24 h | P2-S10-03 |
| `FIL-002` | error | Falha de upload de anexo | P2-S10-04 |
| `IA-001` … `IA-004` | error/warning | API, resposta inválida, limite atingido, transcrição | P2-S11 |
| `PAY-001` / `PAY-002` | error | Falha de compra / assinatura inconsistente | P3-S13-01 |
| `TUR-001` / `TUR-002` | error | Falha ao publicar / conflito de cópia | P3-S15-02 |
| `WPP-001` … `WPP-003` | error | Envio, modelo rejeitado, processamento | P3-S17 |
| `SEC-001` | error | Falha de autenticação ao decifrar (dado alterado ou chave errada) | P1-S1-05 |
| `SEC-002` | fatal | Chave do banco indisponível no Keystore | P1-S1-05 |
| `SEC-101` | autodiag. | Arquivo de anexo sem cifra ou banco sem SQLCipher | P1-S1-05 |
| `NET-001` | error | Tentativa de rede com a função desligada (bloqueada) | P1-S1-06 |
| `SEC-003` | error | Falha ao gerar/recuperar chave mestra da sincronização | P2-S10-05 |
| `TLS-001` | error | Falha numa ferramenta de PDF/scanner | P2-S8-04 |

Códigos de autodiagnóstico usam a centena 1xx (ex.: `PLN-101`) e aparecem como "problema encontrado"
na Central, com severidade `warning`, a menos que a verificação diga outra.

## Passagem para produção (história P3-S13-03)

0. **Consentimento:** o app pergunta na primeira abertura se pode enviar relatórios técnicos de erro (alterável em Ajustes → Privacidade; bloqueado no Modo offline). Sem consentimento, nada sai do aparelho.
1. `EXPO_PUBLIC_ERROR_MODE=prod` no perfil de build de produção (EAS).
2. A tela da Central e o atalho somem do build (`if (__DEV_CENTER__)` + eliminação de código morto).
3. `SentryTransport` ativo, com:
   - `scrub()`: remove títulos, notas, nomes de arquivo, e-mails e telefones do contexto e da trilha;
     mantém só códigos, IDs, contagens, durações e nomes de telas.
   - Amostragem: 100% de `fatal` e `error`; 10% de `warning`.
   - `release` = versão do app; `environment` = `production`.
4. Alertas: regra no Sentry para `fatal` (imediato) e para erro novo (diário) → e-mail/Discord da equipe.
5. Botão **"Relatar um problema"** em Ajustes: o usuário descreve o que houve e, com consentimento
   explícito, envia o relatório da sessão (já filtrado).
6. Política de privacidade atualizada citando o Sentry como operador (LGPD).
7. Teste automatizado: em modo `prod`, `scrub()` remove os campos sensíveis (casos com título,
   e-mail, telefone, caminho de arquivo).
