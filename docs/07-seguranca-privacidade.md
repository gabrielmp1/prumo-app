# 07 — Segurança e privacidade

**Promessa do produto:** os dados são do usuário. O Prumo **nunca guarda** o conteúdo de ninguém em
forma legível. No plano grátis, os dados ficam só no aparelho. No plano pago, viajam e ficam no
servidor **criptografados de ponta a ponta**. Quando o usuário pede uma função que precisa de
processamento (IA), o conteúdo necessário passa pelo servidor de forma protegida, é processado e
**descartado na hora**, sem ser gravado.

**Decisão (revisada):** o app grátis **tem** internet para as funções que o usuário aciona (como a IA),
mas não guarda nada fora do aparelho. Para quem quer isolamento total existe o **Modo offline**
(um interruptor que bloqueia toda a rede).

Este documento vale acima de qualquer outro em caso de conflito. Mudanças aqui exigem ADR.

## Princípios

1. **Local por padrão.** Toda função básica roda no aparelho, sem internet: agenda, planejador,
   adicionar rápido (parser local), voz (reconhecimento do sistema, preferindo o do aparelho),
   notificações, widgets, anexos, matérias, ferramentas de PDF.
2. **Rede só quando o usuário age ou consente.** Usar a captura com IA é a própria ação de consentimento
   (com um aviso na primeira vez). Relatório de erros e estatísticas anônimas são perguntados na primeira
   abertura (opcionais). Sincronização e WhatsApp são ligados pelo usuário. **Modo offline** bloqueia tudo.
3. **Ponta a ponta onde houver servidor guardando dados.** O servidor nunca recebe conteúdo em texto claro
   para guardar.
4. **Mínimo de metadados.** O servidor sabe o necessário para funcionar (conta, IDs aleatórios,
   datas de alteração, tamanhos) e nada mais.
5. **Sem SDKs de terceiros que coletem dados** no app grátis (sem anúncios, sem rastreadores).
6. **Verificável.** O módulo de criptografia e a camada de rede são de código aberto; tela
   "Privacidade" mostra o que está ligado e quando algo saiu do aparelho.

## Camada 1 — Proteção no aparelho (Fase 1)

| Medida | Como |
|---|---|
| Banco criptografado | SQLite com SQLCipher (opção do expo-sqlite); chave aleatória de 256 bits guardada no Android Keystore / iOS Keychain (expo-secure-store) |
| Anexos criptografados | Cada arquivo cifrado com XChaCha20-Poly1305 (libsodium) antes de ir para a pasta do app; chave derivada da chave mestra do aparelho |
| Bloqueio do app | Opcional: biometria ou PIN (expo-local-authentication) ao abrir e após X min em segundo plano |
| Privacidade na tela | Opções: esconder conteúdo na lista de apps recentes e em capturas de tela; notificações e widgets podem mostrar só "2 tarefas agora" sem títulos na tela de bloqueio |
| Backup do Android | Banco e anexos excluídos do backup automático do sistema; backup só pelo "Exportar backup" do app, cifrado com senha (Argon2id + XChaCha20-Poly1305) |
| Sem rede no modo grátis | Camada de rede única (`src/platform/net.ts`) que recusa qualquer chamada se a função correspondente não estiver ligada; teste automatizado garante que nenhum outro módulo faz `fetch` |

**Sobre a permissão de internet do Android:** a permissão vale para o app inteiro, não por plano.
O app declara internet; a camada de rede só deixa passar as chamadas das funções em uso e
bloqueia tudo quando o **Modo offline** está ligado.

## Camada 2 — Sincronização com criptografia de ponta a ponta (Fase 2)

Modelo usado por gerenciadores de senha e apps de notas privados (não é o protocolo de conversa
do WhatsApp/Signal, que serve para mensagens entre pessoas; aqui são os dados de uma mesma pessoa
em vários aparelhos).

**Chaves**
- Ao ativar a sincronização, o app gera uma **chave mestra** aleatória de 256 bits no aparelho.
- Na ativação, o usuário escolhe o modo de recuperação:
  - **Máxima privacidade** (padrão recomendado): só o código de recuperação abre os dados.
  - **Recuperável**: além do código, uma cópia da chave mestra fica guardada de forma recuperável pelo
    e-mail da conta. Mais conveniente, menos privado; o app explica a diferença.
- O usuário recebe um **código de recuperação** (ex.: 24 palavras ou código impresso/QR) para guardar.
  A chave mestra é cifrada com uma chave derivada desse código (Argon2id) e só essa versão cifrada vai ao servidor.
