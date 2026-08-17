# Nubitel Dialplan Manager UI

Web interface for Nubitel call-center agents, campaigns, tiers, live queue activity, and PostgreSQL call records.

## Run locally

### Requirements

- Node.js 20.19 or newer; Node.js 22 LTS is recommended.
- Corepack, included with most Node.js installations.
- Access to the Nubitel Redis and PostgreSQL services.

## macOS / Linux

This Mac may default to Node.js 18. Activate the newer Homebrew installation in every new terminal:

```bash
export PATH="/opt/homebrew/bin:$PATH"
node --version
```

The reported version must be 20.19 or newer.

### 1. Install dependencies

Run this once from the repository root:

```bash
export PATH="/opt/homebrew/bin:$PATH"
corepack pnpm@10.32.0 install --frozen-lockfile
```

### 2. Start the local data API

Open the first terminal in the repository root. Set the Redis and PostgreSQL connection values, enter each password when prompted, and start the server on port 5050:

```bash
export PATH="/opt/homebrew/bin:$PATH"

export REDIS_HOST="temporar-redis-cxdev.nubitel.io"
export REDIS_PORT="11012"
export REDIS_PWD="06LXiAr6GVqLHZ6hDbjTtHprYNqyRLUS"
echo

export DB_HOST="dev-test.cwofoftqiuof.ap-southeast-1.rds.amazonaws.com"
export DB_PORT="5432"
export DB_USER="cxnubitel"
export DB_NAME="cxnubiteldev"
export DB_PASSWORD="y4Q8Uyj0G2m0ElCUl"
echo

PORT=5050 corepack pnpm@10.32.0 --filter @workspace/api-server run dev
```

Keep this terminal running. The server provides:

- `http://localhost:5050/api/campaigns` — campaigns from Redis, enriched with live queue-member statistics.
- `http://localhost:5050/api/cdr` — paginated call records from `public.mod_call_center_cdr` in PostgreSQL.
- `http://localhost:5050/api/healthz` — local server health check.

Redis and database passwords stay on the server and are never sent to browser code.

### 3. Start the UI

Open a second terminal in the repository root:

```bash
export PATH="/opt/homebrew/bin:$PATH"
PORT=5173 BASE_PATH=/ corepack pnpm@10.32.0 --filter @workspace/nubitel-call-center run dev
```

Open [http://localhost:5173](http://localhost:5173), go to **Settings**, turn **Mock API** off, and save preferences.

The UI uses these services:

- `https://cxdev-dialplan-api.nubitel.io` for agents, tiers, writes, and sync operations.
- `http://localhost:5050` for Redis campaigns, queue statistics, and PostgreSQL CDR reporting.

## Windows

Commands below are PowerShell. Node.js must be 20.19+ (22 LTS recommended) — Vite fails with
`crypto.hash is not a function` on older versions. Check with `node --version`; if it's too old,
install a current LTS with `winget install OpenJS.NodeJS.LTS` (or the installer from nodejs.org)
and open a new terminal.

### 1. One-time workspace fix for native binaries

`pnpm-workspace.yaml` deliberately excludes Windows-native binaries (Rollup, esbuild, lightningcss,
`@tailwindcss/oxide`) because the app deploys to Linux (Replit) only — see the `overrides` section's
`win32-*: "-"` entries. To install on Windows, remove the four `win32-x64`/`win32-x64-msvc` entries
for `esbuild`, `lightningcss`, `@tailwindcss/oxide`, and `rollup` (leave the other-architecture
exclusions alone), then run a non-frozen install so pnpm fetches the Windows binaries:

```powershell
corepack pnpm@10.32.0 install
```

**Do not commit the resulting changes to `pnpm-workspace.yaml` or `pnpm-lock.yaml`** — keep them
local so the team's Linux-only lockfile stays intact for everyone else.

### 2. Create your `.env` files

The app reads env vars via `process.env` directly (no dotenv). Create these two files with your
Redis/PostgreSQL credentials — ask your team for current dev values, do not reuse old ones blindly:

`artifacts/api-server/.env`
```
REDIS_HOST=temporar-redis-cxdev.nubitel.io
REDIS_PORT=11012
REDIS_PWD=<redis password>

DB_HOST=dev-test.cwofoftqiuof.ap-southeast-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=cxnubitel
DB_NAME=cxnubiteldev
DB_PASSWORD=<db password>

PORT=5050
```

`artifacts/nubitel-call-center/.env`
```
PORT=5173
BASE_PATH=/
```

Both files are gitignored (`.env`, `.env.*`) — they won't be committed.

### 3. Run both services with one command

```powershell
corepack pnpm@10.32.0 run dev
```

This runs `dev.mjs` at the repo root, which loads each package's `.env`, builds and starts
`api-server` on `:5050`, and starts the UI (Vite) on `:5173` — output is prefixed `[api-server]` /
`[ui]` in one terminal. It exists because `api-server`'s own `dev` script uses bash's
`export NODE_ENV=... &&` syntax, which fails under Windows' default shell; `dev.mjs` sets
`NODE_ENV` directly instead. `Ctrl+C` stops both.

Then open [http://localhost:5173](http://localhost:5173), go to **Settings**, turn **Mock API**
off, and save preferences.

## Stop the app

Press `Ctrl+C` in the running terminal(s).

If a terminal was closed while its process remained active, stop the local ports with:

**macOS / Linux**
```bash
lsof -ti :5173 | xargs kill
lsof -ti :5050 | xargs kill
```

**Windows (PowerShell)**
```powershell
Get-NetTCPConnection -LocalPort 5173,5050 -ErrorAction SilentlyContinue |
  Select-Object -Unique OwningProcess |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Verification commands

Run all TypeScript checks:

```bash
export PATH="/opt/homebrew/bin:$PATH"   # macOS/Linux only
corepack pnpm@10.32.0 run typecheck
```

Build the workspace:

```bash
export PATH="/opt/homebrew/bin:$PATH"   # macOS/Linux only
corepack pnpm@10.32.0 run build
```

On Windows, drop the `export PATH=...` line and run the `corepack pnpm@10.32.0 run ...` commands
directly in PowerShell.

## Troubleshooting

- **Node.js 18** or `crypto.hash is not a function`: on macOS run `export PATH="/opt/homebrew/bin:$PATH"`; on Windows install a current LTS (`winget install OpenJS.NodeJS.LTS`) and open a new terminal. Confirm `node --version` is 20.19+ and retry.
- **`pnpm: command not found`**: use the documented `corepack pnpm@10.32.0` commands.
- **Windows: `Cannot find module '@rollup/rollup-win32-x64-msvc'`** (or similar for esbuild/lightningcss/`@tailwindcss/oxide`): see **Windows → 1. One-time workspace fix for native binaries** above.
- **Windows: `'export' is not recognized...` when running `api-server`'s `dev` script directly**: use `corepack pnpm@10.32.0 run dev` from the repo root (runs `dev.mjs`) instead of `pnpm --filter @workspace/api-server run dev`.
- **Campaigns or call records unavailable**: confirm the local data API terminal is still running and open `http://localhost:5050/api/healthz`.
- **Dummy data is displayed**: disable **Mock API** in Settings and save.
- **Port already in use**: stop the existing process with the commands in **Stop the app**, or choose another port and update `VITE_CAMPAIGNS_API_BASE_URL` accordingly.
- **Vite reports missing `PORT` or `BASE_PATH`**: include `PORT=5173 BASE_PATH=/` before the UI command (or, on Windows, put them in the `.env` files as described above).
