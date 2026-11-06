---
description: Pega a próxima história do quadro e implementa com TDD até o Definition of Done
---

Você vai implementar UMA história do Prumo, seguindo o `CLAUDE.md`.

1. Leia `CLAUDE.md`, `docs/STATUS.md` e a primeira história de "A fazer" (ou a indicada aqui: $ARGUMENTS).
2. Abra a história no arquivo de `docs/backlog/` e os documentos que ela cita
   (`docs/referencia/algoritmos.md` para regras do core).
3. Confira a Definition of Ready (`docs/05-metodologia.md`). Se algo faltar, pare e pergunte.
4. Mova a história para "Fazendo" no STATUS.md. Crie a branch `feat/<ID>-<resumo>`.
5. Liste para mim, em poucas linhas, o plano: arquivos que vai criar/alterar, testes que vai escrever
   (um por critério de aceite, mais propriedades quando houver regra), códigos de erro novos.
6. TDD: escreva os testes, rode e mostre que falham; implemente; rode até passar; refatore.
7. Instrumente: `reportError`/`check` com códigos do catálogo; atualize `src/observability/codes.ts`
   e o doc 04; adicione verificação ao Autodiagnóstico se a história cria regra verificável.
8. História de tela: escreva o fluxo Maestro em `e2e/` e teste os estados vazio, normal e erro.
9. Rode `npm run check` e, se for história de tela e houver emulador, `npm run e2e`.
10. Percorra a Definition of Done item por item e mostre a lista marcada.
11. Faça o commit (Conventional Commits com o ID), atualize o STATUS.md (Feito + métricas) e
    me diga em 3–5 linhas: o que mudou, como testar no celular, o que ficou pendente.
