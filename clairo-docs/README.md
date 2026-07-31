# Clario Docs

The standalone documentation site for **Clario — Your Daily Emotional Companion**. It is a Bun-managed React application styled with Tailwind CSS and initialized with shadcn/ui.

## Run locally

```bash
cd clario-docs
bun install
bun run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

The docs site deploys to **Cloudflare Pages** (`docs-clario.pages.dev`) via `wrangler`; set build-time env vars (e.g. `VITE_BACKEND_BASE_URL`) in the Cloudflare dashboard.

## Build for production

```bash
bun run build
bun run preview
```

The static production site is written to `clairo-docs/dist`.

## What the site covers

- A user-first guide to starting daily check-ins, practicing emotion-calibrated breathing exercises, finding creative relief through Air Drawing and Space Blocks, and seeing your home garden bloom.
- Privacy and control statements detailing exactly how Clario protects your personal entries, local browser MediaPipe processing, and secure voice chat transcript privacy.
- A fully detailed developer section covering local development guides (FastAPI and Vite/React Frontend), SQLite database schemas, database migrations, WebSocket live duplex voice gateways, and troubleshooting.
