# 01 — Visão do produto

## Uma frase

O Prumo é a agenda do estudante que **planeja sozinha**: você diz o que tem que fazer, até quando
e quanto tempo leva, e ele distribui o trabalho nos seus dias livres, respeitando aulas e
compromissos, e se reorganiza quando a vida acontece.

## Para quem

| Persona | Situação | O que precisa |
|---|---|---|
| **Universitário** (principal) | Aulas fixas na semana, listas e trabalhos com prazo, provas | Ver o dia de hoje, não esquecer prazos, saber quando fazer cada coisa |
| **Concurseiro** (Fase 3) | Edital com muitas matérias e uma data de prova | Distribuir o conteúdo até a prova, revisar, medir progresso |
| **Pessoa ocupada com TDAH ou "cegueira de tempo"** | Dificuldade de começar e de sentir o tempo | Tempo visível, passos pequenos, nenhuma punição por falhar |

## Problemas que resolvemos

1. Agendas comuns guardam compromissos, mas **não dizem quando fazer as tarefas**.
2. Planejadores automáticos (Motion, Reclaim) são caros, em inglês e não pensam em aula e prova.
3. Apps de estudo não agendam; apps de agenda não ajudam a estudar.
4. Adicionar coisas dá trabalho. No Brasil, a informação chega por **WhatsApp e áudio**.
5. Quando um dia dá errado, o plano inteiro desmorona e a pessoa abandona o app.

## Princípios do produto (usar para decidir empates)

1. **O dia de hoje é a tela principal.** Tudo o mais é zoom para fora (semana, mês, ano).
2. **Adicionar em segundos.** Escrever como se fala, falar, colar, compartilhar.
3. **O app sugere, você manda.** Planejamento automático, mas qualquer bloco pode ser fixado,
   movido ou adiado com um toque. Nada muda "escondido".
4. **Sem culpa.** Dia perdido é redistribuído sem castigo, sem sequência zerada.
5. **Offline primeiro.** Funciona sem internet; sincroniza quando der.
6. **Privacidade por padrão.** Os dados do usuário são dele; nada sai do aparelho sem motivo claro.

## Funcionalidades por fase (detalhe em `06-roadmap.md`)

- **MVP (Fase 1):** dia, semana, mês, ano; aulas/obrigações fixas semanais; compromissos;
  tarefas com prazo e duração; planejamento automático; adicionar rápido por texto; anexos;
  lembretes e notificações (chegam no relógio); ajuste manual de blocos; replanejamento.
- **Diferenciais (Fase 2):** matérias com notas, arquivos e progresso; aprender o ritmo real;
  ditar por voz; compartilhar do WhatsApp para o Prumo; widget; conta e sincronização;
  captura com IA (texto, foto, PDF); quebrar tarefa em passos; revisão espaçada até a prova.
- **Produto (Fase 3):** assinatura, Play Store, Turma (lista do professor compartilhada com a
  turma), modo Concurso (importar edital), bot de WhatsApp, iPhone.

## Métricas de sucesso

| Métrica | Como medir | Meta para o portão da Fase 1 |
|---|---|---|
| Ativação | % de novos usuários que adicionam 3+ itens no 1º dia | ≥ 50% |
| Retenção semana 4 | % que abriu o app na 4ª semana | ≥ 25% |
| Tarefas concluídas no prazo | concluídas até o prazo ÷ concluídas | ≥ 70% |
| Estabilidade | sessões sem erro `fatal` | ≥ 99% |
| Sinal qualitativo | testadores pedindo "quando sai?" ou indicando para amigos | presente |

As metas são do projeto (definidas pelo time), não padrões de mercado. Revisar após o primeiro teste.

## Fora do escopo (por enquanto)

- Editor de notas em blocos estilo Notion (texto simples + anexos resolve 90%).
- Integração com SIGAA (sem API pública; seria frágil). Moodle via assinatura de calendário: avaliar na Fase 3.
- Chat de IA genérico (proibido no WhatsApp desde 15/01/2026 e fora do foco).
