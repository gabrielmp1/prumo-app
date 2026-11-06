# Referência — Design do Prumo ("Caderno")

Design escolhido pelo dono do produto: **estrutura da Opção 1 + identidade de caderno da Opção 4**.
As telas de referência estão em `docs/referencia/design/`: são o código-fonte das telas do quadro de
design (formato do editor de design do Claude). Abertas direto no navegador, as listas não aparecem
preenchidas; leia os estilos inline de cada elemento como especificação (cores, tamanhos, bordas,
espaçamentos) e peça ao dono do produto o link do quadro "Prumo — Design final (1 + 4)" para ver o visual.
Elas são referência, não código para copiar: os componentes do app são escritos em React Native seguindo os tokens abaixo.

Telas de referência:
- `final-hoje.dc.html` — tela Hoje (estrutura principal)
- `final-adicionar.dc.html` — adicionar com prévia "Entendi assim" e dias reservados
- `final-materia.dc.html` — página da matéria
- `widgets.dc.html` — widgets pequeno, médio e grande na tela inicial
- `adicionar-rapido.dc.html` — janela rápida aberta pelo widget/microfone
- `notificacao-agora.dc.html` — notificação "Agora" na tela de bloqueio e no relógio
- `final-*-escuro.dc.html` — tema escuro oficial (versão B); `alternativas/` — primeira versão escura

## Conceito

O app é o caderno do estudante: papel quadriculado sutil, margem vermelha com os horários,
marca-texto para identificar o tipo de cada item, caixinhas quadradas para concluir e "caneta
vermelha" só para o que é urgente (agora, prazos). A estrutura é a da Opção 1: o dia como linha do
tempo, cartão "Agora" com o anel de tempo no topo, adicionar perto do polegar, abas embaixo.

## Tokens (tema claro)

| Token | Valor | Uso |
|---|---|---|
| `paper` | `#FBFCFE` | Fundo |
| `grid` | `#EEF2F8` | Linhas do quadriculado (22 px), sempre sutil |
| `margin` | `#F2A3A3` | Linha vertical da margem |
| `ink` | `#16213A` | Texto, bordas, botões principais (fundo) |
| `inkMuted` | `#4A5672` | Texto secundário (contraste AA sobre `paper`) |
| `surface` | `#FFFFFF` | Cartões, campos |
| `hlTask` | `#FFE45C` | Marca-texto de tarefa; cor de marca (ícones sobre `ink`) |
| `hlClass` | `#A9DCFF` | Marca-texto de aula/matéria |
| `hlEvent` | `#FFB8DA` | Marca-texto de compromisso |
| `pen` | `#D9361E` | "agora", prazos, alertas — usar pouco |
| `ringTrack` | `#FFF1A8` | Fundo do anel de tempo |

Texto é sempre `ink` por cima do marca-texto (nunca texto colorido sobre cor). Matérias podem ter
marca-texto próprio escolhido pelo usuário a partir de uma paleta validada (a definir na P2-S8-01),
sempre com texto `ink`.

## Tokens (tema escuro — "caderno à noite", versão B escolhida)

Telas: `final-hoje-escuro.dc.html`, `final-adicionar-escuro.dc.html`, `final-materia-escuro.dc.html`.
A primeira versão escura (botões, anel e sombras em amarelo) fica guardada em `design/alternativas/escuro-v1-*.dc.html` e no quadro de design, caso se queira usar no futuro.

