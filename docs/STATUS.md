# Quadro do projeto

> Atualizado pelo Claude Code ao fim de cada história. Limite: 1 história em "Fazendo".
> IDs e detalhes em `docs/backlog/`.

**Sprint atual:** S0 — Projeto, qualidade e Central de Erros
**Meta da sprint:** antes de qualquer função, o projeto já testa, verifica e mostra erros sozinho.

## A fazer (em ordem)

- [ ] P0-S0-09 · Tokens de design e componentes base
- [ ] P0-S0-10 · ADRs e STATUS (incluir ADR-007 a ADR-009 de segurança)

## Fazendo

_(vazio)_

## Revisão

- [ ] P0-S0-08 · Esqueleto do Autodiagnóstico (branch `feat/P0-S0-08-self-test` enviada; **aguardando CI verde** para ir a Feito; **E2E pendente de rodar**)

## Feito

- [x] P0-S0-01 · Criar o projeto Expo com TypeScript strict (2026-11-05; conferida no Samsung pelo Expo Go, SDK 58, via túnel)
- [x] P0-S0-02 · Qualidade automática: lint, formatação, testes, cobertura (2026-11-05)
- [x] P0-S0-03 · Integração contínua no GitHub (2026-11-06; CI verde na branch antes de juntar; CI da `main` verde)
- [x] P0-S0-04 · Núcleo da Central de Erros (2026-11-06; CI verde na branch)
- [x] P0-S0-05 · Testes falham em erro inesperado (2026-11-06; CI verde na branch)
- [x] P0-S0-06 · Capturas globais e persistência (2026-11-06; CI verde na branch; **E2E pendente de rodar**)
- [x] P0-S0-07 · Tela da Central de Erros (2026-11-06; CI verde na branch; **E2E pendente de rodar**; conferida no Samsung)
- [x] BUG-002 · Área segura em todas as telas + relatório da Central mais limpo e filtrado (2026-11-06; CI verde na branch; conferido no Samsung)

## Bugs

_(formato: `BUG-001 · descrição · código de erro · história relacionada · status`)_

- BUG-001 · Jest (jest-expo) quebra quando o caminho da pasta tem parênteses, ex. `Nova pasta (9)`: o mock automático lê o caminho pelo rastro de pilha · ambiente · P0-S0-01 · **resolvido** em 2026-11-05 (causa: parênteses no caminho da pasta; projeto copiado para `C:\Users\ggabr\Projetos\prumo-app`, onde `npm ci` e `npm run check` passaram)
- BUG-002 · Título da Central de Erros ficava por baixo da barra de status do Android (relógio em cima do título); as demais telas tinham o mesmo risco · — · P0-S0-07 · **resolvido** em 2026-11-06, conferido no Samsung (causa: telas sem área segura; agora todas usam `src/ui/Screen`, com `react-native-safe-area-context`; teste de regressão em `test/safeArea.test.tsx`)

## Observações de ambiente (não são bugs do app)

- 2026-11-05 · Expo Go no Samsung conectava pelo QR, mas mostrava `java.io.IOException: Failed to download remote update`: o celular não conseguia baixar o bundle do PC pela rede local (firewall do Windows ou isolamento do Wi-Fi). Solução: `npx expo start --tunnel ngrok`, com `@expo/ngrok` como dependência de desenvolvimento do projeto (sem instalação global). No SDK 58, `--tunnel` sozinho exige login na conta Expo. Dica registrada no README.

## Ideias (não entram na sprint sem passar pelo planejamento)

- Integração com calendário do Moodle (assinatura iCal) — avaliar na Fase 3
- Planejar pela energia usando dados de sono do relógio — depende de acesso aos dados da Samsung
- Painel próprio na borda da Samsung — investigar na P3-S19-02 (hoje: atalhos no painel de apps da borda)
- Registrar na trilha da Central os toques em botões (`breadcrumb('ui', ...)`), não só a navegação: hoje a trilha mostra só `nav:/`. Fazer quando existirem botões de verdade (Sprint 3), de preferência num componente de botão base que registre sozinho (P0-S0-09 cria os componentes)

