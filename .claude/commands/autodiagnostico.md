---
description: Revisa as verificações automáticas e propõe novas para o que já foi construído
---

1. Liste as verificações registradas em `src/observability/selfTest.ts` e os códigos do catálogo.
2. Para cada módulo já construído (veja "Feito" no `docs/STATUS.md`), compare com as regras de
   `docs/referencia/algoritmos.md` e os critérios de aceite das histórias.
3. Aponte regras críticas SEM verificação automática (teste de propriedade, `check()` ou autodiagnóstico).
4. Aponte `catch` sem `reportError`, erros reportados com contexto pobre e códigos usados que não estão no doc 04.
5. Proponha a lista em ordem de risco. Implemente as de risco alto com testes, depois rode `npm run check`.
