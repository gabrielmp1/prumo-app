# Referência — Algoritmos do Prumo

Especificação das regras do `src/core`. Os exemplos com resultado esperado foram obtidos rodando
o protótipo (`prototipo-prumo.html`) com relógio fixo e viram **testes de aceite** no Sprint 2 e 3.
Onde está marcado **(correção)**, o app deve se comportar diferente do protótipo, que tinha um defeito.

Convenções: datas `YYYY-MM-DD` (fuso local), horas `HH:MM`, durações em minutos.
Nomes no protótipo → no app: `tarefa` = `task`, `compromisso` = `event`, `aula` = `class`, `nota` = `note`, `dur` = `estimate_min`, `skip` = `skips`.
"Agora" = `now` passado como parâmetro. Nos exemplos: **segunda-feira 02/11/2026, 08:00**.
Configuração padrão: dia das 07:00 às 23:00, máximo de tarefas por dia 180 min, período "qualquer", ritmo desligado.

---

## 1. Ocorrências de um dia — `occurrencesOn(day, items)`

- Aula/obrigação fixa aparece se `weekday(day) ∈ weekdays` e (`until` vazio ou `day ≤ until`).
- Compromisso aparece se `date = day`.
- Sem `start` → "dia todo" (não ocupa horário). Com `start` e sem `end` válido (ou `end ≤ start`) → `end = start + 60`.
- Ordem: com horário primeiro, por início; depois os de dia todo.

## 2. Planejador — `plan(items, settings, now) → { byDay, meta }`

### Entradas por tarefa
`due`, `estimate_min`, `done`, `log` (dia → minutos feitos), `pins` (dia → {start?, min}), `skips` (dias), `subject`.

### Capacidade do dia `cap(d)`
```
se d ∈ settings.blockedDays: 0
lo = dayStart; hi = dayEnd
se d = hoje: lo = max(lo, agora)
ocupado = Σ sobreposição de cada ocorrência com horário com [lo, hi]
cap = max(0, min(settings.maxTaskMin, (hi − lo) − ocupado))
```
A capacidade é consumida à medida que blocos são atribuídos (pode ficar negativa só por fixados; trate como 0 para novos blocos).

### Algoritmo
```
tarefas = itens tipo tarefa ordenados por due ascendente (sem prazo = hoje+7, vai por último)
para cada tarefa t:
  registra blocos "feitos" de t.log (para exibição)
  need = duração ajustada pelo ritmo (seção 5)
  se t.done: continua
  rem = max(0, need − Σ log)
  se rem = 0: continua

  # 1) fixados primeiro
  para cada (d, pin) em t.pins ordenado por d:
    se d < hoje ou d ∈ log: ignora
    g = min(pin.min, rem); cap[d] −= g; rem −= g; bloco fixado (com pin.start se houver)

  elegível(d) = d ∉ log e d ∉ skips e d ∉ pins e d ∉ blockedDays

  se due < hoje:                       # atrasada
     overdue = true; dias = [primeiro dia elegível entre hoje e hoje+13]
  senão:
     dias = todos os dias elegíveis de hoje até due
     se len(dias) > 1 e último = due: remove due     # folga: não deixar para o dia do prazo

  # 2) espalhar
  para i, d em dias:
     share = max(45, arredonda_para_cima_15(rem / (len(dias) − i)))
     g = min(share, cap_livre(d), rem)
     se g > 0: bloco(d, g); cap[d] −= g; rem −= g

  # 3) completar onde houver folga (incluindo o dia do prazo, se elegível e não atrasada)
  para d em dias (+ due):
     g = min(cap_livre(d), rem); soma ao bloco não fixado existente de t em d ou cria um

  se rem > 0:
     short = rem → reportWarning('PLN-003')
     se overdue: coloca o resto no primeiro dia mesmo acima da capacidade (o usuário vê o aviso)
```

### Cenários de aceite (resultado esperado)

