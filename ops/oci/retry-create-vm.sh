#!/usr/bin/env bash
set -euo pipefail

# OCI ARM VM retry script -- keeps trying until capacity is available
# Usage: ./ops/oci/retry-create-vm.sh [--interval 300] [--ocpus 4] [--memory 24]

TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaavdr2som3cfptia7mvzaryd4l4yto3c4yf42pxe72tqewgctztoaq"
AD_NAME="ZeAU:SA-SAOPAULO-1-AD-1"
SUBNET_ID="ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaax7e2blxka5urg2mccz5v7hhrtliln57xlunxia3e3iw7mna4rnkq"
IMAGE_ID="ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaktgc5bmkbfbkkecwllnrzlekbihf65mrm7ciwptiordmuvsjqbcq"
SSH_PUB_FILE="$HOME/.ssh/oci_michael_worker.pub"

INTERVAL="${1:-300}"
OCPUS="${2:-4}"
MEMORY="${3:-24}"
DISPLAY_NAME="michael-news-worker"
BOOT_DISK_GB=50

echo "=== OCI ARM VM Retry ==="
echo "Shape: VM.Standard.A1.Flex ($OCPUS OCPUs, ${MEMORY}GB RAM)"
echo "Region: sa-saopaulo-1"
echo "Retry interval: ${INTERVAL}s"
echo ""

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo "[$(date '+%H:%M:%S')] Attempt $attempt..."

  result=$(oci compute instance launch \
    --compartment-id "$TENANCY_OCID" \
    --availability-domain "$AD_NAME" \
    --shape "VM.Standard.A1.Flex" \
    --shape-config "{\"ocpus\": $OCPUS, \"memoryInGBs\": $MEMORY}" \
    --display-name "$DISPLAY_NAME" \
    --image-id "$IMAGE_ID" \
    --subnet-id "$SUBNET_ID" \
    --assign-public-ip true \
    --metadata "{\"ssh_authorized_keys\": \"$(cat "$SSH_PUB_FILE")\"}" \
    --boot-volume-size-in-gbs "$BOOT_DISK_GB" \
    2>&1) || true

  if echo "$result" | grep -q '"lifecycle-state"'; then
    echo ""
    echo "SUCCESS! VM created."
    echo "$result" | python3 -m json.tool 2>/dev/null || echo "$result"

    instance_id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "unknown")
    echo ""
    echo "Instance ID: $instance_id"
    echo "Waiting for public IP..."

    sleep 30
    oci compute instance list-vnics \
      --instance-id "$instance_id" \
      --query 'data[0]."public-ip"' --raw-output 2>/dev/null && echo ""

    echo "SSH: ssh -i ~/.ssh/oci_michael_worker opc@<PUBLIC_IP>"
    exit 0
  fi

  if echo "$result" | grep -q "Out of host capacity"; then
    echo "  No capacity. Retrying in ${INTERVAL}s..."
  else
    echo "  Unexpected error:"
    echo "$result" | head -5
    echo "  Retrying in ${INTERVAL}s..."
  fi

  sleep "$INTERVAL"
done
