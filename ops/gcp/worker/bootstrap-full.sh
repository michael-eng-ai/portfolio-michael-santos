#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TERRAFORM_DIR="${REPO_ROOT}/ops/terraform/gcp/environments/test-vm"
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy-to-vm.sh"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
  esac
done

log() { echo "[bootstrap] $*"; }
fail() { echo "[bootstrap] ERROR: $*" >&2; exit 1; }

# ---------- pre-checks ----------
log "Running pre-checks"

if ! command -v gcloud >/dev/null 2>&1; then
  fail "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
fi

if ! command -v terraform >/dev/null 2>&1; then
  fail "terraform not found. Install: https://developer.hashicorp.com/terraform/install"
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  fail "No active gcloud account. Run: gcloud auth login"
fi
log "gcloud account: ${ACTIVE_ACCOUNT}"
log "terraform version: $(terraform --version -json | head -1)"

if [[ ! -f "${REPO_ROOT}/.env.worker.local" ]]; then
  fail "Missing ${REPO_ROOT}/.env.worker.local -- copy from .env.worker.local.example and fill in secrets"
fi
log "Found .env.worker.local"

# extract tfvars
PROJECT_ID=$(grep 'project_id' "${TERRAFORM_DIR}/terraform.tfvars" | cut -d'"' -f2)
ZONE=$(grep 'zone' "${TERRAFORM_DIR}/terraform.tfvars" | cut -d'"' -f2)
INSTANCE_NAME=$(grep 'instance_name' "${TERRAFORM_DIR}/terraform.tfvars" | cut -d'"' -f2)

log "Project:  ${PROJECT_ID}"
log "Zone:     ${ZONE}"
log "Instance: ${INSTANCE_NAME}"

if [[ "$DRY_RUN" == "1" ]]; then
  log "--- DRY RUN: validation passed, skipping provisioning and deploy ---"
  log "Would run: terraform init + apply in ${TERRAFORM_DIR}"
  log "Would run: ENABLE_TIMERS=1 bash ${DEPLOY_SCRIPT}"
  exit 0
fi

# ---------- terraform ----------
log "Provisioning infrastructure"
cd "$TERRAFORM_DIR"
terraform init -backend-config=backend.hcl -input=false
terraform apply -auto-approve

# ---------- deploy ----------
log "Deploying worker"
cd "$REPO_ROOT"
ENABLE_TIMERS=1 \
PROJECT_ID="$PROJECT_ID" \
ZONE="$ZONE" \
INSTANCE_NAME="$INSTANCE_NAME" \
bash "$DEPLOY_SCRIPT"

# ---------- summary ----------
VM_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
  --project "$PROJECT_ID" \
  --zone "$ZONE" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null || echo "unknown")

echo ""
log "========== BOOTSTRAP COMPLETE =========="
log "VM IP:       ${VM_IP}"
log "SSH:         gcloud compute ssh ${INSTANCE_NAME} --project ${PROJECT_ID} --zone ${ZONE}"
echo ""
log "Timer status:"
gcloud compute ssh "$INSTANCE_NAME" \
  --project "$PROJECT_ID" \
  --zone "$ZONE" \
  --command 'sudo systemctl list-timers michael-* --no-pager' 2>/dev/null || log "Could not fetch timer status"