| # | Situação | Esperado |
|---|---|---|
| A | Tarefa 240 min, prazo sex 06/11, semana livre | seg 60 · ter 60 · qua 60 · qui 60 (sexta fica de folga) |
| B | 300 min, prazo amanhã (ter 03/11) | seg 180 · ter 120 (dia do prazo usado na 2ª passada) |
| C | 60 min, prazo ontem | seg 60, `overdue = true` |
| D | 240 min, prazo sex, terça bloqueada | seg 90 · qua 75 · qui 75 |
| E | 240 min, prazo sex, fixado ter 20:00 60 min | seg 60 · ter 60 (fixo) · qua 60 · qui 60 |
| F | 240 min, prazo sex, "não neste dia" na segunda | ter 90 · qua 75 · qui 75 |
| G | 240 min, prazo sex, 60 min já feitos na segunda | ter 60 · qua 60 · qui 60 (segunda só mostra o feito) |
| H | H1 300 min prazo qua 04/11; H2 300 min prazo qui 05/11 | seg H1 150 + H2 30 · ter H1 150 + H2 30 · qua H2 180 · qui H2 60 |
| I | 600 min, prazo amanhã | seg 180 · ter 180 · `short = 240` |
| J | Ritmo ligado; 120 min de Cálculo; histórico Cálculo 150/100 e 130/100 | ver seção 5 |

## 3. Encaixe no dia — `schedule(day, blocks, occurrences, settings, now)`

```
ocupados = ocorrências com horário + blocos fixados com start (estes ficam exatamente no horário)
cursor = dayStart; se day = hoje: cursor = max(cursor, arredonda_para_cima_15(agora)); se day < hoje: nada
intervalos = buracos entre ocupados, de cursor até dayEnd, com ≥ 15 min
se settings.focus ≠ qualquer: divide intervalos na fronteira do período
   (manhã 06:00–12:00, tarde 12:00–18:00, noite 18:00–24:00) e usa os do período primeiro
para cada bloco não fixado (na ordem do plano):
   preenche intervalos em ordem; pode dividir um bloco em dois pedaços
   o que sobrar vai para loose
```

| # | Situação (seg 02/11, agora 08:00) | Esperado |
|---|---|---|
| K1 | Aula 14:00–15:40, dentista 17:00–18:00, tarefa 180 min prazo amanhã, período "qualquer" | bloco 08:00–11:00 |
| K2 | Igual, período "noite" | bloco 18:00–21:00 |
| K3 | Igual, dia termina às 15:00 | bloco 08:00–11:00 (capacidade 180 ainda cabe antes da aula) |

## 4. Invariantes (usadas em testes de propriedade e no Autodiagnóstico)

1. Nenhum bloco em dia anterior a hoje (exceto registros de feito).
2. Bloco não fixado nunca em dia bloqueado, dia pulado, dia com registro de feito daquela tarefa.
3. Σ blocos não fixados de um dia ≤ capacidade do dia — exceto o "resto" de tarefa atrasada.
4. Tarefa não atrasada: nenhum bloco depois de `due`.
5. Σ planejado + Σ feito + short = need.
6. Tarefa concluída: nenhum bloco novo.
7. `schedule`: sem sobreposição com ocupados nem entre blocos; tudo dentro de [dayStart, dayEnd].
8. Determinismo.

## 5. Ritmo — `rhythmFactor(subject, history)`

```
amostras = tarefas concluídas com actual > 0 e estimate > 0
razões = actual / estimate
se há ≥ 2 amostras da matéria: f = mediana(razões da matéria)
senão se há ≥ 3 amostras no total: f = mediana(todas)
senão f = 1
f = limita(f, 0.5, 2.5); se |f − 1| < 0.08: f = 1
need = f = 1 ? estimate : arredonda_15(estimate × f)   (mínimo 15)
```
**(correção)** Mediana com quantidade par = média dos dois do meio. O protótipo usava o elemento
superior. Cenário J: razões 1,5 e 1,3 → f = 1,4 → need = arredonda_15(168) = **165** min
(o protótipo dava 180). Distribuição esperada (prazo seg 09/11, semana livre):
seg 02/11 45 · ter 45 · qua 45 · qui 30 (blocos mínimos de 45 min; o resto vai no último).

## 6. Adicionar rápido — `parseQuickAdd(text, now, subjects)`

Ordem de reconhecimento (cada trecho reconhecido é removido do título):

1. Importante: palavra `importante` ou `!`.
   **(correção)** Também marcam importante: `prova`, `p1`/`p2`/`p3`, `entrega`, `apresentação`, `seminário`.
2. Prazo: `até`/`ate`/`prazo` → o item é tarefa.
3. Data: `dd/mm` ou `dd/mm/aa(aa)`; sem ano e já passada → próximo ano. Depois: `depois de amanhã`,
   `amanhã`, `hoje`, dia da semana (`segunda`…`domingo`, com ou sem `-feira`, `próxima`) → próxima ocorrência (hoje conta).
4. Duração: `N min`/`N minutos`; `N horas`/`N hora` **sempre**; `Nh`/`NhMM` só quando houver prazo (`até`).
   **(correção)** No protótipo, "2 horas" sem "até" não era reconhecido.
