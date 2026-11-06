# Fase 1 — MVP local

Tudo funciona no aparelho, sem conta e sem internet. A referência de comportamento é o protótipo
(`docs/referencia/prototipo-prumo.html`) e a especificação dos algoritmos
(`docs/referencia/algoritmos.md`). Onde o protótipo e este backlog divergirem, vale o backlog.

---

## Sprint 1 — Dados confiáveis no aparelho

### P1-S1-01 · Esquema do banco e migrações — M

Como usuário, quero que minhas coisas fiquem salvas no celular mesmo sem internet.

**Critérios de aceite**
- Tabelas `items`, `attachments`, `settings`, `notifications_map` conforme doc 02 (Drizzle).
- Migrações versionadas rodam na abertura; falha → `DAT-001` (fatal) e tela "Não consegui abrir seus dados" com "Tentar de novo" e "Copiar relatório".
- Exclusão lógica (`deleted_at`) para todos os itens.

**Testes:** integração com SQLite em memória: banco novo migra até a última versão; migração de uma versão anterior preserva dados (fixture); falha simulada reporta `DAT-001`.
**Autodiagnóstico:** `DAT-103` versão do esquema = esperada.

### P1-S1-02 · Validação de dados com zod — P

Como desenvolvedor, quero que todo dado inválido seja barrado e isolado, para uma linha ruim não quebrar o app.

**Critérios de aceite**
- Um schema zod por `kind`; `validation.ts` é a fonte única dos tipos (tipos derivados com `z.infer`).
- Escrita inválida é rejeitada com `DAT-002` e mensagem amigável ("Não consegui salvar: falta a data.").
- Leitura inválida: item vai para quarentena (não aparece nas telas, aparece no Autodiagnóstico `DAT-101`).

**Testes:** casos válidos e inválidos por `kind` (data `2026-13-01`, hora `25:00`, `weekdays` vazio, duração 0); propriedade: qualquer item gerado pelas fábricas válidas passa.

### P1-S1-03 · Repositórios de itens e configurações — M

Como desenvolvedor, quero uma camada simples para ler e gravar, para as telas não falarem com SQL.

**Critérios de aceite**
- `itemsRepo`: `create`, `update`, `softDelete`, `restore` (desfazer), `getById`, `listByKind`, `listRange(de, ate)`, `observe()` (assinatura reativa para as telas).
- `settingsRepo` com padrões: início do dia 07:00, fim 23:00, máximo de tarefas por dia 3h, período preferido "qualquer", aprender ritmo ligado, matérias ligado.
- `updated_at` sempre atualizado; operações em transação.
- Falhas reportam `DAT-003` com o `kind` e a operação (sem o título).

**Testes:** integração completa de cada método; `observe` emite após escrita; desfazer restaura exatamente o item.

### P1-S1-04 · Dados de exemplo — P

Como pessoa que acabou de instalar, quero ver um exemplo realista, para entender o app sem ler manual.

**Critérios de aceite**
- Gerador com datas relativas a hoje (mesmo conjunto do protótipo: 3 aulas, 1 obrigação fixa, 4 compromissos, 4 tarefas, 2 concluídas com tempo real, 2 notas).
- Itens de exemplo marcados `sample = true`; banner "Você está vendo exemplos" com "Apagar exemplos" (com desfazer).
- Na Central de Erros (dev): "Gerar dados de exemplo".

**Testes:** gerador é determinístico para um `now` fixo; apagar remove só os de exemplo.

### P1-S1-05 · Banco e anexos criptografados no aparelho — M

Como estudante, quero que, se alguém copiar os arquivos do meu celular, não consiga ler minhas coisas.

**Critérios de aceite**
- Banco com SQLCipher; chave de 256 bits gerada na primeira abertura e guardada no Keystore (expo-secure-store).
- Anexos cifrados com XChaCha20-Poly1305 (libsodium) ao salvar; decifrados só em memória/arquivo temporário ao abrir, apagado depois.
- Banco e anexos excluídos do backup automático do Android.
- Chave indisponível → `SEC-002` e tela de recuperação explicando o que houve (sem apagar dados).

**Testes:** cifrar/decifrar; alterar 1 byte → falha (`SEC-001`); vetores oficiais da libsodium; arquivo do banco lido sem a chave não contém os títulos de exemplo (integração).
**Autodiagnóstico:** `SEC-101`.

### P1-S1-06 · Camada de rede única e bloqueada — P

Como usuário do plano grátis, quero a garantia de que nada sai do meu celular.

**Critérios de aceite**
- `src/platform/net.ts` é o único lugar com acesso à rede; cada chamada declara a função (`sync`, `ai`, `errors`, `analytics`, `whatsapp`) e só passa se o interruptor dela estiver ligado.
- Tentativa bloqueada → `NET-001` (aparece na Central em dev) e erro amigável.
- Interruptor geral **Modo offline** (bloqueia todas as funções de rede) em Ajustes → Privacidade.
- Na Fase 1 nenhuma função de rede está implementada; a camada já existe e é testada.

