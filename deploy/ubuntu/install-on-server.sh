#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/arkproject/current}"
ENV_FILE="${ENV_FILE:-/var/www/arkproject/shared/ark-backend.env}"
SERVICE_NAME="${SERVICE_NAME:-ark-backend}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-arkproject}"
SERVICE_TEMPLATE="deploy/ubuntu/ark-backend.service.example"
NGINX_TEMPLATE="deploy/ubuntu/nginx-public.conf.example"

cd "$APP_DIR"

template_hash() {
  sha256sum "$1" | awk '{print $1}'
}

write_with_optional_sudo() {
  local destination="$1"
  local value="$2"

  if command -v sudo >/dev/null 2>&1; then
    printf '%s\n' "$value" | sudo tee "$destination" >/dev/null
    return
  fi

  printf '%s\n' "$value" > "$destination"
}

npm ci
npm run build

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 缺少环境变量文件: $ENV_FILE"
  echo "   请参考 deploy/ubuntu/ark-backend.env.example 创建该文件并填写 ADMIN_TOKEN 等必填项"
  exit 1
fi

# 复制 systemd service 文件（已存在则跳过，避免覆盖生产环境自定义配置）
SERVICE_DEST="/etc/systemd/system/${SERVICE_NAME}.service"
SERVICE_HASH_DEST="${SERVICE_DEST}.template-sha256"
CURRENT_SERVICE_HASH="$(template_hash "$SERVICE_TEMPLATE")"
if [ ! -f "$SERVICE_DEST" ]; then
  echo "→ 首次安装：复制 systemd service 配置"
  sudo cp "$SERVICE_TEMPLATE" "$SERVICE_DEST"
  write_with_optional_sudo "$SERVICE_HASH_DEST" "$CURRENT_SERVICE_HASH"
else
  echo "→ systemd service 已存在，跳过覆盖（如需更新请手动执行）"
  if [ -f "$SERVICE_HASH_DEST" ]; then
    PREVIOUS_SERVICE_HASH="$(cat "$SERVICE_HASH_DEST")"
    if [ "$PREVIOUS_SERVICE_HASH" != "$CURRENT_SERVICE_HASH" ]; then
      echo "⚠ systemd 模板已变化，请人工比对 $SERVICE_TEMPLATE 与 $SERVICE_DEST"
      echo "  人工确认后，本次脚本会把当前模板哈希更新为新的已审阅基线。"
    fi
  else
    echo "⚠ 未找到 systemd 模板基线文件，正在为当前模板建立基线。"
  fi
  write_with_optional_sudo "$SERVICE_HASH_DEST" "$CURRENT_SERVICE_HASH"
fi

# 复制 nginx 配置（已存在则跳过，避免覆盖 SSL 等自定义配置）
NGINX_CONF="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
NGINX_HASH_DEST="${NGINX_CONF}.template-sha256"
CURRENT_NGINX_HASH="$(template_hash "$NGINX_TEMPLATE")"
if [ ! -f "$NGINX_CONF" ]; then
  echo "→ 首次安装：复制 nginx 配置"
  sudo cp "$NGINX_TEMPLATE" "$NGINX_CONF"
  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
  sudo rm -f /etc/nginx/sites-enabled/default
  write_with_optional_sudo "$NGINX_HASH_DEST" "$CURRENT_NGINX_HASH"
else
  echo "→ nginx 配置已存在，跳过覆盖（如需更新请手动执行）"
  if [ -f "$NGINX_HASH_DEST" ]; then
    PREVIOUS_NGINX_HASH="$(cat "$NGINX_HASH_DEST")"
    if [ "$PREVIOUS_NGINX_HASH" != "$CURRENT_NGINX_HASH" ]; then
      echo "⚠ nginx 模板已变化，请人工比对 $NGINX_TEMPLATE 与 $NGINX_CONF"
      echo "  人工确认后，本次脚本会把当前模板哈希更新为新的已审阅基线。"
    fi
  else
    echo "⚠ 未找到 nginx 模板基线文件，正在为当前模板建立基线。"
  fi
  write_with_optional_sudo "$NGINX_HASH_DEST" "$CURRENT_NGINX_HASH"
fi

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}"
sudo nginx -t
sudo systemctl reload nginx

echo "✅ 部署完成"
