---
description: Revisão da sprint, retrospectiva, métricas e preparação da próxima
---

1. Rode `npm run check`, `npm run test:coverage` e (se possível) `npm run e2e`. Mostre o resultado.
2. **Higiene e segurança** (mostre o resultado de cada item):
   - Rode `npm audit` e me explique o resultado em português simples: quantos alertas, de que
     gravidade, se atingem o app instalado ou só as ferramentas de desenvolvimento, e o que fazer
     (nunca `npm audit fix --force` sem me perguntar).
   - Confira que não há senha, chave de API ou token no código nem no histórico do Git: procure
     com `git grep` (e `git log -p` na sprint) por padrões como `sk-ant-`, `service_role`, `apikey`,
     `api_key`, `secret`, `password`, `senha`, `token`, `BEGIN PRIVATE KEY`, e confirme que nenhum
     arquivo `.env` (fora `.env.example`) está versionado. Achou algo: pare e me avise antes de
     qualquer outra coisa.
   - Confirme que o servidor do Expo foi encerrado: nenhum processo `expo start` rodando e a porta
     8081 livre. Se houver, encerre e me diga.
3. Confira no `docs/STATUS.md` o que foi feito × planejado. Histórias incompletas voltam para o topo de "A fazer".
4. Gere o **checklist de demo** para eu executar no celular: passos curtos, numerados, cobrindo cada
   história da sprint, incluindo abrir a Central de Erros e rodar o Autodiagnóstico no fim.
5. Prepare o build de pré-visualização (comando EAS do perfil `preview`) e me diga como instalar.
6. Depois que eu relatar a demo: registre bugs, preencha a linha de métricas da sprint e escreva a
   retrospectiva em `docs/retro/sprint-NN.md` (funcionou / atrapalhou / uma melhoria concreta).
7. Crie a tag `v0.<sprint>.0`, mova as histórias da próxima sprint para "A fazer" e escreva a meta dela.
8. Se a sprint fecha uma fase, lembre do portão de decisão correspondente (`docs/05-metodologia.md`).