**Testes:** teste de arquitetura (nenhum `fetch`/`XMLHttpRequest`/`WebSocket` fora de `net.ts`); unidade do bloqueio por função.

---

## Sprint 2 — O cérebro: ocorrências e planejador

(Somente `src/core`. Sem tela. Especificação completa em `docs/referencia/algoritmos.md`.)

### P1-S2-01 · Datas e semana — P

**Critérios de aceite:** funções `addDays`, `diffDays`, `mondayOf`, `weekdayOf`, `isBefore` sobre strings `YYYY-MM-DD`; nomes em pt-BR; virada de mês, ano e horário de verão não quebram.
**Testes:** tabela de casos + propriedade `diffDays(a, addDays(a, n)) === n`.

### P1-S2-02 · Ocorrências de um dia — P

Como usuário, quero que minhas aulas apareçam toda semana no dia certo, sem cadastrar uma por uma.

**Critérios de aceite**
- `occurrencesOn(day, items)` devolve aulas da semana (respeitando `until`) e compromissos da data, ordenados; compromissos sem horário são "dia todo" e vêm separados.
- Fim antes do início → duração padrão de 60 min e `reportWarning('PLN-004')`.

**Testes:** aula seg/qua aparece só seg/qua; `until` passado some; ordenação; dia todo.

### P1-S2-03 · Planejador: distribuir tarefas nos dias — G (quebrar em 3 se preciso)

Como estudante, quero que o app distribua minhas tarefas até o prazo, para eu não deixar tudo para a última hora.

**Critérios de aceite** (comportamento do protótipo, `plan()`)
- Capacidade do dia = mín(máximo configurado, minutos livres entre início e fim do dia descontando aulas e compromissos); hoje começa do "agora".
- Tarefas por prazo mais próximo primeiro; blocos de no mínimo 45 min (exceto sobra); deixa o dia do prazo como folga quando há outros dias.
- Segunda passada preenche dias com folga, inclusive o dia do prazo, se ainda faltar.
- Tarefa atrasada: replaneja a partir de hoje e marca `overdue`.
- Se não couber: `short` = minutos que faltam; `reportWarning('PLN-003')`.
- Respeita: dias bloqueados (configuração), dias pulados da tarefa (`skips`), blocos fixados (`pins`, alocados primeiro), dias com registro de feito (`log`).
- Tarefa concluída não recebe blocos.

**Testes:** cenários da tabela em `algoritmos.md` + as 8 propriedades do doc 03 com fast-check (mínimo 500 execuções cada).
**Monitoramento:** `check()` das invariantes ao fim de `plan()` → `PLN-001`. Autodiagnóstico `PLN-101`.

### P1-S2-04 · Encaixe no dia: horários dos blocos — M

Como estudante, quero ver em que horário fazer cada bloco, respeitando quando eu rendo mais.

**Critérios de aceite**
- `schedule(day, blocks, settings, now)` coloca blocos fixados com horário exatamente onde estão; os demais nos intervalos livres (≥ 15 min).
- Com preferência (manhã 06–12, tarde 12–18, noite 18–24), intervalos dentro do período são usados primeiro.
- Bloco que não cabe no dia vai para `loose` (mostrado como "não coube").
- Hoje: nada antes do "agora" arredondado para 15 min. Dias passados: nada.

**Testes:** casos fixos + propriedades: sem sobreposição; dentro do início/fim; soma colocada + loose = soma pedida.
**Monitoramento:** `PLN-002`.

### P1-S2-05 · Desempenho do planejador — P

**Critérios de aceite:** `plan()` com 300 tarefas, 40 aulas e 120 dias abaixo do orçamento do doc 03 (benchmark no Jest como referência relativa); `measure()` envolve a chamada no app.
**Testes:** benchmark que falha se piorar mais de 2x em relação à linha de base salva.

---

## Sprint 3 — Tela Dia e adicionar rápido

### P1-S3-01 · Faixa de 7 dias e navegação — P

**Critérios de aceite:** 3 dias antes e 3 depois do selecionado; pontos coloridos por tipo (aula, compromisso, tarefa, prazo); setas pulam semana; botão "Hoje" quando fora de hoje; dia bloqueado com hachura.
**Testes:** componente com relógio fixo; E2E: tocar num dia muda a tela.

### P1-S3-02 · Linha do tempo do dia — M

Como estudante, quero abrir o app e ver meu dia em ordem, com aulas, compromissos e blocos de tarefa.