## Anotações para histórias futuras

- **P0-S0-09** · No modo escuro do celular, os ícones da barra de status ficam quase invisíveis (claros sobre fundo claro): hoje o `StatusBar` usa `style="auto"`, que segue o tema do **sistema**. Ele precisa seguir o tema do **app** (fundo claro → ícones escuros; fundo escuro → ícones claros). Ver `app/_layout.tsx`. Visto no Samsung em 2026-11-06.
- **P1-S1-01** · Ao criar o banco principal, registrar a verificação `DAT-103` (versão do esquema) do mesmo jeito que o `APP-101`: campo novo em `SelfTestData`, leitura em `loadSelfTestData()` e verificação em `selfTestChecks.ts` (doc 04, "Como foi implementado (P0-S0-08)").

## Decisões e pendências

- 2026-11-05 · Design escolhido: "Caderno" (estrutura da Opção 1 + identidade da Opção 4). Ver `docs/referencia/design.md`.
- 2026-11-05 · Tema escuro: versão B (botões cor de giz, sem amarelo, grifado lavanda). Versão 1 guardada como alternativa.
- 2026-11-05 · Versões instaladas (P0-S0-01): Expo SDK 58 (`expo` 58.0.23), React Native 0.88.1, React 19.3.0, TypeScript 6.0, Expo Router 58.0, Jest 30.5 + jest-expo 58, React Native Testing Library 14.1. Entram no ADR-001 (P0-S0-10).
- 2026-11-05 · Rotas ficam em `app/` na raiz, como no doc 02 (o modelo do SDK 58 usa `src/app/`; o Expo Router aceita os dois).
- 2026-11-05 · ESLint mínimo (`eslint-config-expo`) já instalado na P0-S0-01 para o `npm run check` funcionar desde o início; as regras do projeto entram na P0-S0-02.
- 2026-11-05 · `react-dom` 19.3.0 instalado só para fechar a dependência do Expo Router (web) com a mesma versão do `react`; sem ele o npm não resolve as dependências.
- 2026-11-05 · Padrões combinados: 9 ADRs (001 a 009) na P0-S0-10; branches locais por história até a CI existir (P0-S0-03); `.gitattributes` com quebra de linha LF; pacotes só locais e justificados no commit.
- 2026-11-05 · P0-S0-02 · ESLint = base da Expo (React, hooks, imports, React Native) + recomendadas do `typescript-eslint` + Prettier (`eslint-plugin-prettier`). Regras do DoD viram erro: `any`, `@ts-ignore`, `console`. Prettier: aspas simples, 100 colunas, LF. `npm run format` corrige o que der automaticamente.
- 2026-11-05 · P0-S0-02 · Regra de arquitetura em dois lugares: ESLint (`no-restricted-imports` em `src/core`) e `test/architecture.test.ts`, que resolve os caminhos de verdade. Além do que a história pede, o core também fica sem `ui`/`app` e sem `Date.now()`/`new Date()` (o "agora" é parâmetro, doc 02).
- 2026-11-05 · P0-S0-02 · `@types/node` entrou por causa das ferramentas de teste; para o app não usar Node por engano, módulos do Node (`fs`, `path`, `node:*`…) são barrados pelo ESLint em `app/` e `src/` (fora dos testes).
- 2026-11-05 · P0-S0-02 · Os testes que conferem regras do ESLint rodam o ESLint num processo separado (`test/tools/lint-snippets.cjs`): o ESLint carrega a configuração com `import()` dinâmico, que o Jest não suporta.
- 2026-11-05 · P0-S0-02 · Exemplo do core: `src/core/time.ts` (`toMinutes`/`fromMinutes`, "HH:MM" ↔ minutos, com teste de propriedade). Será usado pelo encaixe do dia (`schedule`).
- 2026-11-05 · P0-S0-02 · Cobertura medida em `src/**` e `app/**`; limite de 90% (linhas e ramos) só em `src/core`. Conferido que cai abaixo do limite → `npm run test:coverage` falha.
- 2026-11-06 · P0-S0-04 · Central de Erros em `src/observability`: catálogo `codes.ts` (14 códigos iniciais, conferido contra a tabela do doc 04 por teste), `createErrorCenter` (instância isolada, com relógios injetáveis) e instância padrão em `index.ts`. Transportes em `transports/` (`testTransport`, `consoleTransport`, `devCenterTransport` em memória; SQLite na P0-S0-06). O modo `prod` não tem transporte até a P3-S13-03. `ConsoleTransport` é o único lugar que escreve no console.
- 2026-11-06 · P0-S0-05 · `test/setup.ts` (em `jest.setupFilesAfterEnv`) pega o `TestTransport` da instância padrão e, depois de cada teste, falha se houve erro reportado sem `expectReportedError(código)`; a expectativa vale só para o teste atual. `expectReportedError` é global nos testes, como `expect`. Prova de ponta a ponta em `test/setup.behavior.test.ts`, que roda o Jest sobre `test/fixtures/unexpected-errors.fixture.ts` (arquivo que só roda nesse teste).
- 2026-11-06 · P0-S0-06 · Central de Erros grava num banco próprio (`prumo-dev-errors.db`, tabela `dev_error_log`), separado do banco principal, com SQL direto (sem Drizzle): é uma tabela só de desenvolvimento e não deve depender do banco principal abrir. O Drizzle entra com o banco principal (P1-S1-01).
- 2026-11-06 · P0-S0-06 · Testes de integração usam o SQLite que vem no Node 24 (`node:sqlite`, em `test/tools/nodeSqlite.ts`) com a mesma interface do `expo-sqlite` (`src/data/sql.ts`): o mesmo SQL roda no teste e no celular, sem dependência nova.
- 2026-11-06 · P0-S0-06 · Toda tela nova em `app/` deve ter `export { ErrorBoundary } from '../src/features/errorCenter'`. O botão "Simular erro" (discreto, no rodapé da tela inicial) só aparece em modo dev.
- 2026-11-06 · P0-S0-06 · No React Native Testing Library 14, `fireEvent` é assíncrono: sempre `await fireEvent.press(...)` (sem o `await`, um teste contamina o seguinte).
- 2026-11-06 · P0-S0-07 · Central de Erros: rota `/dev/erros` protegida por `Stack.Protected` (só dev), selo vermelho de erros novos na tela inicial, Ajustes provisório com 5 toques na versão. Novo código `UI-002` (falha numa ação da Central, ex. copiar). Dependência nova: `expo-clipboard`. "Rodar autodiagnóstico" fica desativado até a P0-S0-08; "Gerar dados de exemplo" fica para o banco principal (Sprint 1).
- 2026-11-06 · P0-S0-07 · Testes rodam com fuso fixo `America/Sao_Paulo` (`test/globalSetup.js`): horários na tela não dependem do computador nem da CI.
- 2026-11-06 · P0-S0-07 · Os tipos das rotas (`typedRoutes`) são gerados em `.expo/types` quando o `expo start` roda. Ao criar uma rota nova, rode o Expo uma vez antes do `npm run check`, senão o `tsc` local reclama da rota nova (na CI essa pasta não existe e não há problema).
- 2026-11-06 · BUG-002 · Toda tela usa `Screen` (`src/ui/Screen.tsx`), que respeita a área segura (barra de status, entalhe, barra de navegação). A tela inicial passou para `src/features/home` (regra: `app/` só fala com `features`).
- 2026-11-06 · BUG-002 · Relatório da Central: horário local com fuso e UTC, pilha de componentes ("Componentes: A > B > C", vinda de `error.componentStack`, que o React Native anexa) e URL do bundle encurtada (`bundle:linha:coluna`). O texto copiado passa por `sanitizeReport()` (`src/observability/sanitize.ts`), que remove URLs de servidor, pastas do usuário e e-mails; uso obrigatório no envio ao servidor (P3-S13-03).
- 2026-11-06 · P0-S0-08 · Autodiagnóstico: `createSelfTest` em `src/observability/selfTest.ts` e verificações em `selfTestChecks.ts`. Verificações são puras e recebem `SelfTestData`, lido antes da rodada por `loadSelfTestData()` (`src/features/errorCenter/selfTestRunner.ts`). Problema → aviso na Central com o código da verificação; verificação que lança → `APP-003`; falha ao ler os dados → `DAT-001`. Roda na abertura do app (dev, sem segurar a tela) e pelo botão da Central.
- 2026-11-06 · P0-S0-08 · `APP-101` confere o banco **da Central** (`PRAGMA user_version` = `DEV_ERROR_DB_VERSION` = 1), decidido com o usuário na checagem de Ready; o banco principal terá o `DAT-103` (P1-S1-01). Banco antigo sem versão sobe para 1; banco mais novo não é rebaixado.
- 2026-11-06 · P0-S0-08 · Códigos de autodiagnóstico ficam no catálogo com `selfTest: true` (severidade `warning`; no doc 04 aparecem como `autodiag.`). O tipo `SelfTestCode` só aceita esses códigos em `registerCheck`.
- 2026-11-06 · P0-S0-08 · O `test/setup.ts` carrega `src/observability` antes de cada arquivo de teste, então um `jest.mock` de módulo usado por ela chega tarde. Nesse caso, carregar o módulo de novo com `jest.isolateModules` + `jest.doMock` (exemplo em `selfTest.test.ts`).
- Pendência · **E2E pendente de rodar**: fluxos `.yaml` são escritos normalmente; antes de fechar a Sprint 0, guiar a instalação do Java 17, do Android Studio (emulador) e do Maestro.
- Pendência · Avisar antes da primeira história que não roda no Expo Go (provavelmente P1-S1-05, SQLCipher) e explicar o development build.
- 2026-11-06 · P0-S0-03 · Repositório **privado** em `github.com/gabrielmp1/prumo-app`. No plano grátis, as regras de proteção de branch não são aplicadas em repositório privado: vale o combinado de só juntar na `main` com a CI verde. O passo a passo do README fica para quando o repositório virar público ou o plano mudar.
- 2026-11-06 · P0-S0-03 · Fluxo a partir de agora: a branch da história é enviada ao GitHub e só é juntada na `main` depois da CI verde. Enquanto o Claude Code não enxerga as Actions (repositório privado, sem `gh` e sem login no navegador do app), o resultado da CI é conferido pelo usuário.
- 2026-11-06 · P0-S0-03 · `npm audit` na CI olha só as dependências do app (`--omit=dev`) e falha a partir de "alta". Situação em 2026-11-06: 22 alertas baixos/moderados nas dependências do app (`deepmerge`, `glob`, `minimatch`, usados pelas ferramentas do Expo) e mais alguns só nas ferramentas de teste; nenhum alto. Não usar `audit fix --force` (quebraria o Expo/Jest); reavaliar a cada `/fechar-sprint`.
- Pendência · Apagar a pasta antiga `Downloads\Nova pasta (9)\prumo-app` depois de fechar a sessão do Claude Code que a usava.
- 2026-11-06 · BUG-002 · A linha "Componentes" do relatório mostra só componentes do app (até 5): primitivos do React Native (`View`, `Text`, `RCT*`…) e peças internas do React, do Expo Router e da navegação são filtrados em `componentPath()` (`src/features/errorCenter/format.ts`). Se aparecer um nome interno novo, acrescente à lista dali.

