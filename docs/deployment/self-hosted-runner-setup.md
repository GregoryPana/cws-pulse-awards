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

# Ports Pulse Awards needs (backend, Postgres, PDF sidecar)
ss -tlnp | grep -E ':(8020|5434|8001)\b' || echo "8020, 5434, 8001 are all free"
```

**Confirmed reserved on this VM (`cwscx-tst01`)** — this list comes from the VM register, shared
across every app on the box (Pulse Awards, `b2b-cx-platform`/`vas-system-check`, and the Health
Fair testing app), so none of these numbers are available to any new app regardless of what a
live `ss` check shows at any given moment:

```
80, 443, 8000, 8010, 5432, 5433, 5051, 7000, 22, 53
```

Both `8000` and `8010` are taken — the original plan to move Pulse Awards' backend to `8010`
after the first conflict is itself now blocked, so Pulse Awards uses **`8020`** (backend) and
**`5434`** (Postgres) instead. Neither appears in the reserved list above. Port `8001` (PDF
sidecar) remains free. Double-check all three are actually free right now before proceeding:

```bash
ss -tlnp | grep -E ':(8020|5434|8001)\b' || echo "8020, 5434, 8001 are all free"
```

If those are also free, the `BACKEND_PORT=8020` / `DB_PORT=5434` GitHub Environment variables
(§7) are already set to match — no repo file changes are needed, since every script and the
systemd unit read these ports from `.env`/environment rather than a hardcoded value.
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

## 6. Create the app root — no manual `.env` needed

```bash
sudo mkdir -p /opt/pulse-awards/releases
sudo chown -R gha-pulse-awards:gha-pulse-awards /opt/pulse-awards
```

That's it. Unlike a typical first-time setup, you do **not** need to hand-create or edit
`/opt/pulse-awards/.env` — `scripts/linux/deploy_backend.sh` bootstraps it automatically the
first time it runs, populating it from the GitHub Environment variables/secrets in §7. As long
as those are set before the first deploy, `.env` needs zero manual editing, ever, for the
values listed there. See §7 for exactly which values sync on every deploy vs. are written once
at bootstrap and then left alone.

The self-signed TLS certificate is provisioned separately per
`docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md` — do that before the first
`deploy_nginx.sh` run, or it will fail with a clear "missing certificate" error rather than a
confusing NGINX failure.

## 7. GitHub Environment configuration

Configure both **Settings → Environments → staging** and **→ production** on the repo. Since
both currently point at this one VM (§0), staging and production need the **same** values for
everything below — they're really two workflows sharing one live app instance right now, not
two isolated environments. In particular, **`DB_PASSWORD` must be identical in both**: there is
only one Postgres container on this VM, so setting a different password in each environment
would just make one of the two deploys fail to authenticate.

### Variables (`vars` — visible in the GitHub UI, not encrypted)

| Variable | Value |
|---|---|
| `APP_ROOT` | `/opt/pulse-awards` |
| `BACKEND_PORT` | `8020` *(8000 and 8010 are both reserved/taken on this VM)* |
| `DB_PORT` | `5434` *(not 5433 — already taken by another app on this VM)* |
| `PDF_PORT` | `8001` |
| `SERVER_NAME` | `pulse.cwsey.com` |
| `EXPECTED_HOSTNAME` | `cwscx-tst01` — safety check, the deploy refuses to run if it lands on the wrong host |
| `SMTP_HOST` | `172.16.77.10` |
| `SMTP_PORT` | `587` |
| `SMTP_FROM` | `noreply@cwseychelles.com` |
| `SMTP_TIMEOUT_SECONDS` | `3` |
| `ADMIN_ROLE` | `CWS-Pulse-Admin` |

These are re-written into `/opt/pulse-awards/.env` on **every** deploy — change one here and
re-run the workflow, no VM login required.

### Secrets (`secrets` — encrypted, never shown again after creation)

| Secret | Written when | Notes |
|---|---|---|
| `APP_SECRET_KEY` | Bootstrap only | Already generated and set (a random 64-char hex value) |
| `DB_PASSWORD` | Bootstrap only | You choose this — see the main chat response for the exact `gh secret set` command |
| `ENTRA_TENANT_ID` | Bootstrap only | From the Entra app registration, once it exists (`EXIT.md` §8) |
| `ENTRA_CLIENT_ID` | Bootstrap only | From the Entra app registration, once it exists |

"Bootstrap only" means: written into `.env` the first time `deploy_backend.sh` ever runs
(because `.env` doesn't exist yet), then left completely alone on every later deploy — rotating
one of these deliberately requires either editing `.env` directly on the VM, or deleting `.env`
and letting the next deploy re-bootstrap from a fresh GitHub secret value.

On **production**, also add a **required reviewer** (Settings → Environments → production →
Protection rules) if/when a second admin exists to review deploys — right now there's only one
collaborator on the repo, so this is skipped for now.

**When a separate production VM eventually exists:** register a second runner there following
this same guide, with labels `self-hosted,linux,pulse-awards,production` (drop `staging`), and
update only the `production` environment's variables/secrets above to that VM's real values —
starting with `DB_PASSWORD`, which can finally differ once it's truly a separate database.
Neither `deploy-production.yml` nor any deploy script needs to change — GitHub Actions routes
the job to whichever runner's labels match.

## 8. First deploy

From the repo, run the workflow manually: **Actions → deploy-staging → Run workflow**. Watch the
`deploy` job's logs — `check_ports.sh` runs first and will stop immediately with a clear message
if anything unexpected already holds one of the three ports.
