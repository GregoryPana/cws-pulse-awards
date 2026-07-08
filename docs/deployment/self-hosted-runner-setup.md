# Self-Hosted GitHub Actions Runner — Setup on `cwscx-tst01`

This VM is internal-network-only and already hosts other applications. Everything below is
scoped and named specifically for **CWS Pulse Awards** so it cannot collide with another app's
runner, systemd services, or ports on the same box.

There is currently only one VM (`cwscx-tst01.cwsey.com`). Both the `staging` and `production`
GitHub Actions environments target it for now — see [§7](#7-one-vm-today-two-environments-in-github)
for how this stays safe and how to split them onto separate VMs later with zero workflow changes.

## 0. What you're building

One dedicated runner process, registered only to this repository, with labels that make sure
only Pulse Awards' own `deploy-staging.yml` / `deploy-production.yml` workflows ever land on it:

```
self-hosted, linux, pulse-awards, staging, production
```

Another app's deploy workflow (e.g. `runs-on: [self-hosted, linux, other-app, staging]`) will
never be scheduled onto this runner, because the `other-app` label won't match. Give every other
app on this VM its own runner the same way — one runner process per app, never shared.

## 1. Pre-flight — check what's already on this VM

```bash
# Any existing GitHub Actions runners already installed?
systemctl list-units --all | grep -i actions.runner
ls -la /opt/actions-runners/ 2>/dev/null

# Ports Pulse Awards needs (backend 8000, Postgres 5433, PDF sidecar 8001)
ss -tlnp | grep -E ':(8000|5433|8001)\b' || echo "all three ports are free"
```

If any of those three ports are already taken by a *different* app, stop here and pick new
ports for Pulse Awards — you'll need to set `BACKEND_PORT` / `DB_PORT` / `PDF_PORT` as GitHub
Environment variables (§6) to match, and update `backend/pulse-awards.service` and
`docker-compose.yml` in the repo to the new values before your first deploy.
`scripts/linux/check_ports.sh` re-runs this same check automatically on every deploy, so a
future collision fails the deploy loudly instead of silently breaking another app.

## 2. Create a dedicated, unprivileged runner user

Running the runner itself as root is unnecessary risk — a workflow run executes arbitrary
repo-defined shell commands. Give it its own low-privilege system user, and grant that user
passwordless `sudo` for only the specific commands the deploy scripts need (§4).

```bash
sudo useradd --system --create-home --shell /bin/bash gha-pulse-awards
sudo usermod -aG docker gha-pulse-awards   # so it can run `docker compose` without sudo
```

## 3. Download and configure the runner

Get a fresh registration token (expires ~1 hour after creation) from
**Settings → Actions → Runners → New self-hosted runner** on the repo, or via `gh`:

```bash
gh api -X POST repos/GregoryPana/cws-pulse-awards/actions/runners/registration-token --jq .token
```

A token was generated while writing this guide — it will already have expired by the time you
read this, so generate your own with the command above.

```bash
sudo mkdir -p /opt/actions-runners/pulse-awards
sudo chown gha-pulse-awards:gha-pulse-awards /opt/actions-runners/pulse-awards
sudo -iu gha-pulse-awards
cd /opt/actions-runners/pulse-awards

# Check https://github.com/actions/runner/releases/latest for the current version if this one is stale.
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.325.0/actions-runner-linux-x64-2.325.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz

./config.sh \
  --url https://github.com/GregoryPana/cws-pulse-awards \
  --token <PASTE_REGISTRATION_TOKEN_HERE> \
  --name pulse-awards-runner-01 \
  --labels self-hosted,linux,pulse-awards,staging,production \
  --work _work \
  --unattended

exit   # back to your sudo-capable user
```

The `--name pulse-awards-runner-01` matters: the systemd service the next step installs is
named after it (`actions.runner.GregoryPana-cws-pulse-awards.pulse-awards-runner-01.service`),
so it can never collide with another app's runner service name even if that app also uses
GitHub Actions self-hosted runners on this same VM.

## 4. Install as a systemd service

```bash
cd /opt/actions-runners/pulse-awards
sudo ./svc.sh install gha-pulse-awards
sudo ./svc.sh start
sudo ./svc.sh status
```

Confirm the unique unit name:

```bash
systemctl list-units | grep pulse-awards-runner-01
```

## 5. Grant the runner user exactly the sudo it needs

The deploy scripts run `systemctl restart pulse-awards`, `systemctl reload nginx`, write to
`/etc/nginx/sites-available/`, `/etc/systemd/system/`, `/opt/pulse-awards/`, and `/data/pulse/`.
Scope `sudo` to only that — not a blanket `NOPASSWD: ALL`:

```bash
sudo visudo -f /etc/sudoers.d/gha-pulse-awards
```

```
gha-pulse-awards ALL=(root) NOPASSWD: \
  /usr/bin/systemctl restart pulse-awards, \
  /usr/bin/systemctl reload nginx, \
  /usr/bin/systemctl daemon-reload, \
  /usr/bin/systemctl enable pulse-awards, \
  /usr/bin/systemctl is-active *, \
  /usr/sbin/nginx -t, \
  /usr/bin/cp * /etc/nginx/sites-available/*, \
  /usr/bin/cp * /etc/systemd/system/*, \
  /usr/sbin/useradd *, \
  /usr/bin/chown * /opt/pulse-awards*, \
  /usr/bin/chown * /data/pulse*, \
  /usr/bin/mkdir -p /opt/pulse-awards*, \
  /usr/bin/mkdir -p /data/pulse*
```

Adjust exact paths/binaries to match your distro (`which systemctl`, `which nginx`) before saving.

## 6. Create the app root and shared secrets

```bash
sudo mkdir -p /opt/pulse-awards/releases
sudo chown -R gha-pulse-awards:gha-pulse-awards /opt/pulse-awards

# .env is never committed — create it directly on the VM from .env.example
sudo -u gha-pulse-awards cp /opt/actions-runners/pulse-awards/_work/cws-pulse-awards/cws-pulse-awards/.env.example \
  /opt/pulse-awards/.env
sudo -u gha-pulse-awards nano /opt/pulse-awards/.env   # fill in real secrets — see .env.example comments
```

The self-signed TLS certificate is provisioned separately per
`docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md` — do that before the first
`deploy_nginx.sh` run, or it will fail with a clear "missing certificate" error rather than a
confusing NGINX failure.

## 7. One VM today, two environments in GitHub

Configure both **Settings → Environments → staging** and **→ production** on the repo. For now,
give both environments the *same* variable values, since both point at this one VM:

| Variable | Value (today) |
|---|---|
| `APP_ROOT` | `/opt/pulse-awards` |
| `BACKEND_PORT` | `8000` |
| `DB_PORT` | `5433` |
| `PDF_PORT` | `8001` |
| `SERVER_NAME` | `pulse.cwsey.com` |

On **production**, also add a **required reviewer** (Settings → Environments → production →
Protection rules) — this is the actual approval gate; `workflow_dispatch` alone does not stop
anyone with repo write access from triggering a production deploy immediately.

**When a separate production VM eventually exists:** register a second runner there following
this same guide, with labels `self-hosted,linux,pulse-awards,production` (drop `staging`), and
update only the `production` environment's variables above to that VM's real values. Neither
`deploy-production.yml` nor any deploy script needs to change — GitHub Actions routes the job to
whichever runner's labels match.

## 8. First deploy

From the repo, run the workflow manually: **Actions → deploy-staging → Run workflow**. Watch the
`deploy` job's logs — `check_ports.sh` runs first and will stop immediately with a clear message
if anything unexpected already holds one of the three ports.