### Passagem para a próxima sessão (2026-11-06)

**Onde paramos:** Sprint 0 com 7 de 10 histórias feitas (P0-S0-01 a 07) + BUG-001 e BUG-002 resolvidos; tudo na `main` e no GitHub. **P0-S0-08 (Autodiagnóstico) em Revisão**, na branch `feat/P0-S0-08-self-test`, esperando a CI. Com a CI verde: mover para Feito, juntar na `main`. Depois: P0-S0-09 (tokens + componentes; inclui o `StatusBar`) e P0-S0-10 (9 ADRs + retro).

**Pendências abertas**
- E2E escritos e **nunca rodados**: `e2e/p0-s0-06-simular-erro.yaml`, `e2e/p0-s0-07-acesso-ajustes.yaml`, `e2e/p0-s0-08-autodiagnostico.yaml` (Expo Go, `appId: host.exp.exponent`). Antes de fechar a Sprint 0: guiar o usuário na instalação do Java 17 (hoje tem Java 8), Android Studio com emulador e Maestro; rodar e ajustar os fluxos.
- Avisar o usuário **antes** da primeira história que não roda no Expo Go (provável P1-S1-05, SQLCipher) e explicar o development build.
- Pasta antiga `Downloads\Nova pasta (9)\prumo-app` ainda pode existir: o usuário apaga depois de fechar a sessão antiga.

