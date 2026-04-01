# gh CLI Commands for Actions Logs

Complete reference for GitHub Actions log analysis via the `gh` CLI.

## Finding Runs

### List runs

```bash
gh run list [flags]
```

| Flag | Description |
|---|---|
| `-w, --workflow <name>` | Filter by workflow name |
| `-b, --branch <branch>` | Filter by branch |
| `-c, --commit <SHA>` | Filter by commit SHA |
| `-e, --event <event>` | Filter by trigger event (push, pull_request, etc.) |
| `-s, --status <status>` | Filter by status (see below) |
| `-u, --user <user>` | Filter by user who triggered |
| `--created <date>` | Filter by creation date |
| `-a, --all` | Include disabled workflows |
| `-L, --limit <n>` | Max results (default 20) |
| `--json <fields>` | JSON output |
| `-q, --jq <expr>` | Filter JSON with jq |

**Status values**: `queued`, `completed`, `in_progress`, `requested`, `waiting`, `pending`, `action_required`, `cancelled`, `failure`, `neutral`, `skipped`, `stale`, `startup_failure`, `success`, `timed_out`

**JSON fields**: `attempt`, `conclusion`, `createdAt`, `databaseId`, `displayTitle`, `event`, `headBranch`, `headSha`, `name`, `number`, `startedAt`, `status`, `updatedAt`, `url`, `workflowDatabaseId`, `workflowName`

## Viewing Runs

### View a run

```bash
gh run view [<run-id>] [flags]
```

| Flag | Description |
|---|---|
| `--log` | Full log output |
| `--log-failed` | Only failed step logs |
| `-j, --job <job-id>` | View specific job |
| `-a, --attempt <n>` | View specific retry attempt |
| `-v, --verbose` | Show job steps |
| `--exit-status` | Exit non-zero if run failed |
| `--json <fields>` | JSON output |
| `-q, --jq <expr>` | Filter JSON with jq |
| `-w, --web` | Open in browser |

**Additional JSON fields** (beyond list fields): `jobs`

### View job details with jq

```bash
# All failed jobs and their failed steps
gh run view <id> --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure") | {name, conclusion}]}'

# Job names and conclusions
gh run view <id> --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'

# Step timing for a specific job
gh run view <id> --json jobs --jq '.jobs[] | select(.name == "build") | .steps[] | {name, started_at, completed_at}'
```

## Monitoring Runs

### Watch a run in real time

```bash
gh run watch [<run-id>] [flags]
```

| Flag | Description |
|---|---|
| `--compact` | Show only relevant/failed steps |
| `-i, --interval <n>` | Refresh interval in seconds (default 3) |
| `--exit-status` | Exit non-zero if run fails |

## API Endpoints

For advanced use cases beyond what the `gh run` commands provide.

### List workflow runs

```bash
gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[:5] | .[] | {id, name: .name, conclusion, created_at}'
```

### Get job logs (raw download)

```bash
gh api repos/{owner}/{repo}/actions/jobs/{job_id}/logs
```

### Get run timing

```bash
gh api repos/{owner}/{repo}/actions/runs/{run_id}/timing
```

### List workflow run artifacts

```bash
gh api repos/{owner}/{repo}/actions/runs/{run_id}/artifacts --jq '.artifacts[] | {name, size_in_bytes, expired}'
```

### Re-run failed jobs

```bash
gh run rerun <run-id> --failed
```

## Compound Commands

Useful one-liners for common analysis tasks.

### Find last failed run on current branch

```bash
BRANCH=$(git branch --show-current)
gh run list --branch "$BRANCH" --status failure --limit 1 --json databaseId,displayTitle,workflowName,createdAt
```

### Get all failed job names from a run

```bash
gh run view <id> --json jobs --jq '[.jobs[] | select(.conclusion == "failure") | .name]'
```

### Failed runs in the last 24 hours

```bash
gh run list --status failure --created ">$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ)" --json databaseId,displayTitle,headBranch,workflowName
```

### Compare two runs (which steps differ)

```bash
diff <(gh run view <id1> --json jobs --jq '.jobs[].steps[] | "\(.name): \(.conclusion)"') \
     <(gh run view <id2> --json jobs --jq '.jobs[].steps[] | "\(.name): \(.conclusion)"')
```

### Extract step durations sorted by time

```bash
gh run view <id> --json jobs --jq '
  [.jobs[].steps[] | select(.completed_at != null) |
   {name, duration: (((.completed_at | fromdateiso8601) - (.started_at | fromdateiso8601)))}] |
  sort_by(-.duration) | .[] | "\(.duration)s\t\(.name)"'
```

### Count failures by workflow over last 50 runs

```bash
gh run list --status failure --limit 50 --json workflowName --jq 'group_by(.workflowName) | .[] | {workflow: .[0].workflowName, count: length}' 
```

### Grep failed logs for a pattern

```bash
gh run view <id> --log-failed 2>&1 | grep -i "error\|fail\|panic\|exception"
```

### Get failure rate for a branch

```bash
gh run list --branch main --limit 50 --json conclusion --jq '{total: length, failed: [.[] | select(.conclusion == "failure")] | length, rate: (([.[] | select(.conclusion == "failure")] | length) * 100 / length | tostring + "%")}'
```
