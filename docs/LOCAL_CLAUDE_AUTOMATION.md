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

Recommended automated mode:

```bash
export CLAUDE_CONTENT_MODEL=sonnet
export CLAUDE_CONTENT_MAX_BUDGET_USD=1
export LOCAL_CONTENT_RUN_BUILD=true
export LOCAL_CONTENT_PUSH=true
export LOCAL_CONTENT_OPEN_PR=true
```

## Behavior guardrails

- The script refuses to run if the working tree is dirty.
- The script refuses to run if you are not on the expected base branch.
- The script creates a new branch before generation.
- If no content changes are produced, the branch is deleted automatically.

## macOS launchd example

Create `~/Library/LaunchAgents/com.michael.content-automation.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.michael.content-automation</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string>
      <string>-lc</string>
      <string>cd /Users/michaelsantos/Documents/GitHub/portfolio-michael-santos && export CLAUDE_CONTENT_MODEL=sonnet && export CLAUDE_CONTENT_MAX_BUDGET_USD=1 && export LOCAL_CONTENT_RUN_BUILD=true && export LOCAL_CONTENT_PUSH=true && export LOCAL_CONTENT_OPEN_PR=true && pnpm content:local:automation -- --topic "business cases in data and AI"</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
      <key>Weekday</key>
      <integer>2</integer>
      <key>Hour</key>
      <integer>8</integer>
      <key>Minute</key>
      <integer>30</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/content-automation.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/content-automation.err</string>
  </dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.michael.content-automation.plist
```

Reload after changes:

```bash
launchctl unload ~/Library/LaunchAgents/com.michael.content-automation.plist
launchctl load ~/Library/LaunchAgents/com.michael.content-automation.plist
```

## Recommended operating model

- local Claude generates drafts
- GitHub PR holds the review checkpoint
- CI validates the branch
- Vercel deploys only after merge
- social distribution happens after content approval
