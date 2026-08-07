# Deployment

## Hosting

GitHub Pages at: `https://andrewkameniev.github.io/petanque-draw/`

Deployed automatically via GitHub Actions on push to `develop`.

## Build

```bash
npm run build
```

Outputs to `dist/` directory. The `dist/` folder is gitignored — CI builds and deploys it.

## CI/CD

`.github/workflows/deploy.yml` runs on push to `develop`:

1. Checkout code
2. `npm ci`
3. `npm run build`
4. Upload `dist/` as Pages artifact
5. Deploy to GitHub Pages

## Vite Config

- `base: '/petanque-draw/'` in production (for GitHub Pages subpath)
- `base: '/'` in dev mode
- Source maps enabled for production builds
- `html2pdf.js` pre-bundled via `optimizeDeps.include`

## Service Worker

- `public/firebase-messaging-sw.js` — Handles background push notifications
- Uses Firebase JS SDK v8.10.1 (legacy compat API)
- `src/registerServiceWorker.js` exists but is commented out in `main.js`

## Environment

- Production domain detection: `import.meta.env.PROD`
- Dev server: `npm run dev` (Vite, localhost:5173)

### Portal API

Authenticated portal writes require `VITE_FPU_AUTH_TOKEN`. The GitHub Pages
workflow reads it from the `FPU_AUTH_TOKEN` secret in the `github-pages`
environment. For local development, create an untracked `.env.local` file:

```dotenv
VITE_FPU_AUTH_TOKEN=<portal api_password>
```

Restart the Vite dev server after changing the file. Never commit the password;
`.env.local` is gitignored.

## Cloud Function

Notification sending uses a Cloud Run endpoint:
`https://sendmessage-etoydcc3na-uc.a.run.app/sendMessage`

Accepts POST with `{ tokens: [...], message: { title, body } }`
