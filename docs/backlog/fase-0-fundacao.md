# Fase 0 — Fundação

## Sprint 0 — Projeto, qualidade e Central de Erros

**Meta:** antes de qualquer função, o projeto já testa, verifica e mostra erros sozinho.

---

### P0-S0-01 · Criar o projeto Expo com TypeScript strict — P

Como desenvolvedor, quero o projeto criado com a stack definida, para começar sobre base sólida.

**Critérios de aceite**
- Dado o repositório vazio, quando rodar `npx create-expo-app` com template TypeScript e Expo Router,
  então o app abre no Expo Go mostrando a tela "Prumo".
- `tsconfig` com `strict: true`, `noUncheckedIndexedAccess: true`.
- Estrutura de pastas igual à de `docs/02-arquitetura.md` (pastas vazias com `README.md` curto).
- Scripts do `package.json` iguais aos do `CLAUDE.md`.

**Testes:** teste de fumaça (renderiza a tela inicial sem erro).
**Monitoramento:** nenhum ainda.

---

### P0-S0-02 · Qualidade automática: lint, formatação, testes, cobertura — P

Como desenvolvedor, quero que o código seja verificado sozinho, para não depender de memória.

**Critérios de aceite**
- ESLint (regras recomendadas de TS e React Native) + Prettier configurados; `npm run lint` passa.
- Jest com `jest-expo`, React Native Testing Library e fast-check instalados.
- Cobertura: `src/core/**` com limite de 90% (linhas e ramos); falha abaixo disso.
- Regra de arquitetura: `src/core` não pode importar `react`, `react-native`, `expo*`, `src/data`,
  `src/platform`, `src/features` (ESLint `no-restricted-imports` + um teste que varre os imports).
- `npm run check` roda typecheck, lint e testes.

**Testes:** o próprio teste de arquitetura; um teste de exemplo em `src/core`.

---

### P0-S0-03 · Integração contínua no GitHub — P

Como desenvolvedor, quero que todo envio rode as verificações, para a branch principal estar sempre verde.

**Critérios de aceite**
- Workflow `.github/workflows/ci.yml`: instala, typecheck, lint, testes com cobertura.
- Falha bloqueia o merge (proteção de branch documentada no README).
- Badge de status no README.

---

### P0-S0-04 · Núcleo da Central de Erros — M

Como desenvolvedor, quero uma API única para reportar erros e invariantes, para nada falhar em silêncio.

**Critérios de aceite**
- `src/observability` exporta `reportError`, `reportFatal`, `reportWarning`, `check`, `breadcrumb`,
  `withReporting`, `measure` com a assinatura do doc 04.
- Catálogo `codes.ts` com os códigos iniciais do doc 04; usar código fora do catálogo é erro de tipo.
- Transportes `TestTransport`, `ConsoleTransport` e `DevCenterTransport` (este grava em memória
  nesta história; SQLite na P0-S0-06) escolhidos por `EXPO_PUBLIC_ERROR_MODE`.
- `fingerprint` agrupa repetições: o mesmo código + mensagem normalizada (sem números/ids) incrementa contagem.
- Trilha guarda as últimas 50 ações (fila circular).
- `check(false, ...)` lança exceção em modo `test` e reporta sem lançar em `dev`/`prod`.

**Testes (unitários)**
- Cada função reporta com severidade correta.
- Agrupamento por fingerprint ("Falha ao salvar item 123" e "… 456" viram um grupo).
- Trilha limitada a 50.
- `check` lança em teste, não lança em dev.
- `withReporting` reporta e repropaga (ou devolve valor padrão, conforme opção).
- `measure` reporta `PRF-001` acima do orçamento (relógio falso).

---

### P0-S0-05 · Testes falham em erro inesperado — P

Como desenvolvedor, quero que a suíte quebre quando algum erro for reportado sem expectativa,
para bugs escondidos em `catch` aparecerem.

**Critérios de aceite**
- `test/setup.ts` instala `TestTransport` e o `afterEach` do doc 03.
- `expectReportedError(code)` marca o código como esperado naquele teste.
- Teste de exemplo prova as duas situações (falha sem expectativa; passa com expectativa).

---

### P0-S0-06 · Capturas globais e persistência — M

Como desenvolvedor, quero que erros não tratados sejam capturados e guardados, para vê-los depois de testar no celular.

