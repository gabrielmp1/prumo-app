# Fase 2 — Diferenciais

Só começa depois do portão G1. Antes da S8, rode `/planejar-sprint` e ajuste esta fase com o que os testadores pediram.

---

## Sprint 8 — Matérias e ritmo

### P2-S8-01 · Página da matéria — M

Como estudante, quero uma página por matéria com tudo dela, para não procurar em vários lugares.

**Critérios de aceite**
- Aba Matérias (pode ser desligada em Ajustes): cartão por matéria com horário, próxima aula, tarefas abertas, notas, próxima prova, % de tarefas feitas.
- Página: horários (editar), Notas, Próximos (importantes da matéria), Tarefas com progresso, Arquivos (todos os anexos ligados).
- Tocar numa aula na linha do tempo abre a matéria.
- Ligação por campo `subject`; compromisso sem matéria é ligado se o título contém o nome (regra do protótipo).

**Testes:** componente; regra de ligação (unidade); E2E aula → matéria → nova nota.

### P2-S8-02 · Notas da matéria — M
**Critérios de aceite:** criar/editar/excluir nota (título, texto, anexos); lista por data de edição; busca por texto dentro da matéria.
**Testes:** integração e componente; busca com acentos ("calculo" acha "Cálculo").

### P2-S8-03 · Aprender o ritmo — M

Como estudante, quero que o app aprenda quanto tempo eu realmente levo, para o plano ser realista.

**Critérios de aceite** (regra em `algoritmos.md`, seção Ritmo)
- Ao concluir tarefa: "Quanto tempo levou de verdade?" com opções (0,5x a 2x do estimado) e campo livre; "Pular".
- Fator = mediana de real ÷ estimado; por matéria com ≥ 2 amostras, senão geral com ≥ 3; limitado a 0,5–2,5; ignora se |f−1| < 0,08.
- Planejador usa a duração ajustada; telas mostram "Você estimou 3h; pelo seu ritmo, reservei 4h15."
- Pode desligar em Ajustes.

**Testes:** unidade do fator (tabela + propriedades: entre 0,5 e 2,5; mediana insensível a um valor extremo).
**Monitoramento:** `check` de fator dentro do limite (`PLN-006`).

### P2-S8-04 · Ferramentas de PDF e scanner dentro da matéria — M

Como estudante, quero transformar fotos do quadro em PDF e juntar ou separar PDFs da matéria sem sair do Prumo.

**Critérios de aceite** (tudo no aparelho, sem internet)
- **Escanear documento:** câmera com detecção de bordas e correção de perspectiva (scanner de documentos do sistema, ex. ML Kit no Android) → PDF anexado à matéria/tarefa.
- **Fotos → PDF:** escolher várias fotos e gerar um PDF na ordem escolhida.
- **Juntar PDFs**, **separar páginas** e **reduzir tamanho** (para enviar ao professor).
- Ferramentas aparecem onde fazem sentido (anexos de uma tarefa/nota/matéria e no menu "Compartilhar para o Prumo"), não numa aba própria.
- Avaliar (ADR) usar o motor de ferramentas do parceiro se ele funcionar offline e tiver licença compatível; senão, biblioteca própria (ex. pdf-lib).

**Testes:** unidade de juntar/separar com PDFs de exemplo (contagem de páginas, ordem); fotos → PDF com 1 e 20 imagens; teste de que nenhuma ferramenta usa rede.
**Monitoramento:** `TLS-001`.

---

## Sprint 9 — Adicionar sem digitar

### P2-S9-01 · Ditar por voz — M

Como estudante, quero tocar no microfone do Prumo e falar, usando o mesmo reconhecimento de voz do meu celular (o que o teclado Samsung/Google usa), sem instalar nada.

**Critérios de aceite**
- O botão de microfone chama o **serviço de reconhecimento de voz padrão do sistema** (API `SpeechRecognizer` do Android, via expo-speech-recognition), em pt-BR. É o mesmo motor que o teclado usa; o app não "aperta" o botão do teclado (nenhum app pode fazer isso).
- Preferir reconhecimento **no aparelho** quando disponível (funciona sem internet); senão, o serviço online do sistema.
- Texto aparece enquanto fala; ao parar, passa pelo parser e mostra a prévia "Entendi assim".
- Primeira vez: explica e pede a permissão de microfone. Negada → mostra "Toque na caixa de texto e use o microfone do teclado" e abre o teclado (caminho alternativo que não precisa de permissão).
- Se o aparelho não tiver serviço de reconhecimento: abre o teclado no campo e mostra a mesma dica.

**Testes:** módulo de voz simulado (parciais, final, erro, sem serviço, permissão negada); E2E com simulador de resultado; checklist manual em Samsung, Xiaomi e Motorola.
**Monitoramento:** `VOZ-001` falha do reconhecedor; `VOZ-002` permissão negada; `VOZ-003` aparelho sem serviço de reconhecimento.

