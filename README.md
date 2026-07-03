# CognX — Operator Client (Next.js)

Front-end only. The backend is the Supabase edge functions (`dashboard-api`).
Login (Supabase Auth) → approve/edit/reject drafts, browse conversations, reply
manually, "suggest next message", toggle auto-reply per customer, block, and edit
the system prompt.

Static export (`output: "export"`) — no server. Deploy the `out/` folder anywhere.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · @supabase/supabase-js.

## Local dev
```bash
cd D:/Dev/cognx-dm-client
npm install
npm run dev          # http://localhost:3000
```

`.env.local` already has the (public) Supabase URL + publishable key. Real
security is the login token + the operator-email check inside `dashboard-api`.

## Build
```bash
npm run build        # outputs static site to ./out
```

## Deploy

### Option A — Vercel (easiest)
Import the repo at vercel.com → it auto-detects Next.js → deploy. No config, no
basePath. Add the two `NEXT_PUBLIC_*` env vars in the Vercel dashboard.

### Option B — GitHub Pages (workflow included)
`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. The workflow sets `basePath` to `/<repo>` and adds `.nojekyll`
   automatically, so assets resolve correctly at
   `https://<you>.github.io/<repo>/`.

## First-time login
Create your operator account in **Supabase dashboard → Authentication → Users →
Add user** (email + password, tick *Auto Confirm User*). The email must match
`ALLOWED_OPERATOR_EMAIL` set on the functions (`ph.lima014@gmail.com`).

## Structure
```
app/            layout, globals.css, page.tsx (orchestrator)
components/      Login, TopBar, PendingView, ConversationsView, ThreadView, ConfigView, Bits
lib/            supabase client, api wrappers, config
types.ts        shared types
```
