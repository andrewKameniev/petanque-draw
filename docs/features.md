# Features

## Tournament Management

- Create up to 10 simultaneous tournaments
- Swiss, Round-Robin, Supermele, and Playoff systems
- Automatic draw algorithm respecting Swiss system constraints
- Lane assignment with history-aware distribution
- Score entry with validation (max score, equal score detection)
- Round restore (undo last round)
- Tournament finish with final rankings
- Save completed tournaments to history
- Export protocol to PDF
- Copy results to clipboard

## Remote Viewing

- Generate shareable link with QR code
- Anyone with the link sees live tournament state
- Push notifications via FCM when organizer updates

## Team Management

- Manual team entry with optional rating
- Import teams from Ukrainian Petanque Federation portal
- Restore teams from previous tournament (localStorage backup)
- Player names tracked per team

## Statistics Tracking

- Track throw-by-throw statistics during games
- Simple and French scoring systems
- Classic (manual) and Fast (auto-fill) modes
- Positive/Negative scenarios for default outcomes
- Per-player stats with series visualization
- Tag system for categorizing games
- Archive of all recorded games
- Analysis with filtering by player, period, format, tag, distance
- Charts showing performance trends (ApexCharts)
- Player substitution tracking mid-game
- Swipe navigation between rounds on mobile

## Training

- Create custom exercises with configurable distances and throw counts
- Series support (e.g., classical shooting: 3 series at different distances)
- Logical (hit/miss) or point-based scoring
- Training session recording and results history
- Per-distance result breakdown
- Average performance over time

## Internationalization

- English and Ukrainian languages
- Language switcher in navbar

## PWA

- Service worker registered for push notifications
- Offline-capable build output (though currently service worker registration is commented out in app code)
