# Study-Sync — Setup Instructions

## 1. Install dependencies

```bash
cd study-sync
npm install
```

## 2. Add placeholder assets

Place these files inside `assets/`:
- `icon.png` (1024×1024)
- `splash.png` (any size)
- `adaptive-icon.png` (1024×1024)
- `favicon.png` (any size)

You can use any placeholder image for local development.

## 3. Run on web

```bash
npx expo start --web
```

## 4. Run on mobile (Expo Go)

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

## 5. Supabase

The Supabase client is pre-configured in `lib/supabase.ts` using the project credentials.
The schema (18 tables) must already exist in the Supabase project.

## Architecture

```
study-sync/
├── app/               # Expo Router screens
│   ├── (auth)/        # Login, Signup, Onboarding
│   └── (app)/         # Dashboard, Tasks, Focus, Groups, Calendar, Notifications, Profile
├── components/        # Shared UI components
├── lib/               # Supabase client, theme, types, utils
└── store/             # Zustand global state
```

## Key features

- Responsive: sidebar on ≥768px, tab bar on mobile
- Dark/light theme persisted in AsyncStorage
- Supabase Realtime for notifications and group progress sync
- Pomodoro timer with animated SVG circle
- Kanban board (4-column) with column switching on mobile
- Smart reschedule with available slot detection
- Analytics dashboard with Victory Native charts
