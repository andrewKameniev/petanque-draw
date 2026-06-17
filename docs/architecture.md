# Architecture

## Tech Stack

- **Framework**: Vue 3 (Options API)
- **State**: Pinia
- **Router**: Vue Router 5 (hash mode)
- **Backend**: Firebase Realtime Database (no custom server)
- **Auth**: Firebase Authentication (email/password)
- **Notifications**: Firebase Cloud Messaging (FCM)
- **CSS**: Bulma + custom styles + CSS variables for theming
- **Build**: Vite 8
- **i18n**: vue-i18n 11 (English, Ukrainian, French, Spanish)
- **Icons**: lucide-vue-next
- **Charts**: ApexCharts 5 (vue3-apexcharts)
- **PDF**: html2pdf.js
- **Linting**: ESLint 9 + Prettier + Stylelint
- **CI/CD**: GitHub Actions (auto-deploy to Pages on push to develop)

## Project Structure

```
src/
├── main.js              # App entry, router + i18n setup
├── App.vue              # Root (just router-view)
├── stores/main.js       # Pinia store (tournaments state + Firebase sync)
├── firebase.js          # Firebase init (auth, db, messaging)
├── helpers.js           # Tournament logic (ranking, sorting, draw utils)
├── helpers-stat.js      # Statistics calculation (French/Simple systems)
├── i18n.js              # Shared vue-i18n instance
├── locales/             # Translation files
│   ├── en.js
│   ├── ua.js
│   ├── fr.js
│   └── es.js
├── services/
│   ├── db.js            # Firebase CRUD services
│   └── results.js       # Tournament result calculation
├── views/
│   ├── LoginUser.vue    # Auth page (login/register)
│   ├── Public.vue       # Public tournament viewer (shared link)
│   ├── Stats.vue        # Game statistics tracking
│   └── Training.vue     # Training exercises
├── components/
│   ├── Draw.vue         # Main app shell (auth-gated)
│   ├── Tournament.vue   # Active tournament management
│   ├── Navbar.vue       # Top navigation
│   ├── Menu.vue         # Side menu
│   ├── Message.vue      # Toast notifications
│   ├── Modal.vue        # Generic modal (default slot only)
│   ├── partials/        # Tournament sub-components
│   │   ├── Games.vue        # Draw algorithm + round management
│   │   ├── Game.vue         # Single game score input
│   │   ├── PlayOff.vue      # Knockout stage management
│   │   ├── Bracket.vue      # Playoff bracket visualization
│   │   ├── Cadrage.vue      # Cadrage round
│   │   ├── Ranking.vue      # Standings table
│   │   ├── Results.vue      # Round-by-round results
│   │   ├── AddTeam.vue      # Team registration + portal import
│   │   ├── TeamsList.vue    # Team list display
│   │   ├── Preferences.vue  # Tournament settings modal
│   │   └── ...
│   ├── tir/             # TIR (precision shooting) module
│   │   ├── TirModule.vue         # Admin: tabs + all views
│   │   ├── TirPublicView.vue     # Public: read-only tournament view
│   │   ├── TirPlayoffMatch.vue   # Shared: match scoring (readOnly prop)
│   │   ├── TirParticipantView.vue # Per-participant scoring
│   │   └── TirAtelierView.vue    # Per-atelier scoring (all participants)
│   ├── stats/           # Statistics sub-components
│   └── training/        # Training sub-components
└── assets/
    ├── css/             # Bulma + custom CSS + variables.css
    └── img/             # Backgrounds, logos
```

## Data Flow

1. User authenticates via Firebase Auth
2. On login, Pinia store dispatches `getTournaments` which reads from Firebase RTDB at `/{uid}/tournaments/`
3. Store actions that modify tournament data call `syncToFirebase()` which writes the current tournament back to Firebase
4. Public viewers subscribe to tournament data using Firebase `onValue` for real-time updates

## Component Reuse Pattern

Shared components accept a `readOnly` prop to disable interaction while reusing the same rendering logic. Example: `TirPlayoffMatch` is used in both admin (scoring) and public (viewing) contexts.

When the same UI is needed on admin and public pages, extract it into a shared component rather than reimplementing inline.

## Routing

| Path          | Component | Purpose                                  |
| ------------- | --------- | ---------------------------------------- |
| `/`           | Draw      | Main tournament management (auth-gated)  |
| `/tournament` | Public    | Public tournament viewer (query: `ref=`) |
| `/show`       | redirect  | Legacy redirect → `/tournament`          |
| `/login-user` | LoginUser | Authentication                           |
| `/doc`        | Help      | Documentation / help                     |
| `/stats`      | Stats     | Game statistics                          |
| `/training`   | Training  | Training exercises                       |
| `/archived`   | Archived  | Archived tournaments (auth-gated)        |
