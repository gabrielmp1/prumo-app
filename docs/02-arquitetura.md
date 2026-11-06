# 02 — Arquitetura

## Visão geral

```
┌──────────────────────────── App (Expo / React Native) ────────────────────────────┐
│  app/ (telas, Expo Router)  →  src/features/* (componentes + hooks por funcionalidade) │
│                    │                                │                                │
│                    ▼                                ▼                                │
│        src/core/  (regras PURAS)          src/data/ (SQLite + Drizzle, repositórios) │
│   datas · ocorrências · planejador ·       migrações · validação zod · sync (F2)     │
│   parser de texto · ritmo · revisão                                               │
│                    │                                │                                │
│                    └──────────────┬─────────────────┘                                │
│                                   ▼                                                  │
│              src/observability/  (Central de Erros, autodiagnóstico, logger)        │
│              src/platform/  (notificações, arquivos, voz, compartilhar, widget)     │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                   │  (Fase 2+)
                                   ▼
        Supabase: Auth · Postgres (RLS) · Storage · Edge Functions (IA, WhatsApp, push)
```

**Regra de dependência:** `core` não importa nada de fora dele (nem React, nem Expo, nem
`Date.now()` direto — o "agora" é sempre parâmetro). `data`, `platform` e `features` podem
importar `core`. Telas (`app/`) só falam com `features`. Um teste de arquitetura (ESLint
`no-restricted-imports` + teste dedicado) garante isso.

## Estrutura de pastas

```
app/                      # rotas (Expo Router)
  (tabs)/dia.tsx  semana.tsx  mes.tsx  ano.tsx  materias.tsx
  item/[id].tsx  capturar.tsx  ajustes.tsx  dev/erros.tsx
src/
  core/
    dates.ts              # aritmética de datas em ISO local (YYYY-MM-DD), semana começando na segunda
    occurrences.ts        # aulas recorrentes + compromissos → ocorrências de um dia
    planner/
      plan.ts             # distribui tarefas nos dias (capacidade, prazos, fixados, pulados)
      schedule.ts         # encaixa blocos nos horários livres de um dia (preferência de período)
      invariants.ts       # verificações usadas em testes E no autodiagnóstico
    quickAdd.ts           # texto livre pt-BR → item
    rhythm.ts             # fator de ritmo (tempo real ÷ estimado)
    review.ts             # revisão espaçada (Fase 2)
    types.ts              # tipos do domínio (sem dependências)
  data/
    schema.ts             # Drizzle: tabelas
    migrations/
    repositories/         # itemsRepo, settingsRepo, attachmentsRepo, errorLogRepo
    validation.ts         # schemas zod (fonte única para validar leitura/escrita)
  features/               # dia/, semana/, mes/, ano/, materias/, captura/, ajustes/ ...
  platform/               # notifications.ts, files.ts, speech.ts, shareIntent.ts, widget/
  observability/          # ver docs/04-central-de-erros.md
  ui/                     # tokens de design, componentes base
e2e/                      # fluxos Maestro (*.yaml)
supabase/                 # (Fase 2) migrations SQL, edge functions
docs/
```

## Modelo de dados

Tabela única `items` com discriminador `kind` (como no protótipo), mais tabelas auxiliares.
Campos comuns: `id` (uuid), `kind`, `title`, `notes`, `subject`, `created_at`, `updated_at`,
`deleted_at` (exclusão lógica, para desfazer e sincronizar).

| kind | Campos próprios |
|---|---|
| `class` (aula ou obrigação fixa) | `sub` (`class`/`fixed`), `weekdays` (0=dom…6=sáb), `start`, `end`, `place`, `until` |
| `event` (compromisso) | `date`, `start?`, `end?`, `place`, `important`, `remind_min` |
| `task` (tarefa) | `due`, `estimate_min`, `done`, `actual_min?`, `pins` (dia→{start?,min}), `skips` (dias), `log` (dia→min feitos) |
| `note` (nota de matéria) | `body`, `subject` |