**Critérios de aceite**
- `ErrorBoundary` por tela: mostra "Algo deu errado nesta tela." + botão "Tentar de novo"; reporta `UI-001`.
- Handler global de exceções (`APP-001`) e de promessas rejeitadas (`APP-002`).
- `DevCenterTransport` grava em SQLite (tabela `dev_error_log`), mantendo no máximo 500 grupos (remove os mais antigos).
- Ao reabrir o app, os erros anteriores continuam lá.

**Testes**
- Componente que lança → ErrorBoundary mostra a mensagem e reporta `UI-001`.
- Integração com SQLite em memória: gravar, agrupar, limitar a 500, ler.
- E2E Maestro: botão escondido "Simular erro" (só dev) → Central mostra o erro.

---

### P0-S0-07 · Tela da Central de Erros — M

Como desenvolvedor testando no celular, quero ver e copiar os erros dentro do app, para colar no Claude Code.

**Critérios de aceite**
- Acesso: Ajustes → 5 toques na versão; e selo vermelho no topo quando houver erros novos (só em dev).
- Lista agrupada por código com contagem, severidade (cor + texto) e última ocorrência.
- Filtros: severidade, módulo, "só novos".
- Detalhe com mensagem, contexto, pilha, trilha, tela e versão.
- "Copiar relatório" (um ou todos) no formato Markdown do doc 04.
- "Marcar como resolvido", "Limpar tudo", "Simular erro", "Rodar autodiagnóstico".
- Em modo `prod`, a rota `/dev/erros` não existe e o selo não aparece.

**Testes**
- Componente: estados vazio ("Nenhum erro registrado"), lista, detalhe.
- Gerador de relatório: saída Markdown exata para um caso fixo (snapshot de texto).
- Teste de configuração: em `prod`, rota e selo ausentes.
- E2E: simular erro → abrir central → copiar relatório.

---

### P0-S0-08 · Esqueleto do Autodiagnóstico — P

Como desenvolvedor, quero um lugar para verificações automáticas dos dados reais, para cada função nova trazer sua verificação.

**Critérios de aceite**
- `selfTest.ts` com registro de verificações: `registerCheck({ code, name, run(data) => Problem[] })`.
- Roda em segundo plano ao abrir o app (modo dev) e pelo botão da Central.
- Resultado: lista de verificações com ok/problemas e tempo de cada uma.
- Uma verificação de exemplo (`APP-101`: versão do banco igual à esperada).

**Testes:** registro, execução, verificação que lança vira problema `APP-003` em vez de derrubar o app.

*(decidido em 2026-11-06, na checagem de Ready)*
- `APP-101` confere o banco **da Central de Erros** (`prumo-dev-errors.db`), que passa a guardar a
  versão do esquema (`PRAGMA user_version = 1`). O banco principal ganha a sua verificação na P1-S1-01 (`DAT-103`).
- Estados do resultado na Central: **vazio** "O autodiagnóstico ainda não rodou"; **rodando** botão
  desativado com "Rodando…"; **normal** uma linha por verificação (nome, "ok" ou "N problemas", tempo
  em ms) e os problemas embaixo; **erro** a verificação que lançou aparece como "falhou" com a mensagem
  (vira `APP-003`) e as outras continuam. Os problemas também entram na lista da Central como aviso.

---

### P0-S0-09 · Tokens de design e componentes base — P

Como usuário, quero uma interface consistente e legível no claro e no escuro.

**Critérios de aceite**
- Tokens, tipografia (Recursive) e regras de componentes de `docs/referencia/design.md` (design escolhido: "Caderno"); telas de referência em `docs/referencia/design/`.
- Tema claro e escuro seguindo o sistema.
- Componentes: `Button`, `IconButton`, `Chip`, `Card` (com sombra dura), `Checkbox` quadrada, `Highlight` (marca-texto), `TimeRing` (anel de tempo), `Sheet` (folha inferior), `Toast` com ação "Desfazer", `EmptyState`, fundo quadriculado.
- Contraste mínimo AA nos textos (teste que calcula contraste dos pares de tokens).
- *(acrescentado em 2026-11-06, visto no celular)* A barra de status segue o tema **do app**: ícones
  escuros sobre fundo claro e claros sobre fundo escuro (hoje `StatusBar style="auto"` segue o sistema e
  os ícones somem no modo escuro).

**Testes:** componente de cada peça (renderiza, acessibilidade: `accessibilityRole`/`label`), teste de contraste, estilo da barra de status em cada tema.

---

### P0-S0-10 · ADRs e STATUS — P

**Critérios de aceite:** ADR-001 a ADR-006 escritos em `docs/adr/` (modelo em `docs/adr/000-modelo.md`),
com versões instaladas; `docs/STATUS.md` atualizado; retro da sprint registrada.
