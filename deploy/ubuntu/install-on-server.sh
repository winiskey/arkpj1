#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/arkproject/current}"
ENV_FILE="${ENV_FILE:-/var/www/arkproject/shared/ark-backend.env}"
SERVICE_NAME="${SERVICE_NAME:-ark-backend}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-arkproject}"

cd "$APP_DIR"

npm ci
npm run build

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

sudo cp deploy/ubuntu/ark-backend.service.example "/etc/systemd/system/${SERVICE_NAME}.service"
sudo cp deploy/ubuntu/nginx-public.conf.example "/etc/nginx/sites-available/${NGINX_SITE_NAME}"
sudo ln -sf "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}"
sudo nginx -t
sudo systemctl reload nginx