| Token | Valor | Uso |
|---|---|---|
| `paper` | `#101727` | Fundo |
| `grid` | `#172036` | Quadriculado, quase invisível |
| `margin` | `#7A3B46` | Linha da margem |
| `ink` (texto) | `#E9EEF8` | Texto, caixinhas |
| `inkMuted` | `#A7B2C9` | Texto secundário |
| `surface` | `#18223A` | Cartões, campos, botões secundários |
| `border` | `#8A98B8` | Bordas de 2 px (no claro, as bordas usam `ink`) |
| `hlTask` | `#A894FF80` (lavanda, 50%) | Grifado de tarefa e da aba ativa; borda sólida `#A894FF` em chips, barra de progresso e dias reservados. Alternativas testáveis: âmbar suave `#E3B25C70`, coral suave `#F2907A70`, azul `#7AA2FF70` |
| `action` | `#E9EEF8` (giz) | Botão principal (fundo giz, texto `#16213A`): microfone, "Adicionar tarefa", "Revisar". Alternativas testadas: coral `#F2907A`, menta `#6FD0B4`, lavanda `#A894FF` |
| `shadow` | `#3A4870` | Sombra dura 4×4 dos cartões ("Agora", prova) |
| `hlClass` | `rgba(94,214,190,0.46)` | Grifado de aula: verde-água translúcido (borda sólida `#5ED6BE` em chips) |
| `hlEvent` | `rgba(232,132,184,0.48)` | Grifado de compromisso: rosa translúcido |
| `pen` | `#FF7A63` | "agora", prazos |
| `ringTrack` | `#2E3B5E` | Fundo do anel de tempo (traço em lavanda `#A894FF`) |

Diferenças de regra no escuro:
- Grifado em cores **translúcidas**, cobrindo a metade de baixo da palavra (de 58% a 96% da altura), para ficar suave e o texto claro continuar legível. Tarefas usam lavanda, aulas verde-água, compromissos rosa.
- Barra de progresso e dias reservados usam a lavanda das tarefas (`#A894FF`).
- Botão principal se inverte: fundo cor de giz com texto azul-marinho. **Sem amarelo no tema escuro.**
- Sombra dura dos cartões em `shadow` (no claro é `ink`).
- Dia selecionado: fundo `ink` claro com texto `paper`.
Validar contraste AA com o teste de contraste da P0-S0-09.

## Tipografia

Uma família só: **Recursive** (Google Fonts), usando os eixos:

| Papel | Configuração |
|---|---|
| Títulos ("Hoje.", nome da matéria) | `CASL 1`, peso 900, 38–44 px |
| Rótulos manuscritos ("agora →", "Entendi assim", abas) | `CASL 1`, peso 800–900, 13–20 px |
| Texto | `CASL 0`, peso 500–800, 13–18 px |
| Horários, datas curtas, contadores | `MONO 1`, peso 600, 11–13 px |

O ponto final vermelho depois do título ("Hoje.") é assinatura da marca.

## Componentes

| Componente | Regras |
|---|---|
| Item da linha do tempo | Horário na margem (mono), título com marca-texto do tipo, subtítulo em `inkMuted`, caixinha quadrada à direita (só tarefas e fixos) |
| Caixinha de concluir | 22–26 px visível, alvo de toque 44 px, borda 2,5 px `ink`, cantos 5 px; feito = preenchida `ink` com ✓ branco e título riscado |
| Cartão "Agora" | Fundo `surface`, borda 2 px `ink`, sombra dura 4×4 px `ink`, anel de tempo (traço `ink`, fundo `ringTrack`) |
| Recado ("Não esquecer", prova) | Mesmo estilo do cartão "Agora"; datas em `pen` |
| Botão principal | Fundo `ink`, texto branco ou ícone `hlTask`, cantos 12 px; destaque opcional com sombra dura 4×4 em `hlTask` |
| Botão secundário | Fundo `surface`, borda 2 px `ink` |
| Campo de adicionar | Borda 2 px `ink`, cantos 12 px, placeholder em fonte manuscrita |
| Abas | Texto manuscrito; aba ativa com marca-texto `hlTask` |
| Chips ("Entendi assim") | Borda 1,5 px `ink`, cantos 8 px; tipo com fundo de marca-texto |
| Faixa de dias | Quadrados com borda `ink`; dia selecionado com fundo `ink` |

Alvos de toque sempre ≥ 44 px. Sem sombras suaves, sem degradês, sem emoji.
