# Architecture

## Tech Stack

- **Framework**: Vue 3 (Options API)
- **State**: Vuex 4
- **Router**: Vue Router 4 (hash mode)
- **Backend**: Firebase Realtime Database (no custom server)
- **Auth**: Firebase Authentication (email/password)
- **Notifications**: Firebase Cloud Messaging (FCM)
- **CSS**: Bulma + custom styles
- **Build**: Vue CLI 5 / Webpack
- **i18n**: vue-i18n (English + Ukrainian)
- **Charts**: ApexCharts (vue3-apexcharts)
- **PDF**: html2pdf.js
- **PWA**: @vue/cli-plugin-pwa (currently disabled in code)

## Project Structure

```
src/
├── main.js              # App entry, router + i18n setup
├── App.vue              # Root (just router-view)
├── store.js             # Vuex store (tournaments state + Firebase sync)
├── firebase.js          # Firebase init (auth, db, messaging)
├── helpers.js           # Tournament logic (ranking, sorting, draw utils)
├── helpers-stat.js      # Statistics calculation (French/Simple systems)
├── languages.js         # i18n translations (en/ua)
├── router.js            # Unused legacy router file
├── data.json            # Ukrainian Petanque Federation player names
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
│   ├── Modal.vue        # Generic modal
│   ├── Help.vue         # Documentation/help modal
│   ├── Loader.vue       # Loading spinner
│   ├── ConfirmRemoveModal.vue
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
│   │   ├── Protocol.vue     # Tournament protocol export
│   │   ├── QrCode.vue       # QR code for sharing
│   │   ├── SaveTournament.vue
│   │   ├── SavedTournamentModal.vue
│   │   ├── ChangeTournamentName.vue
│   │   ├── Footer.vue
│   │   └── LanguageSwitcher.vue
│   ├── stats/           # Statistics sub-components
│   │   ├── Teaminfo.vue      # Per-team stat tracking UI
│   │   ├── StatResult.vue    # Game result summary
│   │   ├── StatsArchive.vue  # Past games list
│   │   ├── StatsAnalysis.vue # Player analysis with charts
│   │   ├── StatCheckbox.vue  # Throw result toggle
│   │   ├── StatTags.vue      # Tag management
│   │   └── ThrowResult.vue   # Individual throw display
│   ├── training/        # Training sub-components
│   │   ├── TrainingAdd.vue        # Create exercise
│   │   ├── TrainingItem.vue       # Execute exercise
│   │   ├── TrainingResult.vue     # View exercise results
│   │   └── TrainingResultGraph.vue
│   └── docs/            # In-app documentation images
└── assets/
    ├── css/             # Bulma + custom CSS
    └── img/             # Backgrounds, logos, doc screenshots
```

## Data Flow

1. User authenticates via Firebase Auth
2. On login, Vuex dispatches `getTournaments` which reads from Firebase RTDB at `/{uid}/tournaments/`
3. All mutations listed in `mutationsAfterUpdateDb` trigger a `store.subscribe` callback that writes back to Firebase
4. Public viewers read tournament data directly from Firebase using the shared link query params (`?user={uid}&tournament={id}`)

## Routing

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Draw | Main tournament management |
| `/show` | Public | Public tournament viewer |
| `/login-user` | LoginUser | Authentication |
| `/doc` | Help | Documentation |
| `/stats` | Stats | Game statistics |
| `/training` | Training | Training exercises |
