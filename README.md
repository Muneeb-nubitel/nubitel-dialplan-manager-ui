# Nubitel Dialplan Manager UI

Web interface for Nubitel call-center agents, campaigns, tiers, live queue activity, and PostgreSQL call records.

## Run locally

### Requirements

- Node.js 20.19 or newer; Node.js 22 LTS is recommended.
- Corepack, included with most Node.js installations.
- Access to the Nubitel Redis and PostgreSQL services.

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
read -s "REDIS_PWD?Redis password: "
export REDIS_PWD
echo

export DB_HOST="dev-test.cwofoftqiuof.ap-southeast-1.rds.amazonaws.com"
export DB_PORT="5432"
export DB_USER="cxnubitel"
export DB_NAME="cxnubiteldev"
read -s "DB_PASSWORD?PostgreSQL password: "
export DB_PASSWORD
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

## Stop the app

Press `Ctrl+C` in both running terminals.

If a terminal was closed while its process remained active, stop the local ports with:

```bash
lsof -ti :5173 | xargs kill
lsof -ti :5050 | xargs kill
```

## Verification commands

Run all TypeScript checks:

```bash
export PATH="/opt/homebrew/bin:$PATH"
corepack pnpm@10.32.0 run typecheck
```

Build the workspace:

```bash
export PATH="/opt/homebrew/bin:$PATH"
corepack pnpm@10.32.0 run build
```

## Troubleshooting

- **Node.js 18** or `crypto.hash is not a function`: run `export PATH="/opt/homebrew/bin:$PATH"`, confirm `node --version` is 20.19+, and retry.
- **`pnpm: command not found`**: use the documented `corepack pnpm@10.32.0` commands.
- **Campaigns or call records unavailable**: confirm the local data API terminal is still running and open `http://localhost:5050/api/healthz`.
- **Dummy data is displayed**: disable **Mock API** in Settings and save.
- **Port already in use**: stop the existing process with the commands in **Stop the app**, or choose another port and update `VITE_CAMPAIGNS_API_BASE_URL` accordingly.
- **Vite reports missing `PORT` or `BASE_PATH`**: include `PORT=5173 BASE_PATH=/` before the UI command.