**Como trabalhamos (combinado com o usuário)**
- Uma história por vez, testes antes do código, `npm run check` verde, commit (Conventional Commits, inglês, com o ID), branch `feat/<ID>-<resumo>` enviada ao GitHub.
- **O Claude Code não enxerga as Actions** (repositório privado, sem `gh`, navegador do app sem login no GitHub): o usuário confere a CI e avisa. Só com a CI verde: mover a história para Feito no STATUS (commit na branch), `git merge --no-ff` na `main`, `git push origin main`, apagar a branch local. O `git push` funciona sem pedir nada (Git Credential Manager já logado).
- Para testar no celular: `npx expo start --tunnel ngrok` (o Wi-Fi direto não funciona; `--tunnel` sozinho exige conta Expo). Rodar num terminal que o usuário vê, mostrar o QR e **desligar o servidor** depois. O usuário pediu para conferir isso no `/fechar-sprint`.
- Em modo dev, cada erro reportado aparece também como aviso vermelho do React Native (LogBox), porque o `ConsoleTransport` usa `console.error`. É esperado. A engrenagem cinza na tela é o menu do Expo Go, não é do app.
- Mensagens ao usuário em português simples; ele usa um Samsung (Android) e Windows 11.

**Detalhes técnicos que não estão em outros docs**
- No Git Bash do Windows, scripts Python em heredoc estragam acentos: editar arquivos com a ferramenta de edição (ou scripts Node), não com `python <<EOF`/`sed` em texto com acento ou barra invertida.
- Testes que usam `fs`/`path`/`node:sqlite` precisam de `/** @jest-environment node */` no topo. Mocks de `jest.mock()` não podem usar variáveis de fora: usar `jest.requireActual(...)` dentro da fábrica.
- No Jest, o `expo-constants` não lê o `app.json` (versão vem nula): mockar quando o teste depende da versão.
- `react-native-safe-area-context`: o `Screen` lê `SafeAreaInsetsContext` direto (sem provedor = sem afastamento), por isso funciona em testes sem `SafeAreaProvider`.
- O boundary do Expo Router (`Try`) não passa a pilha de componentes; ela vem de `error.componentStack`, que o React Native anexa antes do efeito da tela de erro rodar. No Jest isso não acontece (os testes simulam o campo).
- Promessas rejeitadas no RN 0.88 não passam pelo `ErrorUtils`; a captura do `APP-002` religa o rastreador do Hermes (`src/observability/globalHandlers.ts`).

## Métricas por sprint

| Sprint | Histórias feitas | Bugs abertos/fechados | Erros na Central (novos) | Cobertura core | `plan()` (ms) |
|---|---|---|---|---|---|
| S0 | 7 | 2 / 1 | — | 100% | — |
