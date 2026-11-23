#!/usr/bin/env bash
# Drop approval-gated CI runs on a bot pull-request head branch before that
# branch is deleted.
#
# CI listens to every pull_request. These bot PRs are opened by
# github-actions[bot] with GITHUB_TOKEN, so the run sits in
# action_required/waiting and never starts a job. Auto-merge then deletes the
# head branch and GitHub fails the run with:
# "This workflow run required approval but was not approved before it expired."
#
# pull_request branches-ignore matches the base branch, not the head branch,
# so it cannot skip these PRs (they target main). A job-level if still creates
# the approval-gated run. Cancel the run, or delete it when GitHub has already
# marked it completed/action_required, before merging.
set -uo pipefail

branch="${1:?usage: cancel-pending-ci.sh <head-branch>}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
attempts="${CANCEL_CI_ATTEMPTS:-6}"
poll_sleep="${CANCEL_CI_POLL_SLEEP:-3}"
settle_sleep="${CANCEL_CI_SETTLE_SLEEP:-2}"

list_ids() {
  local status="$1"
  gh run list \
    --repo "$repo" \
    --workflow ci.yml \
    --branch "$branch" \
    --event pull_request \
    --status "$status" \
    --limit 20 \
    --json databaseId \
    --jq '.[].databaseId' 2>/dev/null || true
}

collect_ids() {
  {
    list_ids action_required
    list_ids waiting
  } | awk 'NF && !seen[$0]++'
}

dismiss_one() {
  local id="$1"
  local status conclusion
  echo "Approval-gated CI run ${id} on ${branch}"
  if gh run cancel "$id" --repo "$repo"; then
    echo "Cancelled CI run ${id}"
    return 0
  fi
  if gh run cancel "$id" --repo "$repo" --force; then
    echo "Force-cancelled CI run ${id}"
    return 0
  fi
  status="$(gh run view "$id" --repo "$repo" --json status --jq '.status' 2>/dev/null || true)"
  conclusion="$(gh run view "$id" --repo "$repo" --json conclusion --jq '.conclusion' 2>/dev/null || true)"
  if [ "$status" = "completed" ]; then
    if gh api --method DELETE "repos/${repo}/actions/runs/${id}"; then
      echo "Deleted completed CI run ${id} (conclusion=${conclusion:-unknown})"
      return 0
    fi
  fi
  echo "Left CI run ${id} in place (status=${status:-unknown} conclusion=${conclusion:-unknown})"
}

found=0
attempt=1
while [ "$attempt" -le "$attempts" ]; do
  ids="$(collect_ids || true)"
  if [ -z "$ids" ]; then
    if [ "$attempt" -lt "$attempts" ]; then
      sleep "$poll_sleep"
    fi
    attempt=$((attempt + 1))
    continue
  fi
  found=1
  while IFS= read -r id; do
    [ -n "$id" ] || continue
    dismiss_one "$id"
  done <<< "$ids"
  sleep "$settle_sleep"
  if [ -z "$(collect_ids || true)" ]; then
    break
  fi
  attempt=$((attempt + 1))
done

if [ "$found" -eq 0 ]; then
  echo "No approval-gated CI runs on ${branch}"
fi

exit 0