**Critérios de aceite**
- Cabeçalho: "Quarta, 28 de outubro" + resumo ("2 aulas · 1 compromisso · 3h de tarefas").
- Itens em ordem de horário; intervalos ≥ 30 min mostram "livre · 1h30"; linha "Agora · 15:00" (só hoje).
- Blocos de tarefa com aparência diferente (tracejado); fixados com cadeado.
- Itens "dia todo" e "Prazo hoje" como chips no topo.
- "Não coube no horário livre: …" quando houver `loose`.
- Estado vazio: "Nada marcado neste dia. Escreva acima ou toque em +."

**Testes:** componente (vazio, normal, com loose, dia passado); E2E abre o app e vê o dia.

### P1-S3-03 · Painéis Compromissos importantes e Prazos — P

**Critérios de aceite:** importantes futuros (até 8) com data e "em 2 dias"; prazos com progresso (feito/necessário), aviso de atraso ou "faltam 2h que não cabem"; marcar "feita". No celular, ficam abaixo da linha do tempo (Prazos antes de Importantes).
**Testes:** componente com dados de exemplo; marcar feita → some da lista e mostra "Desfazer".

### P1-S3-04 · Adicionar rápido por texto — M

Como estudante, quero escrever do meu jeito e o app entender, para adicionar em segundos.

**Critérios de aceite** (regras em `algoritmos.md`, seção Parser)
- "Lista 4 de Cálculo até 05/11 3h" → tarefa, prazo 05/11, 180 min, matéria Cálculo (se existir aula com "Cálculo").
- "Reunião sexta às 15h" → compromisso na próxima sexta 15:00–16:00.
- "Dentista amanhã 14:30 importante" → compromisso importante.
- Sem data: tarefa com prazo em 7 dias, 60 min, e `reportWarning('QAD-001')` só se nada foi reconhecido além do título.
- Depois de adicionar: a tela leva até o item e o destaca por 3 s; mensagem diz onde ele foi parar ("Tarefa criada, prazo 05/11. Está em Prazos e já tem tempo reservado nos dias até lá." + "Editar").

**Testes:** tabela com ≥ 40 frases reais em pt-BR (inclusive sem acento, "ate", "às", "as", "18h30", "depois de amanhã", datas que já passaram no ano → próximo ano); propriedade: o parser nunca lança exceção e sempre devolve título não vazio.
**Monitoramento:** `QAD-001`; frase original NÃO vai para o relatório (só tamanho e quais regras casaram).

---

## Sprint 4 — Criar, editar, excluir, anexar

### P1-S4-01 · Formulário de item (botão +) — M

**Critérios de aceite:** tipos Tarefa / Compromisso / Aula ou fixo; campos por tipo (como no protótipo); validação com mensagens claras; dias da semana para aulas; lembrete para compromissos; matéria com sugestões; salvar leva até o item.
**Testes:** componente por tipo; validação; E2E criar uma aula seg/qua 14:00 e vê-la na segunda.

### P1-S4-02 · Editar, excluir e desfazer — P

**Critérios de aceite:** tocar em item abre edição; excluir mostra "Excluído · Desfazer" por 5 s; renomear uma aula atualiza a matéria das tarefas ligadas.
**Testes:** integração editar/excluir/restaurar; propagação do nome da matéria.

### P1-S4-03 · Anexos (foto, PDF, vídeo, áudio, documento) — M

Como estudante, quero anexar a foto da lista ou o PDF do professor à tarefa.

**Critérios de aceite**
- Câmera, galeria e arquivos (expo-image-picker, expo-document-picker); copia para a pasta do app.
- Miniatura para imagem; ícone com extensão para os demais; abrir com visualizador do sistema.
- Remover anexo só apaga o arquivo ao salvar; cancelar descarta os novos.
- Limite de 100 MB por arquivo com mensagem clara.

**Testes:** integração com sistema de arquivos simulado; cancelar não deixa arquivo órfão.
**Monitoramento:** `FIL-001`; Autodiagnóstico `DAT-102` (anexo sem arquivo) e `FIL-101` (arquivo sem anexo).

---

## Sprint 5 — Semana, Mês e Ano

### P1-S5-01 · Semana — P
**Critérios de aceite:** 7 colunas (1 coluna empilhada no celular); prazos, aulas, compromissos e blocos; tocar no dia abre o Dia.
**Testes:** componente; E2E.

### P1-S5-02 · Mês — P
**Critérios de aceite:** grade seg–dom; importantes e prazos por dia; barra de carga de tarefas; no celular, pontos em vez de textos.
**Testes:** componente com meses de 28/30/31 dias e começando em domingo.

### P1-S5-03 · Ano — P
**Critérios de aceite:** 12 mini-meses; prazos e importantes marcados; tocar no mês abre o Mês, no dia abre o Dia.
**Testes:** componente; ano bissexto.

---

## Sprint 6 — Lembretes e controle do plano

