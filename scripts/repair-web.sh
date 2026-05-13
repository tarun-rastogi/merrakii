#!/usr/bin/env bash
# Fix "Internal Server Error" on http://localhost:3002/ when a stuck or mismatched
# next-server is serving a broken or out-of-sync .next directory.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Stop listeners on 3002 / 4000 (dev + production Next)"
bash scripts/restart-dev.sh

echo "==> Remove Next.js output cache (apps/web/.next)"
rm -rf "apps/web/.next"

echo "==> Rebuild shared + web"
npm run build -w @merrakii/shared
npm run build -w @merrakii/web

echo ""
echo "Done. Start the stack with:"
echo "  npm run dev"
echo "Or production web only:"
echo "  npm run start -w @merrakii/web"
