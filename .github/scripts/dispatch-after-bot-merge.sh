#!/usr/bin/env bash
# GITHUB_TOKEN merges do not trigger push workflows. workflow_dispatch does,
# and actions:write on GITHUB_TOKEN is enough. No PAT.
#
# Usage: dispatch-after-bot-merge.sh <pr-number> [--social]
# --social also starts Social Distribution for at most one unpublished
# July 2026+ article. Do not pass it after the publish-state PR or the
# job will publish another article and loop.
set -uo pipefail

pr="${1:?usage: dispatch-after-bot-merge.sh <pr-number> [--social]}"
dispatch_social="${2:-}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
attempts="${DISPATCH_WAIT_ATTEMPTS:-12}"
poll_sleep="${DISPATCH_WAIT_SLEEP:-5}"

merged=0
attempt=1
while [ "$attempt" -le "$attempts" ]; do
  state="$(gh pr view "$pr" --repo "$repo" --json state --jq '.state' 2>/dev/null || true)"
  if [ "$state" = "MERGED" ]; then
    merged=1
    break
  fi
  if [ "$attempt" -lt "$attempts" ]; then
    sleep "$poll_sleep"
  fi
  attempt=$((attempt + 1))
done

if [ "$merged" -ne 1 ]; then
  echo "PR #${pr} is not merged yet; skipping downstream workflow_dispatch."
  exit 0
fi

echo "PR #${pr} merged. Dispatching CI on main."
gh workflow run ci.yml --repo "$repo" --ref main

if [ "$dispatch_social" = "--social" ]; then
  echo "Dispatching Social Distribution for one unpublished article since 2026-07-01."
  gh workflow run social-distribution.yml --repo "$repo" --ref main \
    -f mode=recent-articles \
    -f locale=en \
    -f channel=linkedin \
    -f since=2026-07-01 \
    -f max=1 \
    -f delay_ms=0
fi

exit 0
