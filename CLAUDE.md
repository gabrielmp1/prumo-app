# CLAUDE.md — Regras permanentes do projeto Prumo

Você é o engenheiro sênior deste projeto. Leia este arquivo inteiro antes de qualquer tarefa.
Ele vale para todas as sessões. Os detalhes estão em `docs/`.

## O que é o Prumo

App de organização para estudantes (Android primeiro, iPhone depois) que **planeja sozinho**:
aulas fixas, compromissos e tarefas com prazo e duração são distribuídos automaticamente nos
dias livres. Visão completa: `docs/01-visao-produto.md`. Protótipo funcional de referência:
`docs/referencia/prototipo-prumo.html` (abra no navegador para ver o comportamento esperado).

## Stack (decidida — mudanças só via ADR em `docs/adr/`)

- Expo (SDK estável mais recente no início do projeto) + React Native + **TypeScript strict**
- Navegação: Expo Router · Estado de UI: Zustand · Datas: date-fns (locale pt-BR)
- Banco local: expo-sqlite + Drizzle ORM (offline-first) · Validação: zod
- Testes: Jest (jest-expo) + React Native Testing Library + fast-check (propriedades) + Maestro (E2E)
- Qualidade: ESLint + Prettier + `tsc --noEmit` · CI: GitHub Actions · Builds: EAS Build
- Backend (Fase 2+): Supabase (Auth, Postgres com RLS, Storage, Edge Functions)
- Observabilidade: Central de Erros própria (dev) → Sentry (produção). Ver `docs/04-central-de-erros.md`

## Comandos

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm test               # jest (unitários + integração)
npm run test:watch
npm run test:coverage  # falha abaixo dos limites definidos em jest.config
npm run e2e            # maestro test e2e/  (precisa de emulador ou aparelho)
npm run check          # typecheck + lint + test  ← rode antes de todo commit
```

## Como trabalhar (obrigatório)

1. **Escolha a próxima história** em `docs/STATUS.md` (coluna "A fazer", ordem de cima para baixo).
   Não pule histórias nem misture duas na mesma entrega.
2. **Leia a história** no arquivo do backlog (`docs/backlog/`). Se faltar algo para ela estar
   "Pronta para começar" (Definition of Ready em `docs/05-metodologia.md`), pergunte antes.
3. **TDD — vermelho, verde, refatorar.**
   - Escreva primeiro os testes que provam cada critério de aceite (Dado/Quando/Então).
   - Rode e confirme que falham pelo motivo certo.
   - Implemente o mínimo para passar. Refatore com os testes verdes.
4. **Instrumente a função** com a Central de Erros:
   - Todo `catch` chama `reportError(CODIGO, erro, contexto)`. Nunca engula erro em silêncio.
   - Regras de negócio críticas viram invariantes com `check(condicao, CODIGO, contexto)`.
   - Registre os novos códigos no catálogo `src/observability/codes.ts` e em `docs/04-central-de-erros.md`.
   - Se a função tem invariantes verificáveis sobre os dados do usuário, adicione uma
     verificação ao **Autodiagnóstico** (`src/observability/selfTest.ts`).
5. **Teste de regressão para todo bug**: antes de corrigir, escreva o teste que reproduz o bug.
6. **Rode `npm run check`**. Tudo verde, sem erros inesperados reportados (o setup de testes
   falha o teste se `reportError` for chamado sem `expectReportedError`).
7. **Commit pequeno** no padrão Conventional Commits, citando a história:
   `feat(planner): distribui tarefas respeitando dias bloqueados [P1-S2-03]`
8. **Atualize `docs/STATUS.md`** (mova a história, anote decisões e pendências).
9. **Ao fim de cada sprint**, rode `/fechar-sprint` (ver `.claude/commands/`).

## Definition of Done (resumo — completo em `docs/05-metodologia.md`)

- Critérios de aceite cobertos por testes automatizados e passando
- `npm run check` verde; cobertura do `src/core` ≥ 90% linhas e ramos
- Erros instrumentados com códigos catalogados; invariantes no Autodiagnóstico quando aplicável
- Fluxo principal da história com teste E2E Maestro (para histórias de tela)
- Sem `any`, sem `// @ts-ignore`, sem `console.log` solto (use o logger)
- Textos da interface em português do Brasil, claros, sem jargão técnico
- STATUS.md atualizado

## Arquitetura em uma frase

`src/core` é **puro** (sem React, sem Expo, sem I/O) e concentra as regras: datas, ocorrências,
planejador, parser de texto, ritmo. Telas e banco chamam o core. Isso deixa as regras 100%
testáveis em milissegundos. Detalhes: `docs/02-arquitetura.md`.

## Segurança e privacidade (inegociável)

Leia `docs/07-seguranca-privacidade.md`. Resumo: tudo funciona sem internet; rede só pela camada
`src/platform/net.ts` e só para funções que o usuário acionou ou autorizou (bloqueada no Modo offline); nada de conteúdo é guardado fora do aparelho sem cifra; banco e anexos criptografados
no aparelho; sincronização com criptografia de ponta a ponta (libsodium); nunca criptografia feita em casa.

## Nunca faça

- Colocar chave de API (Anthropic, Meta, Supabase service role) dentro do app. Chaves só no servidor.
- Fazer chamada de rede fora de `src/platform/net.ts` ou com a função desligada.
- Enviar ao servidor de sincronização qualquer conteúdo que não esteja cifrado no aparelho.
- Logar ou enviar dados pessoais do usuário (títulos de tarefas, notas, anexos) para serviços
  externos sem passar pelo filtro de privacidade (`scrub()` da Central de Erros).
- Apagar ou desativar teste para "fazer passar". Se um teste está errado, explique e corrija-o.
- Adicionar dependência sem justificar no commit e sem checar manutenção e licença.
- Mudar a stack, o modelo de dados ou o algoritmo do planejador sem ADR.

## Idioma

- Código, nomes de variáveis, commits: inglês (padrão do ecossistema).
- Documentação, textos da interface, mensagens de erro para o usuário: português do Brasil.
- Comentários: português, curtos, explicando o porquê.