### P1-S6-01 · Notificações de compromissos e aulas — M

Como estudante, quero ser avisado no celular e no relógio antes de cada compromisso.

**Critérios de aceite**
- Pedido de permissão explicado antes ("Para avisar 10 min antes dos seus compromissos").
- Agenda notificações locais pelo `remind_min` (compromissos) e opcional para aulas.
- Reagenda ao editar/excluir; mantém só os próximos 14 dias agendados (limite do sistema) e renova ao abrir o app.
- Texto: "Em 10 min: Prova de Cálculo · Sala B-204".
- Teste em aparelho real com Galaxy Watch (checklist manual) e orientação para desligar a economia de bateria para o Prumo.

**Testes:** unidade do "agendador" (função pura que calcula o que deve estar agendado) + integração com módulo simulado.
**Monitoramento:** `NTF-001`, `NTF-002`; Autodiagnóstico `NTF-101` (agendado ≠ esperado).

### P1-S6-02 · Ajustar um bloco (fixar, mover, adiar, feito) — M

Como estudante, quero mudar um bloco sugerido, porque eu é que mando no meu dia.

**Critérios de aceite:** tocar no bloco abre folha com: marcar feito (registra no `log`), fixar horário e duração (`pins`), mover para outro dia, "não neste dia" (`skips`), soltar fixação, abrir tarefa; tudo com "Desfazer".
**Testes:** integração de cada ação + verificação de que o `plan()` seguinte respeita a ação.
**Monitoramento:** invariantes já cobrem; `PLN-005` se uma ação produzir pin no passado.

### P1-S6-03 · Dia bloqueado — P
**Critérios de aceite:** botão "Não consigo fazer tarefas neste dia" / "Liberar este dia"; tarefas redistribuídas; aviso confirmando.
**Testes:** integração + propriedade já existente.

### P1-S6-04 · "Ficou para trás" — P
**Critérios de aceite:** guardar o plano de hoje; no dia seguinte, se algo planejado não foi feito, mostrar "Ficaram 1h30 sem fazer em 28/10. Já redistribuí nos próximos dias." com "Entendi". Sem culpa, sem contador de falhas.
**Testes:** unidade da comparação plano anterior × registros.

---

## Sprint 7 — Pronto para testadores

### P1-S7-01 · Primeira abertura guiada — M
**Critérios de aceite:** 3 passos: cadastrar aulas (ou pular), adicionar a primeira tarefa com prazo, permitir notificações; termina na tela Dia com o plano já feito.
**Testes:** E2E do fluxo completo; métrica de ativação registrada localmente (sem internet ainda).

### P1-S7-02 · Endurecimento — M
**Critérios de aceite:** zero erros `fatal` e `error` sem explicação na Central após 1 semana de uso próprio; Autodiagnóstico 100% verde com dados reais; orçamentos de desempenho cumpridos; textos revisados.
**Testes:** suíte E2E completa passando; teste de "monkey" (toques aleatórios) por 5 min sem `fatal`.

### P1-S7-04 · Widget do dia (versão 1) — M

Como estudante, quero ver as tarefas de hoje na tela inicial sem abrir o app.

**Critérios de aceite:** widget médio (4×2) com o bloco atual/próximo e os 3 próximos itens do dia; botão "+" que abre o app direto no adicionar; tocar num item abre o Dia; atualiza ao mudar dados e a cada 30 min. (Tamanhos e ações sem abrir o app vêm na P2-S9-03.)
**Testes:** unidade da função que monta o conteúdo; checklist manual no Samsung.
**Monitoramento:** `WID-001`.

### P1-S7-05 · Bloqueio do app e privacidade na tela — P
**Critérios de aceite:** opção de biometria/PIN ao abrir e após 5 min em segundo plano; opção de esconder conteúdo na lista de apps recentes e em capturas; notificações e widgets com modo "sem títulos na tela de bloqueio"; tela **Privacidade** em Ajustes listando cada função de rede e seu estado (todas desligadas na Fase 1).
**Testes:** componente da tela Privacidade; unidade do conteúdo "sem títulos".

### P1-S7-06 · Exportar e importar backup cifrado — P
**Critérios de aceite:** exportar tudo (itens + anexos) num arquivo protegido por senha (Argon2id + XChaCha20-Poly1305); importar em outro aparelho; aviso de que sem a senha não há como abrir.
**Testes:** ida e volta completa; senha errada → mensagem clara, nada importado.

### P1-S7-03 · Distribuição para testadores — P
**Critérios de aceite:** build interno (EAS) distribuído pelo teste interno do Google Play para 30–50 pessoas; botão "Enviar comentário" (abre e-mail/formulário com versão); Central de Erros acessível para quem você autorizar; roteiro de entrevista curta para a semana 1 e 4.
