# Deployment guide

This document explains everything the GitHub Actions workflow
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) needs in order
to deploy the full stack (db + backend + frontend) to three remote hosts.

## What the workflow does

1. **Build images** — builds Docker images from `Dockerfile.backend` and
   `Dockerfile.frontend`, tags them `:<sha7>` and `:latest`, pushes to
   **GitHub Container Registry** (`ghcr.io/<owner>/<repo>/{backend,frontend}`).
2. **Deploy db** — SSH (via the bastion) into the **private DB host**, copy
   `docker-compose.db.yml`, write `.env` from secrets, run Postgres.
3. **Deploy backend** — SSH (via the bastion) into the **private backend
   host**, pull the backend image, write `.env`, start the container, and
   run `npm run db:migrate`.
4. **Deploy frontend** — SSH directly to the **public bastion (= frontend
   host)**, pull the frontend image, write `.env`, start the container.

## Network assumption

```
GitHub runner ──SSH──► SSH_HOST  (public bastion = frontend host)
                          │
                          ├── private network ──► DB_PRIVATE_HOST  (postgres)
                          └── private network ──► BACKEND_PRIVATE_HOST (express)
```

Only the bastion is reachable from the public internet on port 22. The
db and backend hosts are reachable only from inside the private
network. The workflow uses **SSH ProxyJump** (the `proxy_*` fields in
`appleboy/{ssh,scp}-action`) to "hop" through the bastion when it needs
to talk to db / backend.

---

## One-time setup

### 1. Provision three hosts

| Host | Role | Public ports | Private ports |
|---|---|---|---|
| Bastion (= frontend) | Runs Next.js | `22`, `3000` (or `443` behind a reverse proxy) | — |
| Backend | Runs Express | — | `5000` open to the bastion |
| DB | Runs Postgres | — | `5432` open to the backend |

Each host needs:

- **Docker** and **Docker Compose v2** (`docker compose ...`, not the legacy `docker-compose`)
- The same SSH user (e.g. `ubuntu` or `ec2-user`) with `sudo` rights to run docker (or in the `docker` group)
- The deploy public key in `~/<user>/.ssh/authorized_keys`

### 2. Generate an SSH keypair for CI

On your laptop:

```bash
ssh-keygen -t ed25519 -f ./deploy_key -N ""
```

- `deploy_key.pub` → put on **all three** hosts in `~/<user>/.ssh/authorized_keys`
- `deploy_key`     → goes into the `SSH_PRIVATE_KEY` GitHub secret (next step)

### 3. Create a GHCR Personal Access Token

The remote hosts need to pull images from `ghcr.io`. The workflow's
built-in `GITHUB_TOKEN` is short-lived and not usable on the host after
the workflow ends, so create a **classic PAT** with `read:packages`
scope:

GitHub → Settings → Developer settings → Personal access tokens →
Tokens (classic) → Generate new token → scope `read:packages`.

Save it as the `GHCR_TOKEN` secret.

### 4. Make the package public OR grant the PAT access

After the first successful image push, go to the package page on
GitHub (`https://github.com/users/<owner>/packages/container/<repo>%2Fbackend`)
and either set it **Public** or grant your hosts/PAT read access.

---

## GitHub Secrets — required

Settings → Secrets and variables → **Actions** → New repository secret.

### SSH

| Secret | Example | Purpose |
|---|---|---|
| `SSH_HOST` | `1.2.3.4` or `bastion.example.com` | Public address of the bastion (= frontend host) |
| `SSH_USER` | `ubuntu` | SSH user on every host |
| `SSH_PRIVATE_KEY` | contents of `deploy_key` (full PEM) | Private key authorised on all three hosts |

### Private hosts

| Secret | Example | Purpose |
|---|---|---|
| `DB_PRIVATE_HOST` | `10.0.0.10` | Address of the db host reachable from bastion + backend |
| `BACKEND_PRIVATE_HOST` | `10.0.0.20` | Address of the backend host reachable from bastion + frontend |

### Database

| Secret | Example |
|---|---|
| `DB_NAME` | `blogApp` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | (long random) |

### Backend

| Secret | Example |
|---|---|
| `TOKEN_SECRET` | (long random — JWT signer) |
| `COOKIE_SECRET` | (long random — cookie signer) |

### Frontend

| Secret | Example |
|---|---|
| `NEXTAUTH_URL` | `https://your-domain.com` (public URL of the bastion) |
| `NEXTAUTH_SECRET` | (long random — NextAuth JWT signer) |

> `BLOG_API_URL` is **derived** in the workflow as
> `http://${BACKEND_PRIVATE_HOST}:5000` — no separate secret needed.

### Container registry

| Secret | Example |
|---|---|
| `GHCR_TOKEN` | classic PAT with `read:packages` |

### Generating long random secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run that for each of `TOKEN_SECRET`, `COOKIE_SECRET`, `NEXTAUTH_SECRET`,
and a strong `DB_PASSWORD`.

---

## Permissions checklist

For the workflow to work end-to-end, confirm:

- [ ] The `deploy_key.pub` is in `~/.ssh/authorized_keys` on **all three** hosts
- [ ] `SSH_USER` can run `docker` without `sudo` on all three hosts
- [ ] Bastion can SSH to db host and backend host on port 22 (security group / firewall)
- [ ] Backend host can reach DB host on `5432`
- [ ] Frontend (bastion) can reach backend host on `5000`
- [ ] Public can reach bastion on `3000` (or `80`/`443` if reverse-proxied)
- [ ] GitHub Actions has `packages: write` permission for the workflow's `GITHUB_TOKEN` (default for new repos; check Settings → Actions → General → Workflow permissions)
- [ ] The package on GHCR is public OR the `GHCR_TOKEN` PAT has read access

---

## Triggering a deploy

- Push to `main` → automatic.
- Or **Actions** tab → *Deploy* workflow → **Run workflow** (manual).

The four jobs run sequentially (`build-and-push` → `deploy-db` →
`deploy-backend` → `deploy-frontend`); a failure in any step stops the
chain.

## Verifying

After a successful run, on each host:

```bash
docker ps
docker compose -f docker-compose.<service>.yml logs -f
```

From your laptop:

```bash
curl http://<SSH_HOST>:3000               # frontend
curl http://<BASTION_PRIVATE_TUNNEL>:5000/api/user/profile   # behind the firewall
```

## Rolling back

The workflow tags each image with the commit SHA. To roll back, SSH to
the affected host and override `IMAGE_TAG`:

```bash
cd ~/blog
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<old-sha7>/" .env
docker compose -f docker-compose.backend.yml --env-file .env pull
docker compose -f docker-compose.backend.yml --env-file .env up -d
```

---

## Local development (no GitHub Actions)

Copy the example env files to real ones:

```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
```

Then either:

- `npm install && npm run dev` (runs both backend + frontend on your machine), or
- `docker compose up --build` (uses the local `docker-compose.yml` — different file from the deploy ones).

The deployment compose files (`docker-compose.{db,backend,frontend}.yml`)
reference GHCR images and **won't run locally** until those images
exist.
