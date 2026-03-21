# Automatic Deploy

This repository can auto-deploy on every push to `main` with GitHub Actions.

The deploy flow is:

1. GitHub Actions checks out the repo.
2. The runner syncs repository files to your server over SSH.
3. The server runs `deploy/ubuntu/redeploy.sh`.
4. The script installs dependencies, builds the app, restarts `ark-backend`, and checks `/api/health`.

## Why This Setup

This project writes live state into JSON files. Those runtime files must not live inside the mutable git checkout if you want reliable automated deploys.

Use `ARK_DATA_DIR` to move runtime data outside the repository directory before enabling auto-deploy.

## 1. Move Runtime Data Out Of The Repo

On the server:

```bash
sudo apt install -y rsync
mkdir -p /home/admin/ark-data
cp -n /home/admin/arkpj1/server/data/*.json /home/admin/ark-data/
```

Find the environment file used by the service:

```bash
sudo systemctl cat ark-backend
```

Add this line to that env file:

```env
ARK_DATA_DIR=/home/admin/ark-data
```

Then restart once manually:

```bash
sudo systemctl restart ark-backend
curl http://127.0.0.1:8787/api/health
```

## 2. Allow Non-Interactive Service Restart

The deploy user must be able to restart the service without a password prompt.

Create a sudoers file:

```bash
sudo visudo -f /etc/sudoers.d/ark-backend-deploy
```

Add:

```sudoers
admin ALL=NOPASSWD: /usr/bin/systemctl restart ark-backend, /usr/bin/systemctl status ark-backend
```

If you also want nginx reloads in the future, add `/usr/bin/systemctl reload nginx`.

## 3. Add A Dedicated Deploy SSH Key

Generate a deploy key pair on a trusted machine:

```bash
ssh-keygen -t ed25519 -C github-actions-deploy -f ~/.ssh/arkproject_actions
```

Append the public key to the deploy user's `authorized_keys` on the server:

```bash
cat ~/.ssh/arkproject_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Store the private key in the GitHub repository secret `DEPLOY_SSH_KEY`.

## 4. Configure GitHub Repository Secrets

Required secrets:

- `DEPLOY_HOST`: server IP or hostname
- `DEPLOY_USER`: SSH user, for example `admin`
- `DEPLOY_SSH_KEY`: private key for that user

Optional secrets:

- `DEPLOY_PORT`: SSH port, defaults to `22`
- `DEPLOY_APP_DIR`: deploy target directory, defaults to `/home/admin/arkpj1`
- `DEPLOY_SERVICE_NAME`: defaults to `ark-backend`
- `DEPLOY_HEALTHCHECK_URL`: defaults to `http://127.0.0.1:8787/api/health`
- `DEPLOY_RUN_CONTENT_SYNC`: defaults to `0`; set to `1` only if repo content should overwrite runtime `public-content.json`
- `DEPLOY_RUN_NGINX_RELOAD`: defaults to `0`
- `DEPLOY_STARTUP_WAIT_SECONDS`: defaults to `3`

## 5. First Validation

Push a small commit to `main`, then confirm:

```bash
sudo journalctl -u ark-backend -n 30 --no-pager
curl http://127.0.0.1:8787/api/health
```

Expected log lines include:

- `WebSocket server attached on /ws`
- `Ark backend listening on http://127.0.0.1:8787`

## Notes

- The workflow syncs files with `rsync`; it does not require the server to `git pull`.
- `server/data/` is excluded from sync on purpose. Live data should live under `ARK_DATA_DIR`.
- If the repository is private, this approach still works because GitHub Actions already has the checked-out code.
- Leave `DEPLOY_RUN_CONTENT_SYNC=0` if the admin backend is already editing live public content on the server.