Outras tabelas: `attachments` (id, item_id, name, mime, size, local_uri, remote_key?),
`settings` (chave-valor), `dev_error_log` (ver Central de Erros), `notifications_map`
(item+data → id da notificação agendada), `sync_outbox` (Fase 2).

Datas são strings `YYYY-MM-DD` no fuso do usuário; horas `HH:MM`. Nunca `Date` dentro do banco.
Toda leitura e escrita passa por `validation.ts` (zod). Dado inválido → `reportError('DAT-002')`
e o item vai para "quarentena" (não some, não quebra a tela).

## Decisões principais (cada uma vira um ADR no Sprint 0)

| # | Decisão | Motivo |
|---|---|---|
| ADR-001 | Expo + React Native + TS | Um código para Android e iPhone; builds na nuvem (EAS); bom suporte a notificações, arquivos e widgets |
| ADR-002 | Offline-first com SQLite local | Funciona sem internet; sincronização vira um detalhe da Fase 2 |
| ADR-003 | `core` puro e determinístico (agora como parâmetro) | Regras testáveis em ms, com testes de propriedade |
| ADR-004 | Central de Erros com transportes trocáveis | Dev vê erros no app; produção envia ao Sentry mudando só configuração |
| ADR-005 | Supabase como backend | Auth + Postgres + Storage + funções em um lugar, plano gratuito para começar |
| ADR-006 | IA só no servidor (Edge Function), opcional e com consentimento | Chave protegida, limite por usuário; conteúdo processado em memória e não guardado |
| ADR-007 | Criptografia de ponta a ponta na sincronização (libsodium, chave mestra no aparelho, código de recuperação) | O servidor guarda só dados cifrados; ver doc 07 |
| ADR-008 | Local por padrão: camada de rede única, funções online só quando o usuário aciona ou consente, e Modo offline | Nada é guardado fora do aparelho no grátis; IA continua disponível; verificável por teste |
| ADR-009 | Banco SQLCipher + anexos cifrados, chaves no Keystore/Keychain | Proteção se o celular for perdido ou copiado |

## Sincronização (Fase 2) — desenho

> Toda a sincronização é cifrada de ponta a ponta: ver `07-seguranca-privacidade.md`. O que segue descreve a fila e os conflitos, que operam sobre registros já cifrados.

- Cada escrita local grava em `sync_outbox`. Um processo envia em lote quando há rede.
- Conflito: última escrita vence por campo `updated_at`; exclusão lógica vence edição.
- Postgres com RLS: cada linha tem `user_id`; política `user_id = auth.uid()`.
- Anexos: arquivo no aparelho primeiro; upload em segundo plano para o Storage (pasta do usuário).

## Integrações (Fase 2 e 3)

| Integração | Como | Observação |
|---|---|---|
| Notificações | expo-notifications (locais agendadas) | Aparecem no Galaxy Watch pelo espelhamento do celular |
| Voz | expo-speech-recognition (reconhecimento do Android, pt-BR) | Áudio gravado/arquivo: transcrição no servidor |
| Compartilhar para o Prumo | expo-share-intent | Texto, imagem, PDF e áudio vindos do WhatsApp |
| Widget | react-native-android-widget | Dia de hoje + bloco atual |
| IA | Edge Function → API da Anthropic (modelo Haiku para captura) | Limite por usuário; nunca chave no app |
| Cobrança | RevenueCat + Google Play Billing | Plano grátis e pago |
| WhatsApp | Meta WhatsApp Cloud API (webhook em Edge Function) | Só funções de agenda (regra da Meta para IA) |
| Erros em produção | @sentry/react-native | Perguntado na primeira abertura, só dados técnicos, com filtro |
| Analytics | PostHog (eventos anônimos) | Perguntado na primeira abertura; contagens anônimas, sem conteúdo |

Versões exatas: usar a estável mais recente no momento da instalação e registrar no ADR.
