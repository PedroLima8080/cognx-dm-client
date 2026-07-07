# CLAUDE.md — cognx-dm-client (operator UI)

Guidance for AI assistants working in this repo. Read this before editing.

## What this is

The **operator front-end** for CognX's Instagram-DM agent. Front-end only: there is
no server in this repo. All data comes at runtime from the Supabase edge function
`dashboard-api`, which lives in the **backend repo** `cognx-dm-agent`
(`D:\Dev\cognx-dm-agent`). CognX is a Brazilian caffeine-free nootropic supplement;
the UI is in Portuguese.

The operator logs in (Supabase Auth) and can: approve/edit/reject pending drafts,
browse conversations, reply manually, "suggest next message", sync a thread with
Instagram, "train" the system prompt from a real conversation, toggle auto-reply
per customer, block customers, and edit settings/the system prompt.

## Stack & build model

Next.js 14 (App Router) · TypeScript · Tailwind CSS · `@supabase/supabase-js`.

**Static export** (`next.config.mjs`: `output: "export"`, `trailingSlash: true`).
`npm run build` emits a fully static site to `out/` — deployable to GitHub Pages,
Vercel, Netlify, S3, anywhere. **There is no Node server and no SSR at runtime.**

Consequences you must respect:
- Every data-fetching component is `"use client"`. No server components with data,
  no route handlers, no `getServerSideProps`.
- **Dynamic ids go in the query string, not path segments.** A static export can't
  prerender runtime DB ids, so conversation pages are `/conversa/?id=<uuid>` and
  `/treinar/?id=<uuid>`, read via `useSearchParams()`. There are no `[id]` dynamic
  segments.
- `useSearchParams()` must be wrapped in `<Suspense>` (Next requirement for static
  export) — see `app/conversa/page.tsx` for the pattern; copy it for new id-based pages.
- `basePath` comes from `NEXT_PUBLIC_BASE_PATH` (set by the GitHub Pages workflow to
  `/<repo>`; empty for Vercel/root).

## Routing (real URLs, one view each)

| Path | Renders | Notes |
|---|---|---|
| `/` | redirect → `/pendentes/` | client redirect in `app/page.tsx` |
| `/pendentes/` | `PendingView` | approval queue |
| `/conversas/` | `ConversationsView` | list; loads only summary fields (fast) |
| `/conversa/?id=` | `ThreadView` | full thread; loads everything for one conversation |
| `/treinar/?id=` | `TrainView` | prompt-training loop for one conversation |
| `/campanhas/` | `CampaignsView` | comment-to-DM campaigns (CRUD) + activity log |
| `/config/` | `ConfigView` | settings, system prompt, IG import |

`app/*/page.tsx` files are thin — they wire the URL to a component in `components/`.
Put real logic in the component, not the page.

**Performance intent (do not regress):** the conversation LIST must fetch only what
the list needs (`?action=conversations`, backed by an RPC). Full message history +
draft load only when entering a specific conversation (`?action=thread&id=`).

## Layout

```
app/            layout.tsx (wraps children in <Shell>), globals.css, page.tsx (redirect),
                and one folder per route (pendentes, conversas, conversa, treinar, config)
components/     Shell, TopBar, Login, PendingView, ConversationsView, ThreadView,
                TrainView, ConfigView, Bits (shared small UI: Loading/Empty/Thread)
lib/           supabase (client), api (apiGet/apiPost wrappers), config (URL + keys)
types.ts       shared response types (mirror dashboard-api's shapes)
```

- **`Shell.tsx`** wraps every page (from the root layout): guards auth (renders
  `Login` if no session), renders `TopBar` once, and holds the global
  `auto_reply_enabled` kill-switch toggle. Session isn't re-fetched on client nav.
- **`TopBar.tsx`** is Link-based nav using `usePathname`; the "Conversas" tab stays
  active on `/conversa*` too.

## Talking to the backend

Everything goes through `lib/api.ts`:
- `apiGet<T>(qs)` → `GET dashboard-api<qs>` (e.g. `"?action=thread&id=..."`).
- `apiPost<T>(obj)` → `POST dashboard-api` with `{ action, ... }` in the body.

Both attach `apikey` (publishable) + `Authorization: Bearer <session token>`. The
backend gateway enforces `verify_jwt` and then checks the operator email. All calls
return `{ ok, status, body }`.

**`types.ts` mirrors `dashboard-api` response shapes.** When the backend changes an
action's payload, update `types.ts` and the consuming component here. The two repos
are contract-coupled through these shapes and the `action` strings.

## Config & secrets

`lib/config.ts` holds the Supabase URL, the **publishable** key, and the derived
`API` URL. These are public and safe in the bundle — real security is the login
token plus the operator-email check inside `dashboard-api`. Override via
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(`.env.local`, gitignored). Never put a service-role key or any secret in this repo.

## Commands

```bash
cd D:/Dev/cognx-dm-client
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
npm run lint
```

Deploy: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `main` (sets `basePath`, injects the public env vars, adds `.nojekyll`).
Vercel also works with zero config (set the two `NEXT_PUBLIC_*` vars in its dashboard).

First login: create the operator user in **Supabase → Authentication → Users → Add
user** (Auto Confirm). The email must equal `ALLOWED_OPERATOR_EMAIL` on the functions.

## Windows build gotcha

An `EPERM .next\trace` lock can appear if a stale `next` process is holding files.
Kill lingering node processes for this repo, delete `.next`, and rebuild:
```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*cognx-dm-client*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## Working conventions

- New data view? `"use client"` component in `components/`, thin `page.tsx`, add the
  tab to `TopBar` if it's top-level. Id-based pages copy the Suspense +
  `useSearchParams` pattern.
- Reuse `Bits.tsx` (`Loading`, `Empty`, `Thread`) instead of re-rolling primitives.
- Keep list views lean; defer heavy loads to the detail view.
- Match the existing terse Tailwind style (`card`, `field`, `btn-*`, `lbl` utility
  classes defined in `globals.css`).
- Backend contract changes must land in `cognx-dm-agent`'s `dashboard-api` and here
  together.