### P2-S9-02 · Compartilhar para o Prumo — M

Como estudante, quero mandar uma mensagem, foto, PDF ou áudio do WhatsApp para o Prumo pelo botão Compartilhar.

**Critérios de aceite**
- O Prumo aparece no menu Compartilhar do Android (expo-share-intent) para texto, imagem, PDF e áudio.
- Texto → tela de revisão com o resultado do parser (ou da IA, após S11).
- Arquivos → escolher o item ao qual anexar ou criar tarefa nova com o anexo.
- Áudio: anexa; transcrição chega na S11.

**Testes:** unidade do roteamento por tipo; E2E com intenção simulada.
**Monitoramento:** `SHR-001` conteúdo não suportado; `SHR-002` falha ao copiar.

### P2-S9-03 · Widgets em três tamanhos e adicionar sem abrir o app — M

(Evolução do widget básico da P1-S7-04.)

Como estudante, quero ver e mexer nas coisas do dia direto na tela inicial, no tamanho que eu escolher.

**Critérios de aceite**
- Redimensionável pelo usuário, com três layouts:
  - **Pequeno (2×2):** bloco atual ou próximo item com horário + botão "+".
  - **Médio (4×2):** próximos 3 itens do dia com caixa de concluir + botões "+" e microfone.
  - **Grande (4×4):** dia inteiro em linha do tempo compacta + "Prazos da semana" + "+" e microfone.
- Concluir pelo widget sem abrir o app (Android 12+), com atualização imediata.
- "+" abre uma **janela rápida** por cima da tela inicial (só o campo de adicionar + prévia), não o app inteiro; microfone abre a mesma janela já ouvindo.
- Atualiza ao mudar dados, à meia-noite e a cada 30 min; respeita tema claro/escuro e cores das matérias.

**Testes:** unidade da função que monta o conteúdo de cada tamanho (dia vazio, dia cheio, texto longo); checklist manual em aparelho (Samsung One UI e outro fabricante).
**Monitoramento:** `WID-001` falha ao atualizar widget; `WID-002` ação do widget falhou.

### P2-S9-04 · Acesso rápido em todo o celular — M

Como estudante, quero adicionar ou ver o "agora" de qualquer lugar do celular, sem procurar o app.

**Critérios de aceite**
- **Notificação "Agora" (opcional, ligada em Ajustes):** fixa enquanto há um bloco em andamento — "Lista 3 de Cálculo · faltam 32 min" com barra de progresso e ações **Concluir** e **+ Adicionar**. Aparece também no relógio.
- **Bloco nas configurações rápidas** (o painel que desce do topo): botão "Adicionar ao Prumo" que abre a janela rápida.
- **Atalhos do ícone:** segurar o ícone do app mostra "Adicionar tarefa", "Falar" e "Hoje"; esses atalhos podem ser arrastados para a tela inicial ou para o painel de apps da borda da Samsung.
- Tudo funciona em qualquer marca de Android (são recursos padrão do sistema).

**Testes:** unidade do conteúdo da notificação "Agora" (início, meio, fim do bloco, sem bloco); checklist manual.
**Monitoramento:** `NTF-003` falha ao atualizar a notificação "Agora".

---

## Sprint 10 — Conta e sincronização (ponta a ponta)

> Ler `docs/07-seguranca-privacidade.md` antes de planejar esta sprint. Toda história desta sprint
> tem revisão de segurança no DoD e usa o checklist OWASP MASVS. O servidor só recebe dados cifrados.

### P2-S10-05 · Chave mestra e código de recuperação — M
**Critérios de aceite:** ao ativar a sincronização, o usuário escolhe "Máxima privacidade" ou "Recuperável" (doc 07); gera chave mestra no aparelho; mostra código de recuperação e exige confirmação de que foi guardado; envia ao servidor só a chave mestra cifrada com o código (Argon2id); tela explica que sem aparelhos e sem código não há recuperação.
**Testes:** derivação determinística com parâmetros fixos; código errado não abre; nada em texto claro sai (interceptação).
**Monitoramento:** `SEC-003`.

### P2-S10-06 · Adicionar aparelho por QR code — M
**Critérios de aceite:** no aparelho já conectado, "Conectar novo aparelho" mostra QR; o novo lê e recebe a chave mestra por canal cifrado com chave de sessão combinada entre os dois; alternativa: digitar o código de recuperação; lista de aparelhos conectados com opção de remover.
**Testes:** troca de chaves entre dois clientes simulados; QR expirado (2 min) recusado.

