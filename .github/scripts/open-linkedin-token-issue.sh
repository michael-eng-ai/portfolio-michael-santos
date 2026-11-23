#!/usr/bin/env bash
# Open or update a single issue when the LinkedIn token is invalid or expiring.
# Never prints the token. Safe to run on every failed check.
set -euo pipefail

title="LinkedIn token expirado — renovar"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
run_url="${GITHUB_SERVER_URL:-https://github.com}/${repo}/actions/runs/${GITHUB_RUN_ID:-0}"
when="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

body=$(cat <<EOF
O \`LINKEDIN_ACCESS_TOKEN\` está inválido ou expira em menos de 48 horas.

A checagem chama \`GET https://api.linkedin.com/v2/userinfo\` (e, se o token for um JWT, lê só o campo \`exp\`). Nenhum post é enviado quando essa checagem falha. O valor do token não entra neste issue.

Renove o token em https://www.linkedin.com/developers/apps/ e atualize o secret \`LINKEDIN_ACCESS_TOKEN\` em Settings → Secrets and variables → Actions (e no worker, se ele também posta).

As próximas falhas comentam neste issue em vez de abrir outro.

Workflow: \`${GITHUB_WORKFLOW:-unknown}\`
Run: ${run_url}
EOF
)

number="$(
  gh issue list \
    --repo "$repo" \
    --state open \
    --limit 50 \
    --json number,title \
    --jq ".[] | select(.title == \"${title}\") | .number" \
    | head -n 1
)"

if [ -n "$number" ]; then
  gh issue comment "$number" --repo "$repo" --body "Checagem do token falhou de novo em ${when} (\`${GITHUB_WORKFLOW:-workflow}\`, run ${GITHUB_RUN_ID:-n/a}). Nenhum post foi enviado. O token não é impresso aqui."
  echo "Updated issue #${number}"
  exit 0
fi

url="$(gh issue create --repo "$repo" --title "$title" --body "$body")"
echo "Opened ${url}"
