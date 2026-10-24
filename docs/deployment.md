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
6. Publish the deployed `package.json` version to Firebase Realtime Database at
   `appMeta/version`

`FIREBASE_SERVICE_ACCOUNT` must be configured as a `github-pages` environment
secret containing the JSON service account for the `petanque-draw` project. The
deploy workflow uses it only after Pages reports a successful deployment; the
script refuses to replace a newer Firebase version. The database URL is set in
the workflow. Missing credentials fail the publication step and require a
rerun after configuration.

The one-time `database.rules.json` change permitting anonymous reads of
`appMeta/version` must be deployed before clients can observe new versions.
Client writes to that path remain denied; the deploy workflow uses Firebase
Admin credentials. Rules rollout remains a separate production operation.

Every PR version bump follows [VERSION-001](../AGENTS.md). The PR quality gate
checks the bump against its base commit and checks both package files.

## Vite Config

- `base: '/petanque-draw/'` in production (for GitHub Pages subpath)
- `base: '/'` in dev mode
- Source maps enabled for production builds
- `html2pdf.js` pre-bundled via `optimizeDeps.include`

## Service Worker

- `public/firebase-messaging-sw.js` — Handles background push notifications
- Uses Firebase JS SDK v8.10.1 (legacy compat API)
- `src/registerServiceWorker.js` exists but is commented out in `main.js`

## Open-page updates

Production clients subscribe to the small `appMeta/version` node. On first
visit, the bundled version is saved in local storage without reloading. On a
later Firebase version newer than the running bundle, the page reloads with an
`appVersion` query parameter to fetch fresh HTML while preserving the hash
route and tournament query. Session storage and that query parameter prevent a
reload loop if a stale bundle is served. No cookie is needed. Local Vite
development does not subscribe to the production version.

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
