#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SERVICE_NAME="${SERVICE_NAME:-ark-backend}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-arkproject}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:8787/api/health}"
STARTUP_WAIT_SECONDS="${STARTUP_WAIT_SECONDS:-3}"
RUN_CONTENT_SYNC="${RUN_CONTENT_SYNC:-0}"
RUN_NGINX_RELOAD="${RUN_NGINX_RELOAD:-0}"
SERVICE_TEMPLATE="deploy/ubuntu/ark-backend.service.example"
NGINX_TEMPLATE="deploy/ubuntu/nginx-public.conf.example"

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

read_with_optional_sudo() {
  local target="$1"

  if [ -r "$target" ]; then
    cat "$target"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo -n cat "$target"
    return
  fi

  return 1
}

template_hash() {
  sha256sum "$1" | awk '{print $1}'
}

check_template_baseline() {
  local label="$1"
  local template_path="$2"
  local baseline_path="$3"
  local expected_hash
  expected_hash="$(template_hash "$template_path")"

  if baseline_hash="$(read_with_optional_sudo "$baseline_path" 2>/dev/null)"; then
    baseline_hash="$(printf '%s' "$baseline_hash" | tr -d '\r\n')"
    if [ "$baseline_hash" != "$expected_hash" ]; then
      echo "[deploy] ERROR: ${label} template changed since the last acknowledged baseline." >&2
      echo "[deploy] Review ${template_path} against the live config, then run deploy/ubuntu/install-on-server.sh on the server to acknowledge the new template." >&2
      exit 1
    fi
    echo "[deploy] ${label} template baseline matches the checked-in template"
    return
  fi

  echo "[deploy] WARNING: ${label} template baseline is missing at ${baseline_path}" >&2
  echo "[deploy] Run deploy/ubuntu/install-on-server.sh after reviewing the live config to establish a baseline and avoid silent drift." >&2
}

require_command npm
require_command curl
require_command sha256sum

cd "$APP_DIR"

if [ ! -f package.json ]; then
  echo "Missing package.json in $APP_DIR" >&2
  exit 1
fi

check_template_baseline "systemd" "$SERVICE_TEMPLATE" "/etc/systemd/system/${SERVICE_NAME}.service.template-sha256"
check_template_baseline "nginx" "$NGINX_TEMPLATE" "/etc/nginx/sites-available/${NGINX_SITE_NAME}.template-sha256"

echo "[deploy] npm ci"
npm ci

echo "[deploy] npm run build"
npm run build

echo "[deploy] npm test"
npm test

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
