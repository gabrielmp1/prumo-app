# Fase 3 — Produto

Só começa depois do portão G3. Esta fase envolve contas, custos e regras de terceiros:
cada sprint começa conferindo preços e políticas atuais (Google Play, Meta, Anthropic, Supabase).

---

## Sprint 13 — Pronto para o público

### P3-S13-01 · Assinatura — M
**Critérios de aceite:** RevenueCat + Google Play Billing; plano grátis (agenda completa, limites de IA) e pago (IA ampliada, sincronização de anexos grandes, WhatsApp na S17); tela de planos clara; restaurar compra; período de teste.
**Testes:** unidade das regras de acesso por plano (função pura `can(feature, plan, usage)`); sandbox de compras.
**Monitoramento:** `PAY-001` falha de compra; `PAY-002` assinatura inconsistente.

### P3-S13-02 · Termos, privacidade e LGPD — M
**Critérios de aceite:** termos de uso e política de privacidade em pt-BR (revisão jurídica recomendada); consentimento no cadastro; exportar todos os dados (JSON + anexos); excluir conta e dados; lista de operadores (Supabase, Anthropic, Sentry, RevenueCat, PostHog).
**Testes:** exclusão de conta remove dados no servidor (teste de integração); exportação contém todos os tipos.

### P3-S13-03 · Central de Erros → produção (Sentry) — M
**Critérios de aceite:** perguntado na primeira abertura e alterável em Ajustes → Privacidade; todos os itens da seção "Passagem para produção" do doc 04.
**Testes:** `scrub()` (casos com título, e-mail, telefone, caminho de arquivo); build `prod` sem rota `/dev/erros`; evento de teste chega ao Sentry no ambiente de homologação.

### P3-S13-04 · Analytics de produto — P
**Critérios de aceite:** eventos anônimos (instalou, ativou, adicionou item, concluiu tarefa, abriu na semana N); sem conteúdo do usuário; opção de desligar.
**Testes:** unidade: nenhum evento contém campos de texto livre.

---

### P3-S13-05 · Auditoria de segurança — M
**Critérios de aceite:** modelo de ameaças atualizado; checklist OWASP MASVS completo; teste de invasão/auditoria externa do módulo de criptografia e da sincronização; falhas críticas corrigidas antes do lançamento do plano pago; módulo de criptografia e camada de rede publicados como código aberto.

### P3-S13-06 · Modo offline verificável — P
**Critérios de aceite:** com o Modo offline ligado, suíte E2E roda com a rede do emulador bloqueada e nenhuma chamada sai (teste automatizado); tela Privacidade mostra o histórico das últimas chamadas de rede (função, data, tamanho, sem conteúdo).

## Sprint 14 — Lançamento

### P3-S14-01 · Página na Play Store — P
**Critérios de aceite:** nome, descrição, capturas de tela, vídeo curto, classificação, formulário de segurança de dados coerente com a política.

### P3-S14-02 · Teste aberto → produção — P
**Critérios de aceite:** teste aberto por 2 semanas; taxa de sessões sem `fatal` ≥ 99%; nenhum erro novo sem triagem; lançamento gradual (10% → 50% → 100%).

### P3-S14-03 · Suporte — P
**Critérios de aceite:** "Relatar um problema" com consentimento; e-mail de suporte; FAQ dentro do app.

---

## Sprint 15 — Turma

### P3-S15-01 · Criar e entrar numa turma — M
**Critérios de aceite:** criar turma ligada a uma matéria; convite por link/código; papéis: criador e membros; sair da turma.
**Testes:** RLS: membro lê itens da turma; não-membro não lê.

### P3-S15-02 · Publicar para a turma — M
**Critérios de aceite:** qualquer membro publica tarefa/prova/aviso; todos recebem na própria agenda como cópia ligada; atualização do original avisa os membros; cada um pode ocultar.
**Testes:** propagação e edição; denúncia/remoção de conteúdo impróprio.
**Monitoramento:** `TUR-001` falha ao publicar; `TUR-002` conflito de cópia.

---

## Sprint 16 — Modo Concurso