### P2-S10-01 · Backend Supabase — M
**Critérios de aceite:** projeto Supabase; tabelas espelhando o modelo local com `user_id`; RLS `user_id = auth.uid()` em todas; migrações SQL versionadas em `supabase/`.
**Testes:** testes de RLS (usuário A não lê nem escreve dados de B) rodando contra o Supabase local.

### P2-S10-02 · Login — P
**Critérios de aceite:** entrar com Google e com e-mail (link mágico); usar sem conta continua possível; ao entrar pela primeira vez, oferece enviar os dados locais.
**Monitoramento:** `AUT-001` falha de login.

### P2-S10-03 · Sincronização — G (quebrar)
**Critérios de aceite:** cada registro é cifrado no aparelho (XChaCha20-Poly1305, ID e versão como dados associados) antes de entrar na fila `sync_outbox`; o servidor guarda só ID aleatório, data de alteração, tamanho com preenchimento e o blob cifrado; envio em lote com nova tentativa exponencial; recepção incremental por `updated_at`; conflito: última escrita vence, exclusão vence edição; indicador "Sincronizado / Sincronizando / Sem internet".
**Testes:** propriedade: duas réplicas que recebem as mesmas operações em ordens diferentes convergem para o mesmo estado; integração com Supabase local; teste de modo avião.
**Monitoramento:** `SYN-001` falha de envio; `SYN-002` conflito resolvido (info); Autodiagnóstico `SYN-101`.

### P2-S10-04 · Anexos na nuvem — M
**Critérios de aceite:** anexo cifrado no aparelho antes do upload (nome do arquivo também cifrado); upload em segundo plano para pasta do usuário; download sob demanda em outro aparelho; política de armazenamento por usuário.
**Monitoramento:** `FIL-002` falha de upload.

---

## Sprint 11 — Captura com IA

### P2-S11-01 · Função de IA no servidor — M
**Critérios de aceite:** disponível no grátis (cota diária) e no pago (ampliada); bloqueada no Modo offline; na primeira vez, aviso claro de que o conteúdo é enviado para processamento e não é guardado; o app envia só o necessário (conteúdo + nomes das matérias) e recebe **comandos JSON** que executa localmente; o servidor processa em memória, não grava conteúdo nem o envia a logs; Edge Function `capture` chama a API da Anthropic (modelo rápido e barato, ex. Haiku) com o prompt de `algoritmos.md` (seção Captura); chave só no servidor; limite por usuário por dia (grátis/pago); registra uso (tokens) por usuário; responde JSON validado com zod.
**Testes:** unidade da normalização da resposta (itens inválidos descartados, datas/horas validadas); teste de contrato com respostas gravadas; teste de limite.
**Monitoramento:** `IA-001` falha da API; `IA-002` resposta inválida; `IA-003` limite atingido.

### P2-S11-02 · Tela Capturar — M
**Critérios de aceite:** colar texto, anexar fotos, PDFs (texto extraído no servidor; PDF escaneado vira imagens) e áudio (transcrição no servidor); revisão com marcar/desmarcar e editar títulos; anexar os arquivos aos itens criados; tudo desfazível.
**Testes:** componente com respostas simuladas; E2E com função simulada.

### P2-S11-03 · Transcrição de áudio — M
**Critérios de aceite:** áudio (inclusive .opus do WhatsApp) → texto pt-BR no servidor → fluxo de captura; limite de duração (ex.: 3 min) por áudio.
**Monitoramento:** `IA-004` falha de transcrição.

### P2-S11-04 · Quebrar em passos — P
**Critérios de aceite:** em uma tarefa, "Quebrar em passos" → IA sugere 3–8 passos com duração; o usuário edita; cada passo vira subtarefa planejada antes do prazo da tarefa-mãe.
**Testes:** planejador com subtarefas (prazo dos passos ≤ prazo da mãe — nova invariante).

---

## Sprint 12 — Estudar de verdade

### P2-S12-01 · Revisão espaçada até a prova — G (quebrar)

Como estudante, quero que o app agende revisões das minhas notas até a prova, para eu chegar preparado.

**Critérios de aceite**
- Da nota, a IA gera perguntas e respostas (cartões) — o usuário revisa antes de salvar.
- Sessões de revisão viram tarefas automáticas com intervalos crescentes (1, 3, 7, 14 dias…), comprimidos para terminar antes da prova da matéria.
- Ao revisar, "Errei / Difícil / Acertei" ajusta o próximo intervalo.

**Testes:** unidade do agendador de revisões (propriedade: última revisão antes da prova; intervalos não decrescem sem erro).

### P2-S12-02 · Tempo visível — M
**Critérios de aceite:** no Dia, o bloco atual mostra um anel que diminui até o fim; também no widget; opção de som/vibração suave no fim; respeita "reduzir movimento".
**Testes:** componente com relógio falso (25%, 50%, fim).
