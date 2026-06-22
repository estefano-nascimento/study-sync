# Study-Sync

Aplicativo multiplataforma de organização de estudos desenvolvido para a disciplina **SSC0961 — Desenvolvimento Web e Mobile** do ICMC/USP.

**Profa. Dra. Lina Garcés**

**Equipe:**
- Estefano Nascimento — N.USP: 7970044
- Guilherme Motta Tranche — N.USP: 13671549
- Pyerry Klyzlow Xavier — N.USP: 15484839

---

## Sobre o Projeto

O Study-Sync nasceu de uma necessidade real vivenciada na graduação: a fragmentação das ferramentas de produtividade. Estudantes universitários costumam usar uma agenda para provas, um app separado para Pomodoro, grupos de WhatsApp para trabalhos em equipe e planilhas para acompanhar entregas. Essa dispersão gera sobrecarga e perda de informações importantes.

O Study-Sync unifica essas funcionalidades em uma única aplicação que roda em **Android**, **iOS** e **Web** com uma única base de código, integrando gestão de tarefas, cronômetro de foco, calendário acadêmico, gamificação e notificações em tempo real.

---

## Stack Tecnológica

### Front-end

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.74.5 | Framework de UI multiplataforma |
| Expo SDK | 51 | Toolchain de desenvolvimento |
| Expo Router | 3.5 | Roteamento file-based |
| TypeScript | 5.3 | Tipagem estática |
| Zustand | 4.5 | Gerenciamento de estado global |
| date-fns | 3.6 | Manipulação de datas (locale pt-BR) |
| react-native-calendars | 1.1304 | Componente de calendário |
| react-native-reanimated | 3.10 | Animações nativas |
| react-native-svg | — | Gráficos vetoriais (timer circular) |
| victory-native | — | Gráficos de barras (dashboard) |
| AsyncStorage | 1.23 | Persistência local (mobile) |

### Back-end

| Tecnologia | Uso |
|---|---|
| Supabase | Backend como serviço (BaaS) |
| PostgreSQL | Banco de dados relacional |
| Supabase Auth | Autenticação (JWT, bcrypt, OTP) |
| Supabase Realtime | Atualizações em tempo real (WebSockets) |
| Row Level Security (RLS) | Controle de acesso a nível de linha |

### DevOps

| Tecnologia | Uso |
|---|---|
| GitHub | Versionamento (trunk-based, PRs com revisão) |
| GitHub Actions | Integração contínua (CI) |
| SonarCloud | Análise estática de código |
| EAS Build | Build e distribuição (Android/iOS) |

---

## Estrutura do Projeto

```
study-sync/
├── app/
│   ├── (auth)/                # Fluxo de autenticação
│   │   ├── login.tsx          # Login com validação de e-mail
│   │   ├── signup.tsx         # Cadastro com validação de senha
│   │   ├── verify.tsx         # Verificação OTP (6 dígitos)
│   │   ├── onboarding.tsx     # Configuração inicial (3 etapas)
│   │   └── callback.tsx       # Callback OAuth
│   ├── (app)/                 # Telas protegidas (pós-login)
│   │   ├── _layout.tsx        # Layout responsivo: sidebar/tab bar
│   │   ├── dashboard.tsx      # Dashboard com KPIs e gráficos
│   │   ├── tasks/             # CRUD de tarefas
│   │   │   ├── index.tsx      # Lista com filtros por status
│   │   │   ├── new.tsx        # Criação de tarefa
│   │   │   └── [id].tsx       # Detalhe da tarefa
│   │   ├── calendar.tsx       # Calendário acadêmico
│   │   ├── notifications.tsx  # Central de notificações
│   │   ├── profile.tsx        # Perfil e gamificação
│   │   ├── settings.tsx       # Configurações do app
│   │   ├── focus/[taskId].tsx # Timer de foco (Pomodoro)
│   │   └── reschedule/        # Reagendamento inteligente
│   ├── _layout.tsx            # Root: fontes, sessão, tema
│   └── index.tsx              # Guard de rota
├── components/                # Componentes reutilizáveis
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── KpiCard.tsx
│   ├── StatusChip.tsx
│   ├── ProgressBar.tsx
│   ├── EmptyState.tsx
│   ├── SkeletonLoader.tsx
│   └── SidebarNav.tsx
├── lib/
│   ├── types.ts               # Interfaces e tipos TypeScript
│   ├── utils.ts               # Helpers (formatDate, crossAlert, etc.)
│   ├── theme.ts               # Cores, tipografia, espaçamentos
│   ├── validation.ts          # Validação de e-mail e senha
│   └── supabase.ts            # Cliente Supabase configurado
├── store/                     # Stores Zustand
│   ├── authStore.ts           # Autenticação e sessão
│   ├── taskStore.ts           # Tarefas (CRUD + fetch)
│   ├── notificationStore.ts   # Notificações (Realtime)
│   └── themeStore.ts          # Tema (claro/escuro/sistema)
└── assets/                    # Ícones e splash screen
```

