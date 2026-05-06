# Deployment

## Hosting

GitHub Pages at: `https://andrewkameniev.github.io/petanque-draw/dist/`

The `publicPath` in `vue.config.js` is set to `/petanque-draw/dist/` for production.

## Build

```bash
npm run build
```

Outputs to `dist/` directory. The dist folder is committed to the repo (not gitignored).

## Service Worker

- `public/firebase-messaging-sw.js` — Handles background push notifications
- Uses Firebase JS SDK v8.10.1 (legacy compat API)
- `src/registerServiceWorker.js` exists but is commented out in `main.js`

## Environment

- Production domain detection: `window.location.origin + '/petanque-draw/dist'`
- Dev server: `npm run serve` (localhost with `/` publicPath)

## Cloud Function

Notification sending uses a Cloud Run endpoint:
`https://sendmessage-etoydcc3na-uc.a.run.app/sendMessage`

Accepts POST with `{ tokens: [...], message: { title, body } }`
