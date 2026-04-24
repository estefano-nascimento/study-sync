# Study-Sync

Aplicativo de gerenciamento de estudos desenvolvido para a disciplina de **Web e Mobile**, com foco em organização de tarefas, sessões de foco (Pomodoro), colaboração em grupos e acompanhamento de progresso.

**Data de entrega:** 23 de abril de 2026

---

## Visão Geral

Study-Sync é um aplicativo multiplataforma (Android, iOS e Web) que ajuda estudantes a organizar tarefas, medir o tempo de foco com a técnica Pomodoro, colaborar em grupos de estudo e visualizar seu progresso ao longo da semana.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.74.1 + Expo SDK 51 |
| Navegação | Expo Router 3.5 (file-based routing) |
| Linguagem | TypeScript 5.3 |
| Backend / Auth | Supabase (PostgreSQL + Realtime + Auth) |
| Estado global | Zustand 4.5 |
| Datas | date-fns 3.6 (locale pt-BR) |
| Calendário | react-native-calendars 1.1304 |
| Animações | react-native-reanimated 3.10 |
| Persistência local | AsyncStorage 1.23 |

---

## Estrutura do Projeto

```
study-sync/
├── app/
│   ├── (auth)/              # Fluxo de autenticação
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── onboarding.tsx
│   │   └── callback.tsx
│   ├── (app)/               # Telas protegidas (pós-login)
│   │   ├── _layout.tsx      # Layout responsivo: sidebar (≥768px) ou tab bar (mobile)
│   │   ├── dashboard.tsx
│   │   ├── tasks/           # Lista, criação e detalhe de tarefas
│   │   ├── groups/          # Grupos, Kanban, saúde, membros
│   │   ├── calendar.tsx
│   │   ├── notifications.tsx
│   │   ├── profile.tsx
│   │   ├── settings.tsx
│   │   ├── focus/           # Timer Pomodoro
│   │   └── reschedule/      # Reagendamento inteligente
│   ├── _layout.tsx          # Root: fontes, sessão, tema
│   └── index.tsx            # Guard de rota
├── components/              # Componentes reutilizáveis
├── lib/
│   ├── types.ts             # Interfaces TypeScript
│   ├── utils.ts             # Helpers de data, formato, saudação
│   ├── theme.ts             # Cores, tipografia, espaçamentos
│   └── supabase.ts          # Cliente Supabase
├── store/                   # Stores Zustand (auth, task, notification, theme)
└── assets/                  # Ícones e splash screen
```

---

## Funcionalidades Implementadas

### Autenticação
- Cadastro com e-mail e senha, com confirmação por e-mail
- Login com validação de campos e mensagens de erro em português
- Onboarding em 3 etapas: escolha de tema, duração do Pomodoro e meta diária de foco
- Persistência de sessão via AsyncStorage (mobile) e URL (web)
- Logout com confirmação

### Dashboard
- Saudação personalizada por hora do dia (Bom dia / Boa tarde / Boa noite)
- Grade de 4 KPIs: tarefas para hoje, tarefas críticas, foco acumulado no dia e tarefas de alta prioridade
- Gráfico de barras com os minutos de foco dos últimos 7 dias
- Preview das tarefas do dia com botão de acesso rápido ao timer
- Carousel de grupos ativos com barra de progresso de conclusão
- Sino de notificações com badge de não lidas

### Tarefas
- Listagem com filtro por status: Todas, A fazer, Em andamento, Revisão, Concluída
- Cards com título, descrição resumida, prioridade colorida (baixa → crítica), disciplina, data de prazo e barra de progresso
- Indicador visual de tarefa em atraso (borda vermelha)
- **Criação de tarefa** com:
  - Título e descrição
  - Seletor de prioridade com ícones (folha / alerta / chama / raio)
  - Seletor de data com calendário visual em bottom-sheet (sem digitar a data manualmente)
  - Estimativa de duração em minutos
  - Seleção de disciplina e grupo (carregados do Supabase)
- Tela de detalhe com progresso, histórico de sessões, comentários e botões de ação
- Cálculo de criticidade via função RPC no Supabase

### Timer de Foco (Pomodoro)
- Círculo de progresso animado com SVG
- Duração configurável pelo usuário (15, 25, 45 ou 60 minutos)
- Controles de iniciar, pausar e encerrar
- Contador de distrações durante a sessão
- Avaliação de foco de 1 a 5 estrelas ao finalizar
- Criação automática de `StudySession` no banco com duração e pontuação de foco

### Reagendamento Inteligente
- Sugestão de 7 slots de horários disponíveis nos próximos dias
- Seleção manual de novo prazo
- Registro do histórico de reagendamento (`SmartRescheduleLog`)