---

## Funcionalidades

### Autenticação e Segurança
- Cadastro com e-mail e senha com **validação inteligente de e-mail** (detecta erros de digitação em domínios como `gmial.com` → `gmail.com`)
- **Validação de senha** com indicador visual de força (8+ caracteres, maiúsculas, minúsculas, números, símbolos)
- **Verificação OTP** de 6 dígitos por e-mail (Supabase Auth)
- Onboarding em 3 etapas (tema, duração Pomodoro, meta diária)
- Persistência de sessão via AsyncStorage (mobile) e navegador (web)
- Logout com confirmação cross-platform
- **Row Level Security (RLS)** — cada usuário só acessa seus próprios dados
- Comunicação HTTPS com JWT

### Dashboard
- Saudação personalizada por horário (Bom dia / Boa tarde / Boa noite)
- 4 KPIs com ajuste automático de fonte: tarefas do dia, atenção, foco acumulado, alta prioridade
- Gráfico de barras — minutos de foco dos últimos 7 dias
- Preview das próximas tarefas com acesso rápido ao timer
- Badge de notificações não lidas

### Tarefas
- Lista com filtros por status (Todas, A fazer, Em andamento, Revisão, Concluída)
- Cards com prioridade colorida (verde/amarelo/laranja/vermelho), matéria, status, data e progresso
- Indicador visual de atraso (borda vermelha + ícone de alerta)
- Botão de atalho para iniciar sessão de foco
- Criação com seletor de prioridade (ícones), calendário em bottom-sheet, matéria e estimativa
- Cálculo de criticidade via RPC no Supabase

### Timer de Foco (Pomodoro)
- Círculo de progresso animado em SVG
- Durações: 15, 25, 45 ou 60 minutos
- Controles: iniciar, pausar, encerrar
- Contador de distrações
- Avaliação de foco (1–5 estrelas)
- Registro automático de sessão no banco

### Calendário Acadêmico
- Visualização mensal com eventos coloridos por tipo (Aula, Prova, Reunião, Prazo)
- Modal para criação de eventos
- Sincronização em tempo real

### Reagendamento Inteligente
- Sugestão de 7 slots disponíveis nos próximos dias
- Registro de histórico de reagendamentos

### Notificações
- Central tipada com ícones e cores por tipo
- Atualização em tempo real via Supabase Realtime (WebSockets)
- Marcação individual ou em lote

### Perfil e Gamificação
- Avatar gerado pela inicial do nome
- Barra de XP e nível
- Estatísticas semanais (horas de foco, tarefas concluídas, streak)
- Grade de conquistas desbloqueáveis

### Configurações
- Tema: Claro / Escuro / Sistema
- Duração do Pomodoro configurável
- Meta diária de foco (30 min a 6 h)
- Toggles de notificações
- Logout com confirmação

---

## Design e UX

- **Paleta**: cor primária `#2F5BFF` (azul), com tema claro e escuro consistente
- **Responsividade**: sidebar lateral em telas ≥ 768px, tab bar inferior em mobile
- **Navegação**: 4 abas (Início, Tarefas, Agenda, Configurações)
- **Feedback visual**: Skeleton loaders, pull-to-refresh, indicadores de progresso
- **Cross-platform**: `crossAlert()` para alertas compatíveis web e mobile
- **Importação condicional**: victory-native carregado apenas em plataformas nativas
- **Idioma**: todo o conteúdo em português (pt-BR)

---

## Modelos de Dados

| Entidade | Descrição |
|---|---|
| `UserProfile` | Dados do usuário, XP, nível, metas e preferências |
| `Task` | Tarefa com prioridade, status, prazo, estimativa e criticidade |
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

## Análise de Qualidade (SonarCloud)

| Métrica | Resultado | Rating |
|---|---|---|
| Segurança | 0 vulnerabilidades | **A** |
| Confiabilidade | 4 issues | **C** |
| Manutenibilidade | 97 issues | **A** |
| Cobertura de testes | 0,0% | — |
| Duplicação de código | 0,1% | — |
| Security Hotspots | 9 | — |

---

## Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta no Supabase (backend já configurado em `lib/supabase.ts`)

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npx expo start --clear

# Plataformas específicas
npx expo start --android    # Android (Expo Go ou emulador)
npx expo start --ios        # iOS (Simulator)
npx expo start --web        # Navegador
```

### Build de Produção (EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android (APK)
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

---

## Versionamento

- **Branch principal**: `main` (protegida, sempre estável)
- **Desenvolvimento**: branches por tarefa (`feature/...`, `fix/...`)
- **Integração**: Pull Request com revisão obrigatória
- **CI**: GitHub Actions + SonarCloud em cada push

---

## Licença

Projeto acadêmico — SSC0961 Desenvolvimento Web e Mobile — ICMC/USP — 2026
