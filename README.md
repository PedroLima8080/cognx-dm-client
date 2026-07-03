# CognX — Operator Client

Static operator dashboard for the CognX DM agent. Login (Supabase Auth) →
approve/edit/reject drafts, browse conversations, reply manually.

It's a single `index.html` with no build step. It talks to the `dashboard-api`
Supabase function (which requires a valid operator login token).

## Config

Edit the CONFIG block at the top of the `<script>` in `index.html` if anything changes:

```js
const SUPABASE_URL    = "https://ontekwcuuckzvuoittrc.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_...";   // safe to be public
const API             = SUPABASE_URL + "/functions/v1/dashboard-api";
```

The publishable key is meant to be public — real security is the Supabase login
token + the operator-email check inside `dashboard-api`.

## Deploy to GitHub Pages

```bash
cd D:/Dev/cognx-dm-client
git init
git add .
git commit -m "CognX operator client"
git branch -M main
git remote add origin https://github.com/<you>/cognx-dm-client.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: `main` / root → Save**.
Your dashboard will be at `https://<you>.github.io/cognx-dm-client/`.

## First-time login

Create your operator account in the **Supabase dashboard → Authentication →
Users → Add user** (email + password, tick *Auto Confirm User*). That email must
match `ALLOWED_OPERATOR_EMAIL` set on the functions. Then log in from the client.
