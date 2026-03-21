#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SERVICE_NAME="${SERVICE_NAME:-ark-backend}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:8787/api/health}"
STARTUP_WAIT_SECONDS="${STARTUP_WAIT_SECONDS:-3}"
RUN_CONTENT_SYNC="${RUN_CONTENT_SYNC:-0}"
RUN_NGINX_RELOAD="${RUN_NGINX_RELOAD:-0}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

run_systemctl() {
  if command -v sudo >/dev/null 2>&1; then
    sudo -n systemctl "$@"
    return
  fi

  systemctl "$@"
}

require_command npm
require_command curl

cd "$APP_DIR"

if [ ! -f package.json ]; then
  echo "Missing package.json in $APP_DIR" >&2
  exit 1
fi

echo "[deploy] npm ci"
npm ci

echo "[deploy] npm run build"
npm run build

if [ "$RUN_CONTENT_SYNC" = "1" ]; then
  echo "[deploy] npm run sync:content"
  npm run sync:content
fi

echo "[deploy] npm ls ws"
npm ls ws >/dev/null

echo "[deploy] systemctl restart $SERVICE_NAME"
run_systemctl restart "$SERVICE_NAME"

sleep "$STARTUP_WAIT_SECONDS"

echo "[deploy] curl $HEALTHCHECK_URL"
curl --fail --silent "$HEALTHCHECK_URL" >/dev/null

if [ "$RUN_NGINX_RELOAD" = "1" ]; then
  echo "[deploy] systemctl reload nginx"
  run_systemctl reload nginx
fi

run_systemctl status "$SERVICE_NAME" --no-pager

echo "[deploy] deployment succeeded"