### P3-S16-01 · Importar edital — M
**Critérios de aceite:** PDF do edital → IA extrai matérias, tópicos, pesos e data da prova → revisão → plano de estudo distribuído até a prova, priorizando peso e dificuldade informada.
**Testes:** normalização da extração; planejador com centenas de tópicos (desempenho).

### P3-S16-02 · Progresso por matéria do edital — P
**Critérios de aceite:** % de tópicos estudados e revisados por matéria; alerta quando o ritmo atual não termina antes da prova.

---

## Sprint 17 — WhatsApp (plano pago)

### P3-S17-01 · Conectar o número do usuário — M
**Critérios de aceite:** empresa verificada na Meta (pré-requisito, fora do código); número oficial do Prumo; o usuário vincula o próprio WhatsApp com código de confirmação; pode desvincular.

### P3-S17-02 · Lembretes e resumo do dia pelo WhatsApp — M
**Critérios de aceite:** modelos de mensagem aprovados ("utility"); resumo diário no horário escolhido; lembretes opcionais; contador de mensagens por usuário com teto do plano.
**Monitoramento:** `WPP-001` falha de envio; `WPP-002` modelo rejeitado.

### P3-S17-03 · "Mande um áudio que eu marco" — M
**Critérios de aceite:** webhook recebe texto/áudio; transcrição; captura com IA; resposta confirmando o que foi marcado com opção de desfazer; somente funções de agenda (conforme política da Meta para IA).
**Testes:** contrato do webhook com cargas gravadas; idempotência (mesma mensagem duas vezes não cria dois itens).
**Monitoramento:** `WPP-003` falha no processamento.

---

## Sprint 18 — iPhone

### P3-S18-01 · Build iOS e ajustes de plataforma — M
**Critérios de aceite:** build EAS para iOS; notificações, arquivos, voz e compartilhar funcionando; widget iOS (avaliar biblioteca); suíte E2E rodando no simulador iOS.

### P3-S18-03 · Acesso rápido no iPhone — M
**Critérios de aceite:** widgets interativos na tela inicial e de bloqueio (concluir sem abrir); **Atividade ao Vivo** com o bloco atual na tela de bloqueio e na Dynamic Island; controle na Central de Controle "Adicionar ao Prumo"; atalho para o botão de Ação e para a Siri ("Adicionar ao Prumo"). O iPhone não permite ícone flutuante sobre outros apps: esses recursos são o equivalente.

### P3-S18-02 · App Store — P
**Critérios de aceite:** conta de desenvolvedor Apple; página da loja; TestFlight com testadores; publicação.

---

## Sprint 19 — Ícone flutuante (Android, opcional)

### P3-S19-01 · Bolha flutuante do Prumo — G (quebrar)

Como estudante, quero um ícone flutuante que eu arrasto pela tela e que abre minhas tarefas e o adicionar de qualquer app.

**Critérios de aceite**
- Desligado por padrão; ligar em Ajustes explica e leva à permissão "Aparecer sobre outros apps" (o usuário concede manualmente nas configurações do Android).
- Bolha arrastável que gruda na borda; toque abre um painel com as tarefas do dia (concluir) e o campo de adicionar com microfone; arrastar até um "X" fecha.
- Consumo de bateria medido (meta definida no planejamento da sprint) e tela de ajuda para Samsung e Xiaomi (economia de bateria pode fechar a bolha).
- Antes de começar: conferir a política atual do Google Play para essa permissão e decidir por ADR (bolha própria × usar só widget + notificação "Agora").

**Testes:** unidade do estado do painel; checklist manual em Samsung e Xiaomi; teste de bateria.
**Monitoramento:** `FLT-001` falha ao exibir; `FLT-002` permissão retirada.

### P3-S19-02 · Painel da borda da Samsung — P (investigação)
**Critérios de aceite:** pesquisar se existe hoje um caminho oficial para apps de terceiros criarem um painel próprio na borda da Samsung; registrar conclusão em ADR. Enquanto isso, o caminho garantido é colocar os atalhos do Prumo (P2-S9-04) no painel de apps da borda.