- Cada registro (item, configuração) e cada anexo é cifrado no aparelho com XChaCha20-Poly1305 usando
  uma chave de dados derivada da mestra; o ID e a versão entram como dados associados (impede troca de registros).
- O servidor guarda: `id aleatório`, `tipo genérico` (registro/anexo), `updated_at`, `tamanho com preenchimento`, `blob cifrado`.

**Novo aparelho**
- Preferido: ler um QR code no aparelho já conectado (a chave mestra passa direto de um aparelho para o
  outro, cifrada com uma chave de sessão combinada entre eles).
- Alternativa: digitar o código de recuperação.

**Consequências que o usuário precisa saber (tela clara antes de ativar)**
- Se perder todos os aparelhos **e** o código de recuperação, os dados na nuvem não podem ser recuperados
  por ninguém, nem pelo Prumo.
- Trocar o código de recuperação recifra só a chave mestra (rápido), não todos os dados.

**Login da conta** (separado das chaves): e-mail com link mágico ou Google; a senha/código de
recuperação **nunca** vai ao servidor. A conta só controla acesso aos blobs e a assinatura.

## O que fica incompatível com ponta a ponta (decisão consciente)

| Função | Por quê | Como tratamos |
|---|---|---|
| Captura com IA (texto, foto, PDF, áudio) | A IA precisa ler o conteúdo no momento | **Funciona normalmente** (grátis com cota, pago ampliado). Fluxo: o app envia só o necessário (o texto/foto + nomes das matérias), protegido em trânsito → servidor → API do Claude → resposta em comandos JSON → **o app executa os comandos localmente**. Nada é gravado no servidor; registra só a contagem de uso. Na API, configurar a menor retenção de dados que o contrato permitir |
| Lembretes por WhatsApp/e-mail com o app fechado | O servidor precisaria ler o título do compromisso | Notificações do próprio aparelho funcionam sem isso. Para lembretes por WhatsApp, o usuário autoriza enviar **só o título e horário** daquele lembrete (exceção explícita por função) |
| Bot de WhatsApp | A Meta e o servidor recebem as mensagens enviadas ao número do Prumo | Recurso opcional do plano pago, com aviso explícito |
| Turma | Itens compartilhados com outras pessoas | Chave por turma, distribuída cifrada para cada membro (ADR e revisão de segurança antes da S15) |
| Busca no servidor, estatísticas de conteúdo | Servidor não lê | Busca é sempre local |
| Relatório de erros (Sentry) | Envia dados técnicos | Perguntado na primeira abertura; só códigos, versões e tempos (nunca conteúdo), com `scrub()` e teste automatizado |
| Suporte ver os dados do usuário para ajudar | Servidor não lê | O usuário envia, se quiser, o relatório da Central/"Relatar problema" |
| Recuperar conta sem o código | Só o usuário tem a chave | Modo "Recuperável" opcional (ver acima) |

## Processo de segurança

- **Modelo de ameaças** escrito antes da Fase 2 (quem pode atacar, o quê, como; inclui: celular roubado,
  servidor invadido, funcionário curioso, ordem judicial, dependência comprometida).
- **Checklist OWASP MASVS** (padrão de segurança de apps móveis) como critério de aceite das histórias de segurança.
- **Bibliotecas consagradas** (libsodium); nunca criptografia "feita em casa". Vetores de teste oficiais nos testes.
- **Análise de dependências** na CI (vulnerabilidades conhecidas) e builds assinados.
- **Auditoria externa / teste de invasão** do módulo de criptografia e da sincronização antes do lançamento do plano pago.
- **Código aberto** do módulo de criptografia e da camada de rede, para quem quiser verificar.
- **Programa de recompensa por falhas** depois do lançamento.
- **LGPD:** política de privacidade clara, exportar e excluir conta, registro de operadores.

## Testes automatizados obrigatórios (resumo)

- Cifrar → decifrar devolve o original; qualquer byte alterado → falha de autenticação (`SEC-001`).
- Vetores de teste oficiais da libsodium para os algoritmos usados.
- Nenhum módulo fora de `src/platform/net.ts` usa `fetch`/`XMLHttpRequest`/WebSocket (teste de arquitetura).
- Com todas as funções de rede desligadas, uma suíte E2E roda com a rede do emulador bloqueada e nada falha.
- O que é enviado ao servidor de sincronização nunca contém texto claro de títulos/notas (teste que intercepta o envio e procura os textos de exemplo).
- `scrub()` remove conteúdo dos relatórios de erro.
