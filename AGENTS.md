# AGENTS.md — CrossBugSense

Research project: ML app that predicts whether C#/JS source files are bug-prone from 24
source-code + code-smell metrics. Flask API + React/Vite SPA + Supabase (Auth + Postgres),
no CI, no tests.

## Commands

```bash
# Backend — MUST be run from backend/ (app.py does flat `from auth import ...`)
cd backend
pip install -r requirements.txt
python app.py            # http://localhost:5000, debug=True + reloader
python train_models.py   # retrain -> backend/models/*.pkl (--csv <path> to override)

# Frontend — MUST be run from frontend/
cd frontend
npm install
npm run dev              # http://localhost:5173
npm run build            # tsc -b && vite build  → also the typecheck gate
npm run lint             # oxlint
```

`npm run build` is the typecheck: `tsconfig.app.json` has `noUnusedLocals`,
`noUnusedParameters`, and `verbatimModuleSyntax`. So type-only imports **must** use
`import type { X } from './x'` — a plain `import { X }` fails the build.

There is no test suite and no test runner. Verification is manual: start both servers,
sign up, drop two files from `samples/` (buggy/fixed pairs: `shoppingCart.js` vs
`FixedShoppingCart.js`, `UserService.cs` vs `FixedUserService.cs`).

## Wiring

- Vite dev server proxies `/api` → `http://localhost:5000` (`frontend/vite.config.ts`).
  `VITE_API_URL` is only needed for non-proxied deployments; leave it unset in dev.
- Flask CORS is hardcoded to `http://localhost:5173` / `127.0.0.1:5173` — if you change the
  Vite port you must change `backend/app.py` too or every request fails CORS.
- **Auth is Supabase Auth** (project `oyhbwkoylcddgpcqzmdk`): the frontend signs users in with
  `@supabase/supabase-js` (config in `frontend/.env` → `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`) and sends the Supabase access token as `Authorization: Bearer` to
  Flask. `backend/auth.py:require_supabase_user` verifies it — RS256 via the project JWKS by
  default, or HS256 when env `SUPABASE_JWT_SECRET` is set. There is no Flask session/login route.
- Accounts/profiles/chats live in Supabase Postgres with RLS (`backend/supabase/migrations/`);
  the frontend reads/writes `profiles` + `chats` directly through the Supabase client (see
  `api.ts`), so **Flask has no auth or chat endpoints** — only `/api/models` and `/api/predict`.
  Schema changes go through a Supabase migration (MCP/CLI/dashboard), not `CREATE TABLE IF NOT EXISTS`.
- Supabase dashboard settings the app assumes: *Confirm email* can be on or off (signup handles
  both); *Redirect URLs* should include `http://localhost:5173/reset-password`; password-change
  reauthentication is not enforced client-side (Supabase's reauth window applies).
- Models are loaded **once at import** into `LOADED_MODELS` in `app.py`. After retraining you
  must restart the server.

## Things that will bite you

- **The 24-metric list is duplicated in three places** and must stay in sync:
  `backend/app.py:FEATURES`, `backend/train_models.py:FEATURES`,
  `frontend/src/types.ts:METRIC_ORDER`. It also has to match the column order in
  `backend/dataset.csv` (label column is `isBuggy`).
- **Prediction is hardcoded to exactly two files** (`file1`, `file2` multipart fields) in
  `app.py`, `api.ts:predict()`, and `Predictor.tsx`. Adding a third file is a change in all
  three.
- **Model accuracies shown in the UI are hardcoded** in `MODEL_ACCURACY` in `app.py`; they are
  not read from the `.pkl` files. Retraining does not update them.
- **Chats store the whole `PredictResponse`** in `public.chats.payload` (`jsonb`). Changing the
  prediction response shape breaks previously saved chats — `toSummary()` degrades them to 0 files.
  Chat ids are strings (Postgres bigint serialized as text) — never `Number()` them.
- `MODEL_DISPLAY` in `app.py` is the source of truth for which `.pkl` files get loaded — adding
  a model to `train_models.py` alone will not surface it in `/api/models`.
- All API errors return `{ "error": "..." }`; `api.ts:errorFrom()` reads that field. Keep the
  shape or the UI shows a generic `(status)` message.
- A 401 from the Flask API dispatches the `cbs-unauthorized` window event; `AuthContext` listens
  and signs the user out of Supabase. Don't add authenticated Flask calls that bypass `api.ts`.

## Frontend conventions

- Theming is **CSS custom properties on `<html data-theme="light|dark">`**, mapped into Tailwind
  v4 via `@theme` in `src/index.css` (e.g. `bg-panel`, `text-accent`, `font-mono`). There is no
  `tailwind.config.js` and no `dark:` variant usage — use the semantic tokens
  (`bg-bg/panel/card`, `text-ink/muted`, `text-buggy/good/warn`, `border-line`, `accent`).
- The theme is applied before first paint by an inline script in `index.html` reading
  `localStorage['cbs-theme']`. `src/settings.ts` owns that key plus `cbs-default-model`.
- Lint is **oxlint**, not ESLint. There are stray `// eslint-disable-next-line` comments left
  over from the CRA template — they do nothing; don't add more.
- Routing: `/` landing, `/login`, `/register`, `/forgot-password`, `/reset-password?recovery=1`
  (recovery links land on the root as `#type=recovery` and `main.tsx` rewrites them before the
  router boots; the route is intentionally unguarded), and `/dashboard/*` (predictor index,
  `chat/:chatId`, `profile`, `settings`). Guarded by `RequireAuth` / `RedirectIfAuthed` in
  `components/ProtectedRoute.tsx`; state lives in `auth/AuthContext.tsx` (driven by
  `supabase.auth.onAuthStateChange`) and `chat/ChatContext.tsx`. Pages go in `src/pages/`,
  shared UI in `src/components/`.
- All API access goes through `src/api.ts`, and all Supabase access through the single client in
  `src/supabase.ts` — no React Query, no other fetch/call sites.

## Docs drift

`README.md` is current with the Supabase migration: its endpoint table lists only
`/api/models` + `/api/predict` (the old Flask `/api/auth/*` + `/api/chats/*` routes are gone —
Supabase handles them). Keep verifying that table against the route decorators in
`backend/app.py`. `frontend/README.md` is untouched Vite template boilerplate.
Password reset is a Supabase recovery email (`resetPasswordForEmail` → root link with
`#type=recovery`); there is no demo reset URL anymore, and Supabase's built-in SMTP is rate-limited
to ~2 emails/hour — configure custom SMTP for real demos.

The old SQLite layer is fully removed: `backend/chats.py` is deleted and `backend/users.db` is
gone (accounts → `auth.users`/`public.profiles`, chats → `public.chats`, resets → Supabase).
Nothing reads `users.db` anymore, so a stale copy can be deleted freely.

## Git

Conventional Commits, lowercase, scoped: `feat(auth): ...`, `docs(readme): ...`,
`chore(graphify): ...`. Single `main` branch.

Note: `.gitignore` has `models/*.pkl`, which git anchors to the repo root — so the actual
`backend/models/*.pkl` files **are tracked**. Don't assume you need to retrain, and don't
expect a new `.pkl` to be ignored.