5. Hora: `às`/`as`/`das` + `H`, `H:MM`, `HhMM`, `Hh`; sem prazo, `H:MM`, `Hh` ou `HhMM` soltos também são hora.
6. Resultado:
   - Com hora e sem prazo → **compromisso** (fim = início + 60 min, lembrete 10 min).
   - **(correção)** Com palavra de prova/entrega, data e sem hora e sem "até" → **compromisso de dia todo, importante**.
   - Senão → **tarefa** (prazo = data ou hoje+7; duração = reconhecida ou 60).
   - Matéria: se o título contém a primeira palavra (sem acento, minúsculas) de uma matéria cadastrada.
   - Título: o que sobrou, sem espaços/pontuação nas pontas, primeira letra maiúscula; vazio → "Nova tarefa".

### Casos de aceite (agora = seg 02/11/2026 08:00; matéria cadastrada "Cálculo I")

| Texto | Esperado |
|---|---|
| Lista 4 de Cálculo até 05/11 3h | tarefa "Lista 4 de Cálculo", prazo 2026-11-05, 180 min, matéria Cálculo I |
| Reunião sexta às 15h | compromisso "Reunião", 2026-11-06 15:00–16:00 |
| Dentista amanhã 14:30 importante | compromisso importante "Dentista", 2026-11-03 14:30–15:30 |
| ler artigo 45min | tarefa "Ler artigo", prazo 2026-11-09, 45 min |
| Prova 01/02 | **(correção)** compromisso importante dia todo "Prova", 2027-02-01 |
| entregar relatorio ate 10/11 | tarefa "Entregar relatorio", prazo 2026-11-10, 60 min |
| Academia hoje 18h30 | compromisso "Academia", 2026-11-02 18:30–19:30 |
| Comprar livro | tarefa "Comprar livro", prazo 2026-11-09, 60 min |
| Trabalho de física depois de amanhã 2 horas | **(correção)** tarefa "Trabalho de física", prazo 2026-11-04, 120 min |
| Call 9h | compromisso "Call", 2026-11-02 09:00–10:00 |
| Seminário de Cálculo quinta | **(correção)** compromisso importante dia todo, 2026-11-05, matéria Cálculo I |

Propriedade: para qualquer texto (inclusive vazio, emojis, 2.000 caracteres), o parser não lança
exceção e devolve título não vazio com no máximo 140 caracteres.

## 7. "Ficou para trás"

Guardar `{ data: hoje, porTarefa: minutos planejados para hoje }` a cada planejamento do dia.
Na próxima abertura em dia posterior: para cada tarefa ainda aberta, `perdido = planejado − feito naquele dia`.
Se Σ perdido > 0 → aviso no topo do dia. O planejador já redistribui sozinho (o passado nunca recebe blocos).

## 8. Agendador de notificações — `expectedNotifications(items, settings, now, horizonDays = 14)`

Função pura que devolve a lista do que DEVE estar agendado: para cada compromisso com `start` e
`remind_min > 0` nos próximos 14 dias, `{ itemId, date, fireAt = início − remind_min, título, corpo }`;
ignora `fireAt` no passado. A camada `platform/notifications.ts` compara com o que está agendado
(`notifications_map`) e agenda/cancela a diferença. O Autodiagnóstico `NTF-101` usa a mesma função.

## 9. Captura com IA (Fase 2) — contrato

Prompt base (servidor): o do protótipo (`capturePrompt`), com hoje, dia da semana, matérias cadastradas
e as regras: datas relativas convertidas; sem prazo → 7 dias; provas/entregas importantes + tarefa
"Estudar para …" no dia anterior; grade de horários vira aulas; não inventar; responder só um array JSON.

Resposta aceita (após validação zod; itens inválidos são descartados e contados em `IA-002`):

```json
[{"kind":"task","title":"…","due":"YYYY-MM-DD","estimate_min":120,"subject":"…","notes":"…"},
 {"kind":"event","title":"…","date":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","place":"","important":true,"subject":"…"},
 {"kind":"class","title":"…","weekdays":[1,3],"start":"HH:MM","end":"HH:MM","place":"…"}]
```

Normalização: título 1–140 caracteres; data inválida → hoje (evento) ou hoje+7 (tarefa); duração
limitada a 15–1200 e arredondada a 15; aula sem dias ou sem início é descartada; aula com mesmo
nome de uma existente vem desmarcada com aviso "Já existe".
