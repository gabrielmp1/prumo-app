# 05 — Metodologia de trabalho

Um time pequeno (você + Claude Code) precisa de processo leve, mas disciplinado. Usamos
**Scrum enxuto** para o ritmo (sprints, revisão, retrospectiva), **Kanban** para o fluxo do dia a dia,
**TDD** e **integração contínua** para a qualidade, e **entrega em fatias verticais**: cada história
entrega algo que funciona de ponta a ponta, mesmo que pequeno.

## Estrutura do backlog

```
Fase (ex.: Fase 1 — MVP local)
 └─ Sprint (1 semana; meta da sprint em uma frase)
     └─ História (ID: P1-S2-03) — "Como <pessoa>, quero <ação>, para <benefício>"
         ├─ Critérios de aceite (Dado / Quando / Então)
         ├─ Testes (unitário, propriedade, integração, componente, E2E)
         ├─ Monitoramento (códigos de erro, invariantes no autodiagnóstico)
         └─ Tamanho (P, M, G) — G deve ser quebrada antes de começar
```

IDs: `P<fase>-S<sprint>-<nº>`. Ex.: `P1-S2-03` = Fase 1, Sprint 2, história 3.

## Quadro (docs/STATUS.md)

Colunas: **A fazer → Fazendo → Revisão → Feito**, mais **Bugs** e **Ideias**.
Limite de trabalho em andamento: **1 história em "Fazendo"** por vez.

## Definition of Ready (antes de começar uma história)

- [ ] Objetivo claro (história no formato Como/Quero/Para)
- [ ] Critérios de aceite testáveis
- [ ] Dependências feitas (ou explicitamente simuladas)
- [ ] Tamanho P ou M
- [ ] Códigos de erro previstos listados
- [ ] Se tem tela: estados vazio, normal e erro descritos

## Definition of Done (para considerar uma história pronta)

- [ ] Testes escritos ANTES do código e todos passando
- [ ] Cada critério de aceite tem teste correspondente (nome do teste referencia o critério)
- [ ] `npm run check` verde; cobertura do `core` ≥ 90%
- [ ] Nenhum erro inesperado reportado na suíte
- [ ] `catch` instrumentados; códigos novos no catálogo e no doc 04
- [ ] Verificação adicionada ao Autodiagnóstico, quando a história cria regra verificável
- [ ] Histórias de tela: fluxo E2E Maestro + estados vazio/normal/erro testados + acessibilidade
      básica (rótulos, contraste, alvo de toque ≥ 44 px)
- [ ] Sem regressão de desempenho (orçamentos do doc 03)
- [ ] Textos revisados (pt-BR, claros)
- [ ] Commit(s) no padrão, STATUS.md atualizado

## Ritmo de uma sprint (1 semana)

| Momento | O quê | Comando |
|---|---|---|
| Início | Planejamento: meta da sprint, histórias, checagem de Ready | `/planejar-sprint` |
| Diário | Uma história de cada vez, até o DoD | `/proxima-historia` |
| Durante | Erro no celular → relatório da Central → teste de regressão → correção | `/investigar-erro` |
| Fim | Build de pré-visualização (APK), demo no celular, revisão, retrospectiva | `/fechar-sprint` |

**Retrospectiva** (registrada em `docs/retro/sprint-NN.md`): o que funcionou, o que atrapalhou,
uma melhoria concreta para a próxima sprint, métricas (histórias feitas, bugs abertos/fechados,
erros na Central, cobertura, tempo do `plan()`).

## Git

- **Trunk-based:** branch principal sempre verde. Branches curtas por história (`feat/P1-S2-03-dias-bloqueados`).
- **Conventional Commits:** `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`, com o ID da história.
- Merge só com CI verde. Tag por sprint: `v0.<sprint>.0`.
- Funções incompletas ou arriscadas atrás de **feature flag** (`src/config/flags.ts`), nunca em branch longa.

## Portões de decisão (não pular)

| Portão | Quando | Pergunta | Se não |
|---|---|---|---|
| G1 | Fim da Fase 1 | 30–50 testadores; retenção semana 4 ≥ 25%? | Iterar o MVP antes de construir backend |
| G2 | Meio da Fase 2 | A captura com IA é usada por ≥ 40% dos ativos? | Reduzir investimento em IA, focar no planejador |
| G3 | Fim da Fase 2 | Alguém pagaria? (teste de preço com página de pré-venda) | Rever modelo: B2B, concurseiros |

## Riscos e respostas

| Risco | Resposta |
|---|---|
| Planejador produzir planos estranhos | Testes de propriedade + Autodiagnóstico + princípio "o app sugere, você manda" |
| Notificações não chegarem (economia de bateria da Samsung) | Teste em aparelho real no Sprint 6; tela orientando a liberar o app |
| Escopo crescer sem fim | Só entra na sprint o que está no roadmap; ideias vão para a coluna Ideias |
| Dependência de bibliotecas de terceiros | ADR para cada uma; preferir bibliotecas mantidas pela Expo |
| Custo de IA/WhatsApp | Limites por usuário, IA atrás do plano pago a partir de um teto |
