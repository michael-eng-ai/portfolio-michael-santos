# Local Claude Automation

## Goal

Run content generation on your own machine with Claude Code, keep the workflow Git-driven, and avoid direct publishing from a blind local script.

## What this setup does

1. Runs Claude locally to generate a bilingual article draft.
2. Regenerates LinkedIn and X drafts from the new article set.
3. Validates content and type safety.
4. Optionally runs the production build.
5. Creates a dedicated branch.
6. Commits the generated changes.
7. Optionally pushes the branch and opens a PR.

## Requirements

- `claude` CLI installed and authenticated
- `pnpm install`
- `gh auth login` if you want automatic PR creation

## Commands

Generate one article with Claude:

```bash
pnpm content:generate:article:claude -- --topic "AI agents for governed analytics"
```

Run the full local automation:

```bash
pnpm content:local:automation -- --topic "AI agents for governed analytics"
```

## Environment variables

- `CLAUDE_CONTENT_MODEL`
  - default: `sonnet`
- `CLAUDE_CONTENT_MAX_BUDGET_USD`
  - default: `1`
- `CLAUDE_CONTENT_TOPIC_HINT`
  - optional topic hint when no CLI `--topic` is passed
- `LOCAL_CONTENT_BASE_BRANCH`
  - default: `main`
- `LOCAL_CONTENT_RUN_BUILD`
  - default: `true`
- `LOCAL_CONTENT_PUSH`
  - default: `false`
- `LOCAL_CONTENT_OPEN_PR`
  - default: `false`

You can keep these defaults in `.env.content-automation` by copying `.env.content-automation.example`.

Recommended automated mode:

```bash
cp .env.content-automation.example .env.content-automation
```

## Behavior guardrails

- The script refuses to run if the working tree is dirty.
- The script refuses to run if you are not on the expected base branch.
- The script creates a new branch before generation.
- If no content changes are produced, the branch is deleted automatically.

## macOS launchd setup

Copy the automation defaults:

```bash
cp .env.content-automation.example .env.content-automation
```

Adjust `.env.content-automation` to set your topic angle, model, and budget.

The repository includes a ready-to-install plist at `ops/macos/com.michael.content-automation.plist`.

It runs on weekdays at `08:30` and calls the dedicated wrapper script `scripts/run-local-content-automation.sh`.

Install it:

```bash
mkdir -p ~/Library/LaunchAgents
cp ops/macos/com.michael.content-automation.plist ~/Library/LaunchAgents/com.michael.content-automation.plist
```

Load it with the modern `launchctl` commands:

```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.michael.content-automation.plist
launchctl kickstart -k "gui/$(id -u)/com.michael.content-automation"
```

Reload after changes:

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.michael.content-automation.plist
cp ops/macos/com.michael.content-automation.plist ~/Library/LaunchAgents/com.michael.content-automation.plist
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.michael.content-automation.plist
```

Logs are written to:

```bash
/tmp/portfolio-michael-santos-content-automation.log
/tmp/portfolio-michael-santos-content-automation.err
```

## Recommended operating model

- local Claude generates drafts
- GitHub PR holds the review checkpoint
- CI validates the branch
- Vercel deploys only after merge
- social distribution happens after content approval
