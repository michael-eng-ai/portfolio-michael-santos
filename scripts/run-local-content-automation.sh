#!/bin/zsh

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(cd -- "${SCRIPT_DIR}/.." && pwd)
ENV_FILE="${REPO_DIR}/.env.content-automation"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
fi

export CLAUDE_CONTENT_MODEL="${CLAUDE_CONTENT_MODEL:-sonnet}"
export CLAUDE_CONTENT_MAX_BUDGET_USD="${CLAUDE_CONTENT_MAX_BUDGET_USD:-1}"
export LOCAL_CONTENT_BASE_BRANCH="${LOCAL_CONTENT_BASE_BRANCH:-main}"
export LOCAL_CONTENT_RUN_BUILD="${LOCAL_CONTENT_RUN_BUILD:-true}"
export LOCAL_CONTENT_PUSH="${LOCAL_CONTENT_PUSH:-true}"
export LOCAL_CONTENT_OPEN_PR="${LOCAL_CONTENT_OPEN_PR:-true}"

cd "${REPO_DIR}"
exec pnpm content:local:automation "$@"
