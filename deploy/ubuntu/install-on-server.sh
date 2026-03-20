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
  echo "❌ 缺少环境变量文件: $ENV_FILE"
  echo "   请参考 deploy/ubuntu/ark-backend.env.example 创建该文件并填写 ADMIN_TOKEN 等必填项"
  exit 1
fi

# 复制 systemd service 文件（已存在则跳过，避免覆盖生产环境自定义配置）
SERVICE_DEST="/etc/systemd/system/${SERVICE_NAME}.service"
if [ ! -f "$SERVICE_DEST" ]; then
  echo "→ 首次安装：复制 systemd service 配置"
  sudo cp deploy/ubuntu/ark-backend.service.example "$SERVICE_DEST"
else
  echo "→ systemd service 已存在，跳过覆盖（如需更新请手动执行）"
fi

# 复制 nginx 配置（已存在则跳过，避免覆盖 SSL 等自定义配置）
NGINX_CONF="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
if [ ! -f "$NGINX_CONF" ]; then
  echo "→ 首次安装：复制 nginx 配置"
  sudo cp deploy/ubuntu/nginx-public.conf.example "$NGINX_CONF"
  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
  sudo rm -f /etc/nginx/sites-enabled/default
else
  echo "→ nginx 配置已存在，跳过覆盖（如需更新请手动执行）"
fi

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}"
sudo nginx -t
sudo systemctl reload nginx

echo "✅ 部署完成"
