# Prumo — pacote inicial do projeto

Este pacote é o ponto de partida para construir o app Prumo com o **Claude Code**.
Ele não tem código ainda: tem o plano completo, as regras de trabalho e o protótipo
de referência. O Claude Code vai criar o código história por história, sempre com testes.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `CLAUDE.md` | Regras que o Claude Code lê em toda sessão: stack, comandos, TDD, Definition of Done |
| `docs/01-visao-produto.md` | O que é o Prumo, para quem, princípios e métricas de sucesso |
| `docs/02-arquitetura.md` | Stack, pastas, modelo de dados, módulos e decisões |
| `docs/03-qualidade-e-testes.md` | Pirâmide de testes, ferramentas, padrões e automações |
| `docs/04-central-de-erros.md` | Especificação da Central de Erros (dev) e da passagem para produção |
| `docs/05-metodologia.md` | Como o trabalho é organizado: sprints, quadro, DoR, DoD, git |
| `docs/06-roadmap.md` | Fases, sprints e portões de decisão |
| `docs/07-seguranca-privacidade.md` | Dados locais por padrão, criptografia no aparelho e de ponta a ponta na nuvem |
| `docs/backlog/` | Todas as histórias, com critérios de aceite, testes e códigos de erro |
| `docs/STATUS.md` | Quadro Kanban que o Claude Code atualiza a cada história |
| `docs/referencia/` | Protótipo funcional e especificação dos algoritmos (planejador, parser) |
| `docs/adr/` | Registro de decisões de arquitetura |
| `.claude/commands/` | Comandos prontos para usar no Claude Code |

## Como começar (passo a passo)

1. **Prepare o computador** (uma vez):
   - Instale o Node.js LTS e o Git.
   - Instale o app **Expo Go** no seu celular Samsung (para ver o app rodando).
   - Opcional para testes E2E: Android Studio (emulador) e Maestro.
2. **Crie uma pasta** para o projeto e copie todo o conteúdo deste pacote para ela.
3. **Abra o Claude Code** nessa pasta.
4. Digite: `/proxima-historia`
   O Claude Code vai ler o `CLAUDE.md`, pegar a primeira história do quadro (Sprint 0) e
   construí-la com testes. Repita o comando para cada história.
5. Ao terminar cada sprint, digite `/fechar-sprint` para a revisão, a retrospectiva
   e a preparação da próxima.
6. Para ver os erros que o app registrou enquanto você testava no celular: abra a
   **Central de Erros** dentro do app (Ajustes → toque 5 vezes na versão), toque em
   **Copiar relatório** e cole no Claude Code com `/investigar-erro`.

## Comandos disponíveis no Claude Code

| Comando | O que faz |
|---|---|
| `/proxima-historia` | Pega a próxima história do quadro e implementa com TDD até o Definition of Done |
| `/investigar-erro` | Recebe um relatório da Central de Erros, reproduz com teste e corrige |
| `/autodiagnostico` | Revisa as verificações automáticas e propõe novas para o que foi construído |
| `/fechar-sprint` | Revisão da sprint, retrospectiva, métricas e planejamento da próxima |
| `/planejar-sprint` | Detalha as histórias da próxima sprint e confere se estão prontas para começar |

## Ordem das fases

- **Fase 0 — Fundação:** projeto, testes, CI e Central de Erros funcionando antes de qualquer tela.
- **Fase 1 — MVP local:** agenda completa no aparelho, com planejamento automático e notificações.
  Termina com um teste fechado com 30 a 50 pessoas.
- **Fase 2 — Diferenciais:** matérias, ritmo, voz, compartilhar, conta e sincronização, IA.
- **Fase 3 — Produto:** cobrança, lançamento na Play Store, Sentry, Turma, concursos, WhatsApp, iPhone.

Detalhes em `docs/06-roadmap.md`.
