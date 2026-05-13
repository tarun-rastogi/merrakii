#!/usr/bin/env bash
# Stop all dev processes for this monorepo, free web (3002) and API (4000) ports, then you can run `npm run dev`.
# macOS / Linux. Uses this repo's node_modules/.bin (parent path may contain spaces).

set -u
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$REPO_ROOT/node_modules/.bin"
WEB_DEV_PORT="${WEB_DEV_PORT:-3002}"

echo "Stopping prior dev processes for this repo…"
# Order: concurrently (parents) → bundlers → watchers
pkill -TERM -f "${BIN}/concurrently" 2>/dev/null || true
sleep 1
pkill -KILL -f "${BIN}/concurrently" 2>/dev/null || true
pkill -KILL -f "${BIN}/tsx watch" 2>/dev/null || true
pkill -KILL -f "${BIN}/next dev" 2>/dev/null || true
# Production `next start` shows in ps as "next-server (v…)" with no path — free by port below.
pkill -KILL -f "${REPO_ROOT}/.*next dev" 2>/dev/null || true
pkill -KILL -f "${REPO_ROOT}/.*next start" 2>/dev/null || true
sleep 1

kill_port() {
  local port="$1"
  if pids=$(lsof -ti:"$port" 2>/dev/null); then
    echo "$pids" | sort -u | xargs kill -9 2>/dev/null || true
  fi
}

for _ in 1 2 3; do
  kill_port 3001
  kill_port 3002
  kill_port 4000
  sleep 0.5
done

for i in $(seq 1 30); do
  n4000=$(lsof -tiTCP:4000 -sTCP:LISTEN 2>/dev/null | wc -l | tr -d " \n" || echo 0)
  nweb=$(lsof -tiTCP:"$WEB_DEV_PORT" -sTCP:LISTEN 2>/dev/null | wc -l | tr -d " \n" || echo 0)
  if [[ "$n4000" == "0" && "$nweb" == "0" ]]; then
    echo "Ports ${WEB_DEV_PORT} (web) and 4000 (API) are free. Run: npm run dev"
    echo "If http://localhost:${WEB_DEV_PORT}/ still returns HTTP 500, run: npm run fix:web"
    exit 0
  fi
  kill_port 4000
  kill_port 3001
  kill_port 3002
  sleep 0.5
done

echo "Warning: a process may still hold ${WEB_DEV_PORT}/4000 — check Activity Monitor or other terminals." >&2
