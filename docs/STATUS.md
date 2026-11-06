# Quadro do projeto

> Atualizado pelo Claude Code ao fim de cada história. Limite: 1 história em "Fazendo".
> IDs e detalhes em `docs/backlog/`.

**Sprint atual:** S0 — Projeto, qualidade e Central de Erros
**Meta da sprint:** antes de qualquer função, o projeto já testa, verifica e mostra erros sozinho.

## A fazer (em ordem)

- [ ] P0-S0-02 · Qualidade automática: lint, formatação, testes, cobertura
- [ ] P0-S0-03 · Integração contínua no GitHub
- [ ] P0-S0-04 · Núcleo da Central de Erros
- [ ] P0-S0-05 · Testes falham em erro inesperado
- [ ] P0-S0-06 · Capturas globais e persistência
- [ ] P0-S0-07 · Tela da Central de Erros
- [ ] P0-S0-08 · Esqueleto do Autodiagnóstico
- [ ] P0-S0-09 · Tokens de design e componentes base
- [ ] P0-S0-10 · ADRs e STATUS (incluir ADR-007 a ADR-009 de segurança)

## Fazendo

_(vazio)_

## Revisão

_(vazio)_

## Feito

- [x] P0-S0-01 · Criar o projeto Expo com TypeScript strict (2026-11-05)

## Bugs

_(formato: `BUG-001 · descrição · código de erro · história relacionada · status`)_

- BUG-001 · Jest (jest-expo) quebra quando o caminho da pasta tem parênteses, ex. `Nova pasta (9)`: o mock automático lê o caminho pelo rastro de pilha · ambiente · P0-S0-01 · **resolvido** em 2026-11-05 (causa: parênteses no caminho da pasta; projeto copiado para `C:\Users\ggabr\Projetos\prumo-app`, onde `npm ci` e `npm run check` passaram)

## Observações de ambiente (não são bugs do app)

- 2026-11-05 · Expo Go no Samsung conectava pelo QR, mas mostrava `java.io.IOException: Failed to download remote update`: o celular não conseguia baixar o bundle do PC pela rede local (firewall do Windows ou isolamento do Wi-Fi). Solução: `npx expo start --tunnel ngrok`, com `@expo/ngrok` como dependência de desenvolvimento do projeto (sem instalação global). No SDK 58, `--tunnel` sozinho exige login na conta Expo. Dica registrada no README.

## Ideias (não entram na sprint sem passar pelo planejamento)

- Integração com calendário do Moodle (assinatura iCal) — avaliar na Fase 3
- Planejar pela energia usando dados de sono do relógio — depende de acesso aos dados da Samsung
- Painel próprio na borda da Samsung — investigar na P3-S19-02 (hoje: atalhos no painel de apps da borda)

## Decisões e pendências

- 2026-11-05 · Design escolhido: "Caderno" (estrutura da Opção 1 + identidade da Opção 4). Ver `docs/referencia/design.md`.
- 2026-11-05 · Tema escuro: versão B (botões cor de giz, sem amarelo, grifado lavanda). Versão 1 guardada como alternativa.
- 2026-11-05 · Versões instaladas (P0-S0-01): Expo SDK 58 (`expo` 58.0.23), React Native 0.88.1, React 19.3.0, TypeScript 6.0, Expo Router 58.0, Jest 30.5 + jest-expo 58, React Native Testing Library 14.1. Entram no ADR-001 (P0-S0-10).
- 2026-11-05 · Rotas ficam em `app/` na raiz, como no doc 02 (o modelo do SDK 58 usa `src/app/`; o Expo Router aceita os dois).
- 2026-11-05 · ESLint mínimo (`eslint-config-expo`) já instalado na P0-S0-01 para o `npm run check` funcionar desde o início; as regras do projeto entram na P0-S0-02.
- 2026-11-05 · `react-dom` 19.3.0 instalado só para fechar a dependência do Expo Router (web) com a mesma versão do `react`; sem ele o npm não resolve as dependências.
- 2026-11-05 · Padrões combinados: 9 ADRs (001 a 009) na P0-S0-10; branches locais por história até a CI existir (P0-S0-03); `.gitattributes` com quebra de linha LF; pacotes só locais e justificados no commit.
- Pendência · **E2E pendente de rodar**: fluxos `.yaml` são escritos normalmente; antes de fechar a Sprint 0, guiar a instalação do Java 17, do Android Studio (emulador) e do Maestro.
- Pendência · Avisar antes da primeira história que não roda no Expo Go (provavelmente P1-S1-05, SQLCipher) e explicar o development build.
- Pendência · P0-S0-03: guiar a criação do repositório vazio no GitHub e a proteção da branch.
- Pendência · `npm audit` aponta 31 vulnerabilidades (1 baixa, 30 moderadas), todas na cadeia de testes do Jest (só desenvolvimento, não vão para o app). Não usar `audit fix --force` (quebraria o Jest 30); reavaliar na P0-S0-03, quando a análise de dependências entrar na CI.
- Pendência · Apagar a pasta antiga `Downloads\Nova pasta (9)\prumo-app` depois de fechar a sessão do Claude Code que a usava.

## Métricas por sprint

| Sprint | Histórias feitas | Bugs abertos/fechados | Erros na Central (novos) | Cobertura core | `plan()` (ms) |
|---|---|---|---|---|---|
| S0 | 1 | 1 / 1 | — | — | — |