### Grupos de Estudo
- Listagem de grupos com contagem de membros e tarefas críticas
- Criação de novo grupo
- Entrada em grupo existente via código de convite
- **Quadro Kanban** com 4 colunas: A fazer, Em andamento, Revisão, Concluída
  - Mobile: exibe uma coluna por vez com alternador
  - Desktop: todas as colunas visíveis simultaneamente
- **Painel de saúde do grupo**: score de saúde, distribuição de tarefas por status e tendência dos últimos 7 dias
- Listagem de membros com função (owner / admin / member) e data de entrada

### Calendário
- Visualização mensal com eventos coloridos por tipo: Aula, Prova, Reunião, Prazo
- Modal para adição de novos eventos

### Notificações
- Central de notificações com ícone e cor por tipo
  - Tarefa com prazo próximo, tarefa em atraso, sugestão de reagendamento, progresso do grupo, membro em foco, reunião sugerida
- Marcar como lida individualmente ou todas de uma vez
- Inscrição Realtime via Supabase para recebimento em tempo real

### Perfil
- Avatar gerado a partir da inicial do nome
- Exibição de e-mail, curso e período
- Barra de XP e nível
- Estatísticas semanais: horas de foco, tarefas concluídas e streak
- Grade de conquistas (bloqueadas / desbloqueadas)

### Configurações
- **Aparência**: alternância entre tema Claro, Escuro e Sistema (persiste no AsyncStorage)
- **Pomodoro**: seleção de duração (15, 25, 45 ou 60 minutos), salvo no perfil do Supabase
- **Meta diária**: seleção de objetivo de foco (30 min a 6 h), salvo no perfil
- **Notificações**: toggles para lembretes de foco, alertas de atraso, progresso do grupo e sugestões de reagendamento
- Atalho para central de notificações
- Botão de logout com confirmação

### Design e UX
- Tema claro e escuro com paleta consistente (cor primária `#2F5BFF`)
- Layout responsivo: barra lateral fixa em telas ≥ 768 px (web/tablet), tab bar na parte inferior em mobile
- Barra de navegação com **5 abas** e ícones distintos para estado ativo e inativo:
  - Início (`home`), Tarefas (`clipboard`), Grupos (`people`), Agenda (`calendar`), Config. (`settings`)
- Feedback visual de carregamento com Skeleton Loaders
- Pull-to-refresh nas telas principais
- Componentes reutilizáveis: `Button`, `Card`, `Input`, `KpiCard`, `ProgressBar`, `StatusChip`, `EmptyState`, `SkeletonLoader`
- Todo o conteúdo em português (pt-BR)

---

## Modelos de Dados

| Entidade | Descrição |
|---|---|
| `UserProfile` | Dados do usuário, XP, nível, metas e preferências |
| `Task` | Tarefa com prioridade, status, prazo, estimativa e pontuação de criticidade |
| `TaskProgress` | Percentual de conclusão e tempo investido |
| `TaskComment` | Comentários vinculados a uma tarefa |
| `StudySession` | Sessão de foco com duração, tipo e score |
| `Subject` | Disciplina com nome e cor |
| `Group` | Grupo de estudo com código de convite |
| `GroupMember` | Vínculo usuário-grupo com papel e permissões |
| `CalendarEvent` | Evento com tipo, horário e cor |
| `Notification` | Notificação tipada com status de leitura |
| `UserAchievement` | Conquista desbloqueada pelo usuário |
| `UserAvailability` | Slots de disponibilidade por dia da semana |
| `SmartRescheduleLog` | Histórico de reagendamentos automáticos |

---

## Como Executar

```bash
# Instalar dependências
npm install

# Gerar assets (ícone, splash, favicon)
node generate-assets.js

# Iniciar (limpa o cache na primeira vez)
npx expo start --clear

# Plataformas específicas
npx expo start --android
npx expo start --ios
npx expo start --web
```

> **Requisito:** o projeto utiliza o Supabase como backend. O cliente já está configurado em `lib/supabase.ts`.

---

## Componentes Reutilizáveis

| Componente | Variantes / Props principais |
|---|---|
| `Button` | `primary` · `secondary` · `danger` · `ghost` · `loading` |
| `Card` | Container com sombra, cantos arredondados e cor de superfície do tema |
| `Input` | `label` · `error` · `multiline` |
| `StatusChip` | `critical` · `done` · `in_progress` · `today` · `overdue` · cor customizada |
| `KpiCard` | `icon` · `value` · `title` · `color` |
| `ProgressBar` | `value` (0–100) · `showLabel` |
| `EmptyState` | `icon` · `title` · `subtitle` · `actionLabel` · `onAction` |
| `SkeletonLoader` | `Skeleton` (genérico) · `CardSkeleton` (card de altura fixa) |
| `SidebarNav` | Navegação lateral com estado ativo e badge de notificações |
