#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-astute-veld-370221}"
ZONE="${ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-michael-news-worker-test}"
LOCAL_REPO_DIR="${LOCAL_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
REMOTE_APP_ROOT="${REMOTE_APP_ROOT:-/opt/michael-business}"
REMOTE_REPO_DIR="${REMOTE_REPO_DIR:-${REMOTE_APP_ROOT}/portfolio-michael-santos}"
REMOTE_ENV_DIR="${REMOTE_ENV_DIR:-/etc/michael-business}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-${REMOTE_ENV_DIR}/worker.env}"
ENABLE_TIMERS="${ENABLE_TIMERS:-0}"
ENABLE_POSTGRES="${ENABLE_POSTGRES:-0}"
PULL_VERCEL_ENV="${PULL_VERCEL_ENV:-1}"
VERCEL_ENVIRONMENT="${VERCEL_ENVIRONMENT:-production}"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-${LOCAL_REPO_DIR}/.env.local}"
EXTRA_ENV_FILE="${EXTRA_ENV_FILE:-${LOCAL_REPO_DIR}/.env.worker.local}"

TMP_ARCHIVE="$(mktemp /tmp/portfolio-michael-santos.XXXXXX.tar.gz)"
TMP_ENV_FILE="$(mktemp /tmp/michael-worker-env.XXXXXX)"
TMP_VERCEL_ENV_FILE="$(mktemp /tmp/vercel-worker-env.XXXXXX)"

cleanup() {
  rm -f "$TMP_ARCHIVE" "$TMP_ENV_FILE" "$TMP_VERCEL_ENV_FILE"
}

trap cleanup EXIT

echo "Packing repository snapshot from ${LOCAL_REPO_DIR}"
export COPYFILE_DISABLE=1
git -C "$LOCAL_REPO_DIR" ls-files -z --cached --others --exclude-standard \
  | tar --null -czf "$TMP_ARCHIVE" -C "$LOCAL_REPO_DIR" --files-from -

if [[ "$PULL_VERCEL_ENV" == "1" ]]; then
  echo "Pulling Vercel env (${VERCEL_ENVIRONMENT})"
  (
    cd "$LOCAL_REPO_DIR"
    pnpm exec vercel env pull "$TMP_VERCEL_ENV_FILE" --environment "$VERCEL_ENVIRONMENT" --yes >/dev/null
  )
else
  : >"$TMP_VERCEL_ENV_FILE"
fi

python3 - "$TMP_ENV_FILE" "$TMP_VERCEL_ENV_FILE" "$LOCAL_ENV_FILE" "$EXTRA_ENV_FILE" <<'PY'
from pathlib import Path
import sys

output = Path(sys.argv[1])
inputs = [Path(arg) for arg in sys.argv[2:] if arg]
merged = {}
allowed_keys = {
    "NEXT_PUBLIC_SITE_URL",
    "DATABASE_PROVIDER",
    "SECONDARY_DATABASE_PROVIDER",
    "DATABASE_URL",
    "DATABASE_SSL",
    "POSTGRES_IMAGE",
    "POSTGRES_CONTAINER_NAME",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_PORT",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INDEXNOW_KEY",
    "LLM_PROVIDER",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "GROQ_BASE_URL",
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_PERSON_URN",
    "LINKEDIN_ORGANIZATION_URN",
}

for path in inputs:
    if not path.exists():
        continue
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key not in allowed_keys:
            continue
        value = value.strip()
        if value:
            merged[key] = value
        elif key not in merged:
            merged[key] = value

if not merged.get("LLM_PROVIDER"):
    if merged.get("GROQ_API_KEY"):
        merged["LLM_PROVIDER"] = "groq"
    elif merged.get("GEMINI_API_KEY"):
        merged["LLM_PROVIDER"] = "gemini"

output.write_text("\n".join(f"{key}={value}" for key, value in merged.items()) + "\n")
non_empty = sorted(key for key, value in merged.items() if value)
print("Merged non-empty env vars:", ", ".join(non_empty) if non_empty else "none", file=sys.stderr)
PY

echo "Uploading application bundle and environment file"
gcloud compute scp "$TMP_ARCHIVE" "${INSTANCE_NAME}:/tmp/portfolio-michael-santos.tar.gz" \
  --project "$PROJECT_ID" \
  --zone "$ZONE"

gcloud compute scp "$TMP_ENV_FILE" "${INSTANCE_NAME}:/tmp/worker.env" \
  --project "$PROJECT_ID" \
  --zone "$ZONE"

echo "Configuring runtime on VM"
gcloud compute ssh "$INSTANCE_NAME" \
  --project "$PROJECT_ID" \
  --zone "$ZONE" \
  --command "bash -s" <<EOF
set -euo pipefail

if ! id -u michaelworker >/dev/null 2>&1; then
  sudo useradd --system --create-home --shell /bin/bash michaelworker
fi

sudo mkdir -p "$REMOTE_APP_ROOT" "$REMOTE_APP_ROOT/run" "$REMOTE_ENV_DIR"
sudo chown -R michaelworker:michaelworker "$REMOTE_APP_ROOT"
sudo chgrp michaelworker "$REMOTE_ENV_DIR"
sudo chmod 750 "$REMOTE_ENV_DIR"

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo corepack enable
sudo corepack prepare pnpm@10.4.1 --activate

sudo rm -rf "$REMOTE_REPO_DIR"
sudo mkdir -p "$REMOTE_REPO_DIR"
sudo tar -xzf /tmp/portfolio-michael-santos.tar.gz -C "$REMOTE_REPO_DIR"
sudo chown -R michaelworker:michaelworker "$REMOTE_REPO_DIR"

sudo install -o root -g michaelworker -m 640 /tmp/worker.env "$REMOTE_ENV_FILE"
if ! sudo test -s "$REMOTE_ENV_FILE"; then
  sudo install -o root -g michaelworker -m 640 "$REMOTE_REPO_DIR/ops/gcp/worker/worker.env.example" "$REMOTE_ENV_FILE"
fi

sudo install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-news-cycle.service" /etc/systemd/system/michael-news-cycle.service
sudo install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-news-cycle.timer" /etc/systemd/system/michael-news-cycle.timer
sudo install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-daily-briefing.service" /etc/systemd/system/michael-daily-briefing.service
sudo install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-daily-briefing.timer" /etc/systemd/system/michael-daily-briefing.timer

sudo -u michaelworker bash -lc 'cd "$REMOTE_REPO_DIR" && pnpm install --frozen-lockfile'

if [[ "$ENABLE_POSTGRES" == "1" ]]; then
  sudo bash "$REMOTE_REPO_DIR/ops/gcp/worker/postgres/bootstrap-postgres.sh" "$REMOTE_ENV_FILE" "$REMOTE_REPO_DIR"
fi

sudo systemctl daemon-reload

if [[ "$ENABLE_TIMERS" == "1" ]]; then
  sudo systemctl enable --now michael-news-cycle.timer michael-daily-briefing.timer
else
  sudo systemctl disable --now michael-news-cycle.timer michael-daily-briefing.timer >/dev/null 2>&1 || true
fi
EOF

echo "Deploy complete"
echo "Timers enabled: $ENABLE_TIMERS"
echo "Postgres enabled: $ENABLE_POSTGRES"
echo "Manual test:"
echo "  gcloud compute ssh $INSTANCE_NAME --zone $ZONE --project $PROJECT_ID --command='sudo systemctl start michael-news-cycle.service'"
