#!/usr/bin/env bash
set -euo pipefail

# OCI Worker Deploy Script
# Usage: ENABLE_TIMERS=1 ./ops/oci/deploy-to-vm.sh

OCI_HOST="${OCI_HOST:-137.131.210.212}"
OCI_USER="${OCI_USER:-opc}"
OCI_SSH_KEY="${OCI_SSH_KEY:-$HOME/.ssh/oci_michael_worker}"
SSH_OPTS="-i $OCI_SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

LOCAL_REPO_DIR="${LOCAL_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
REMOTE_APP_ROOT="/opt/michael-business"
REMOTE_REPO_DIR="${REMOTE_APP_ROOT}/portfolio-michael-santos"
REMOTE_ENV_DIR="/etc/michael-business"
REMOTE_ENV_FILE="${REMOTE_ENV_DIR}/worker.env"
ENABLE_TIMERS="${ENABLE_TIMERS:-0}"
ENABLE_POSTGRES="${ENABLE_POSTGRES:-0}"
PULL_VERCEL_ENV="${PULL_VERCEL_ENV:-0}"
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

echo "=== OCI Worker Deploy ==="
echo "Host: ${OCI_USER}@${OCI_HOST}"
echo "Timers: ${ENABLE_TIMERS}"
echo ""

echo "[1/5] Packing repository snapshot"
export COPYFILE_DISABLE=1
git -C "$LOCAL_REPO_DIR" ls-files -z --cached --others --exclude-standard \
  | tar --null -czf "$TMP_ARCHIVE" -C "$LOCAL_REPO_DIR" --files-from -
echo "  Archive: $(du -h "$TMP_ARCHIVE" | cut -f1)"

if [[ "$PULL_VERCEL_ENV" == "1" ]]; then
  echo "[2/5] Pulling Vercel env (${VERCEL_ENVIRONMENT})"
  (cd "$LOCAL_REPO_DIR" && pnpm exec vercel env pull "$TMP_VERCEL_ENV_FILE" --environment "$VERCEL_ENVIRONMENT" --yes >/dev/null)
else
  : >"$TMP_VERCEL_ENV_FILE"
fi

echo "[2/5] Merging environment variables"
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
    "ANTHROPIC_API_KEY",
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_PERSON_URN",
    "LINKEDIN_ORGANIZATION_URN",
    "DASHBOARD_PASSWORD_HASH",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GSC_SITE_URL",
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

output.write_text("\n".join(f"{key}={value}" for key, value in merged.items()) + "\n")
non_empty = sorted(key for key, value in merged.items() if value)
print("  Merged:", ", ".join(non_empty) if non_empty else "none", file=sys.stderr)
PY

echo "[3/5] Uploading to VM"
scp $SSH_OPTS "$TMP_ARCHIVE" "${OCI_USER}@${OCI_HOST}:/tmp/portfolio-michael-santos.tar.gz"
scp $SSH_OPTS "$TMP_ENV_FILE" "${OCI_USER}@${OCI_HOST}:/tmp/worker.env"

echo "[4/5] Installing on VM"
ssh $SSH_OPTS "${OCI_USER}@${OCI_HOST}" "sudo bash -s" <<REMOTE
set -euo pipefail

# Directories
mkdir -p "$REMOTE_APP_ROOT" "$REMOTE_APP_ROOT/run" "$REMOTE_ENV_DIR"
chown -R michaelworker:michaelworker "$REMOTE_APP_ROOT"
chgrp michaelworker "$REMOTE_ENV_DIR"
chmod 750 "$REMOTE_ENV_DIR"

# Extract repo
rm -rf "$REMOTE_REPO_DIR"
mkdir -p "$REMOTE_REPO_DIR"
tar -xzf /tmp/portfolio-michael-santos.tar.gz -C "$REMOTE_REPO_DIR"
chown -R michaelworker:michaelworker "$REMOTE_REPO_DIR"

# Install env file
install -o root -g michaelworker -m 640 /tmp/worker.env "$REMOTE_ENV_FILE"

# Install systemd units
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-news-cycle.service" /etc/systemd/system/
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-news-cycle.timer" /etc/systemd/system/
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-daily-briefing.service" /etc/systemd/system/
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/gcp/worker/systemd/michael-daily-briefing.timer" /etc/systemd/system/
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/oci/systemd/michael-health-check.service" /etc/systemd/system/
install -o root -g root -m 644 "$REMOTE_REPO_DIR/ops/oci/systemd/michael-health-check.timer" /etc/systemd/system/

# Install dependencies
sudo -u michaelworker bash -lc 'cd $REMOTE_REPO_DIR && pnpm install --frozen-lockfile 2>&1 | tail -5'

# Postgres (optional)
if [[ "$ENABLE_POSTGRES" == "1" ]]; then
  bash "$REMOTE_REPO_DIR/ops/gcp/worker/postgres/bootstrap-postgres.sh" "$REMOTE_ENV_FILE" "$REMOTE_REPO_DIR"
fi

# Systemd
systemctl daemon-reload

if [[ "$ENABLE_TIMERS" == "1" ]]; then
  systemctl enable --now michael-news-cycle.timer michael-daily-briefing.timer michael-health-check.timer
  echo "Timers ENABLED"
else
  systemctl disable --now michael-news-cycle.timer michael-daily-briefing.timer michael-health-check.timer >/dev/null 2>&1 || true
  echo "Timers DISABLED"
fi

# Cleanup
rm -f /tmp/portfolio-michael-santos.tar.gz /tmp/worker.env
REMOTE

echo "[5/5] Verifying"
ssh $SSH_OPTS "${OCI_USER}@${OCI_HOST}" "
  echo 'Node:' \$(node --version)
  echo 'pnpm:' \$(pnpm --version)
  echo 'Docker:' \$(docker --version 2>/dev/null | cut -d' ' -f3 || echo 'not running')
  echo 'Timers:'
  systemctl list-timers michael-* 2>/dev/null | head -5 || echo '  (none active)'
  echo 'Repo:'
  ls -la $REMOTE_REPO_DIR/package.json 2>/dev/null | awk '{print \"  \"\$NF\" (\"\$5\" bytes)\"}'
"

echo ""
echo "=== Deploy complete ==="
echo "SSH: ssh -i $OCI_SSH_KEY ${OCI_USER}@${OCI_HOST}"
echo "Test: ssh -i $OCI_SSH_KEY ${OCI_USER}@${OCI_HOST} 'sudo systemctl start michael-news-cycle.service'"
echo "Logs: ssh -i $OCI_SSH_KEY ${OCI_USER}@${OCI_HOST} 'sudo journalctl -u michael-news-cycle -n 50 --no-pager'"
