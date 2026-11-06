# 03 — Qualidade e testes

O objetivo é simples: **nenhuma função entra sem prova automática de que funciona**, e qualquer
coisa que dê errado depois aparece na Central de Erros com um código que leva direto à causa.

## Pirâmide de testes

| Camada | Ferramenta | O que cobre | Velocidade | Meta |
|---|---|---|---|---|
| Unitário | Jest | `src/core` inteiro: datas, ocorrências, planejador, parser, ritmo | ms | ≥ 90% linhas e ramos no `core` |
| Propriedade | fast-check (dentro do Jest) | Invariantes do planejador e do parser com milhares de entradas aleatórias | s | Todas as invariantes de `invariants.ts` |
| Integração | Jest + SQLite em memória | Repositórios, migrações, validação zod, Central de Erros | s | Todo repositório e toda migração |
| Componente | React Native Testing Library | Telas e componentes com dados de exemplo | s | Estados: vazio, normal, erro, carregando |
| E2E | Maestro (YAML) | Fluxos reais no emulador/aparelho | min | 1 fluxo por história de tela |
| Autodiagnóstico | `selfTest.ts` (roda no app) | As mesmas invariantes sobre os dados REAIS do usuário | ms | Toda regra crítica |

## Regras de escrita de testes

- **Nome do teste = comportamento**, em português:
  `it('não coloca bloco de tarefa em dia bloqueado')`.
- **Critério de aceite → teste.** Cada `Dado/Quando/Então` da história vira pelo menos um teste.
- **Relógio controlado.** O `core` recebe `now` como parâmetro. Nos testes de componente use
  `jest.useFakeTimers().setSystemTime(...)`. Nunca dependa do dia em que o teste roda.
- **Fábricas de dados** em `test/factories.ts` (`makeTask({ due: '2026-11-10' })`), nunca objetos
  copiados e colados.
- **Sem dormir.** Nada de `setTimeout` em teste; use `waitFor`/`findBy`.
- **Bug encontrado = teste de regressão** com o código da história ou do erro no nome.

## Falhar o teste se um erro for reportado

`test/setup.ts` instala um transporte de teste na Central de Erros. Depois de cada teste:

```ts
afterEach(() => {
  const inesperados = testTransport.events.filter(e => !testTransport.expected.has(e.code));
  testTransport.reset();
  if (inesperados.length) throw new Error(`Erros reportados sem expectativa: ${formatar(inesperados)}`);
});
```

Quando o teste QUER provocar um erro: `expectReportedError('PLN-003')` antes da ação.
Assim, um `catch` que reporta erro "escondido" quebra a suíte, em vez de passar despercebido.
`check()` (invariante) também lança exceção dentro dos testes, para o problema aparecer na hora.

## Testes de propriedade do planejador (exemplos obrigatórios)

Para qualquer conjunto aleatório de aulas, compromissos, tarefas, dias bloqueados e configurações:

1. Nenhum bloco é colocado antes de hoje.
2. Nenhum bloco não-fixado cai em dia bloqueado, dia pulado da tarefa ou dia já registrado como feito.
3. A soma dos minutos planejados num dia (sem fixados) nunca passa da capacidade do dia.
4. Para tarefa não atrasada: nenhum bloco depois do prazo.
5. Minutos planejados + minutos feitos + `short` (falta) = necessidade da tarefa (ajustada pelo ritmo).
6. Tarefas concluídas não recebem blocos novos.
7. No encaixe do dia (`schedule`), nenhum bloco se sobrepõe a aula, compromisso ou bloco fixado,
   e todos ficam entre o início e o fim do dia configurados.
8. Determinismo: mesma entrada → mesma saída.

Essas mesmas funções ficam em `src/core/planner/invariants.ts` e são reutilizadas pelo
Autodiagnóstico no app.

## Integração contínua (GitHub Actions)

Em todo push e pull request:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test:coverage` (falha abaixo dos limites)
5. Teste de arquitetura (`core` sem imports proibidos)
6. Relatório de cobertura como artefato

Na branch principal, além disso: build de pré-visualização com EAS (APK interno) ao fim de cada sprint.
E2E com Maestro: rodar localmente antes de fechar a sprint; na CI quando houver orçamento para
emulador (Maestro Cloud ou runner com emulador).

## Testes manuais (curtos e guiados)

Ao fim de cada sprint, o checklist de demo (`/fechar-sprint` gera) é executado no celular real.
Tudo o que falhar vira bug com teste de regressão. A Central de Erros é aberta e esvaziada:
cada erro novo vira item no quadro ou é explicado.

## Desempenho (orçamentos)

| Operação | Limite | Como medir |
|---|---|---|
| `plan()` com 300 tarefas e 120 dias | < 50 ms no celular médio | teste de benchmark + medição no Autodiagnóstico |
| Abrir a tela Dia | < 300 ms até o primeiro conteúdo | marca de tempo no logger (dev) |
| Adicionar rápido | < 100 ms da tecla até aparecer | teste de componente com tempo |

Estourar orçamento gera `reportWarning('PRF-001', { operacao, ms })`.
