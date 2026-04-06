# Ubuntu deployment (HTTP only, public site + private admin default)

This project deploys well on Ubuntu with:

- `nginx` serving `dist/`
- `node` running `server/index.mjs`
- `systemd` keeping the backend alive

The config in this folder assumes:

- app directory: `/var/www/arkproject/current`
- shared env file: `/var/www/arkproject/shared/ark-backend.env`
- backend port: `127.0.0.1:8787`
- domain served over HTTP only for now
- `/admin/` and `/api/admin/` are blocked by default until you enable HTTPS and add auth

## 1. Prepare the server

```bash
sudo apt update
sudo apt install -y nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Create directories

```bash
sudo mkdir -p /var/www/arkproject/current
sudo mkdir -p /var/www/arkproject/shared
sudo chown -R "$USER":"$USER" /var/www/arkproject
```

## 3. Upload the project

From your local machine, upload the repo contents to:

- `/var/www/arkproject/current`

Make sure you upload source files, not just `dist/`, because the backend runs from source.

## 4. Create backend env file

On the server:

```bash
cp /var/www/arkproject/current/deploy/ubuntu/ark-backend.env.example /var/www/arkproject/shared/ark-backend.env
nano /var/www/arkproject/shared/ark-backend.env
```

Recommended initial contents:

```env
API_HOST=127.0.0.1
API_PORT=8787
API_CORS_ORIGINS=
ADMIN_TOKEN=change-this-on-the-server
```

Notes:

- Leave `API_CORS_ORIGINS` empty when the site is served through the same domain via nginx.
- `ADMIN_TOKEN` is required. The backend now refuses to start if it is empty.

## 5. Install service + nginx config

Edit these placeholders before copying them into system locations:

- `deploy/ubuntu/ark-backend.service.example`
  - replace `User=ubuntu` / `Group=ubuntu` if your SSH user is different
- `deploy/ubuntu/nginx-public.conf.example`
  - replace `your-domain.com` with your actual domain

Then run:

```bash
cd /var/www/arkproject/current
chmod +x deploy/ubuntu/install-on-server.sh
./deploy/ubuntu/install-on-server.sh
```

`install-on-server.sh` writes a template hash baseline beside the live `systemd` and nginx configs. Later deploys will stop if the checked-in template changes until you review the live config and rerun this script to acknowledge the new baseline.

## 6. Verify

```bash
systemctl status ark-backend --no-pager
curl http://127.0.0.1:8787/api/health
curl -I http://your-domain.com
curl http://your-domain.com/api/public/rule-config
```

Open in browser:

- `http://your-domain.com`

## 7. Updating the site later

After uploading new code:

```bash
cd /var/www/arkproject/current
bash deploy/ubuntu/redeploy.sh
```

If `redeploy.sh` reports template drift, compare the checked-in `.example` files with the live config under `/etc`, apply any manual edits you want to keep, then rerun `deploy/ubuntu/install-on-server.sh` to record the new reviewed baseline before deploying again.

## Security note

Because HTTPS is not enabled yet, this setup intentionally denies:

- `/admin/`
- `/api/admin/`

That keeps the public site usable while avoiding exposing admin operations over plain HTTP.
