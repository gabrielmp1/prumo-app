---
description: Recebe um relatório da Central de Erros, reproduz com teste e corrige
---

Relatório colado da Central de Erros do app:

$ARGUMENTS

1. Identifique o código do erro no catálogo (`src/observability/codes.ts`) e o módulo.
2. Use a trilha de ações, o contexto e a pilha para formular a causa provável. Diga qual é antes de mexer.
3. Registre o bug em `docs/STATUS.md` (seção Bugs, próximo número BUG-NNN).
4. Escreva um teste que REPRODUZ o problema (nome: `BUG-NNN: <descrição>`) e mostre que falha.
5. Corrija o mínimo necessário. Rode `npm run check`.
6. Pergunte-se: que invariante ou verificação teria pego isso antes? Adicione-a (teste de propriedade,
   `check()` ou Autodiagnóstico) para a mesma classe de erro não voltar.
7. Commit `fix(<módulo>): <descrição> [BUG-NNN]`, atualize o STATUS e me diga como confirmar no celular.
Se o relatório não tiver informação suficiente, diga exatamente o que preciso fazer no app para
coletar mais (e, se fizer sentido, adicione mais contexto ao `reportError` correspondente).
