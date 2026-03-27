#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-/etc/michael-business/worker.env}"
REPO_DIR="${2:-/opt/michael-business/portfolio-michael-santos}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-michael-business-postgres}"
POSTGRES_DB="${POSTGRES_DB:-michael_business}"
POSTGRES_USER="${POSTGRES_USER:-michael_business}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DATA_DIR="${POSTGRES_DATA_DIR:-/var/lib/michael-business/postgres-data}"
POSTGRES_RUNTIME_UID="${POSTGRES_RUNTIME_UID:-}"
POSTGRES_RUNTIME_GID="${POSTGRES_RUNTIME_GID:-}"
POSTGRES_INIT_DIR="${REPO_DIR}/ops/gcp/worker/postgres/init"

if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "POSTGRES_PASSWORD must be set in $ENV_FILE before bootstrapping PostgreSQL." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to bootstrap PostgreSQL on the VM." >&2
  exit 1
fi

if [[ ! -d "$POSTGRES_INIT_DIR" ]]; then
  echo "Missing PostgreSQL init directory: $POSTGRES_INIT_DIR" >&2
  exit 1
fi

mkdir -p "$POSTGRES_DATA_DIR"
docker pull "$POSTGRES_IMAGE" >/dev/null

if [[ -z "$POSTGRES_RUNTIME_UID" ]]; then
  POSTGRES_RUNTIME_UID="$(docker run --rm --entrypoint sh "$POSTGRES_IMAGE" -lc 'id -u postgres')"
fi

if [[ -z "$POSTGRES_RUNTIME_GID" ]]; then
  POSTGRES_RUNTIME_GID="$(docker run --rm --entrypoint sh "$POSTGRES_IMAGE" -lc 'id -g postgres')"
fi

if [[ -z "$POSTGRES_RUNTIME_UID" || -z "$POSTGRES_RUNTIME_GID" ]]; then
  echo "Could not resolve postgres runtime UID/GID for image $POSTGRES_IMAGE." >&2
  exit 1
fi

chown -R "${POSTGRES_RUNTIME_UID}:${POSTGRES_RUNTIME_GID}" "$POSTGRES_DATA_DIR"

if docker ps --format '{{.Names}}' | grep -qx "$POSTGRES_CONTAINER_NAME"; then
  echo "PostgreSQL container already running: $POSTGRES_CONTAINER_NAME"
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$POSTGRES_CONTAINER_NAME"; then
  docker start "$POSTGRES_CONTAINER_NAME" >/dev/null
else
  docker run -d \
    --name "$POSTGRES_CONTAINER_NAME" \
    --restart unless-stopped \
    -p "127.0.0.1:${POSTGRES_PORT}:5432" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -v "${POSTGRES_DATA_DIR}:/var/lib/postgresql/data" \
    -v "${POSTGRES_INIT_DIR}:/docker-entrypoint-initdb.d:ro" \
    -v "${REPO_DIR}:/workspace:ro" \
    "$POSTGRES_IMAGE" >/dev/null
fi

for _ in $(seq 1 30); do
  if docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    echo "PostgreSQL container is ready on 127.0.0.1:${POSTGRES_PORT}"
    exit 0
  fi

  sleep 1
done

echo "PostgreSQL container did not become ready in time." >&2
exit 1
