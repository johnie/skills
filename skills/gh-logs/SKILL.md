---
name: gh-logs
description: Fetch and analyze GitHub Actions logs via gh CLI. Diagnoses CI failures, detects flaky tests, profiles slow steps, and suggests fixes. Use when CI is broken, builds are failing, or you need to understand workflow run history.
allowed-tools:
  - Bash
---

# GH Logs

CI log analyst. Fetches GitHub Actions logs via `gh` CLI, reasons about them, diagnoses root causes, and suggests fixes. Stop clicking through the web UI — the terminal is faster, searchable, and doesn't crash on large output.

## Arguments

- `(none)`: Auto-detect repo + branch, find latest failed run, diagnose
- `<run-id>`: Analyze a specific run by ID
- `<workflow-name>`: Filter to a specific workflow
- `--flaky`: Detect flaky tests by comparing recent runs
- `--slow`: Profile step timing, find bottlenecks
- `--history [n]`: Analyze last n failures (default 10)
- `--watch`: Monitor a running workflow in real time

## Workflow

### 1. Preflight

Verify `gh` is authenticated and in a git repo:

```bash
gh auth status 2>&1 | head -3
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

If auth fails, tell the user to run `gh auth login`.

### 2. Find the Run

**No arguments** — find latest failed run on current branch:

```bash
BRANCH=$(git branch --show-current)
gh run list --branch "$BRANCH" --status failure --limit 1 --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

If no failures on current branch, fall back to all branches:

```bash
gh run list --status failure --limit 1 --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

**With run ID** — use directly.

**With workflow name** — filter:

```bash
gh run list --workflow "<name>" --status failure --limit 1 --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

### 3. Get Run Overview

```bash
gh run view <run-id> --json jobs --jq '.jobs[] | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure") | {name, conclusion}]}'
```

This gives: which jobs failed, which steps within them failed.

### 4. Fetch Failed Logs

```bash
gh run view <run-id> --log-failed
```

If output is too large (>5000 lines), narrow to specific job:

```bash
gh run view <run-id> --job <job-id> --log-failed
```

If you need full context around the failure:

```bash
gh run view <run-id> --log
```

### 5. Analyze

Match log output against known failure patterns. See `references/failure-patterns.md` for the full signature database.

Classify into one of these categories:

| Category | Signals |
|---|---|
| **test** | `FAIL`, assertion errors, snapshot mismatches |
| **build** | `error TS`, `Build failed`, compilation errors |
| **deps** | `ERESOLVE`, `404 Not Found`, registry timeouts |
| **infra** | `OOM`, `No space left`, runner shutdown |
| **lint** | `found X errors`, formatting violations |
| **auth** | `403`, `401`, token expiry, secret access denied |
| **timeout** | `exceeded maximum execution time`, stuck steps |

### 6. Diagnose and Report

Output a structured diagnosis. See `references/analysis-templates.md` for the full template.

Always include:
1. **Category** and failed step/job name
2. **Root cause** — 1-2 sentences, specific
3. **Log excerpt** — the relevant lines (truncated if long)
4. **Suggested fix** — actionable, with code or commands
5. **Verify command** — how to re-run and confirm the fix

## Analysis Modes

### Diagnose (default)

The standard mode. Find failure, read logs, identify root cause, suggest fix. This is what runs when you invoke `/gh-logs` with no flags.

### Flaky Test Detection (`--flaky`)

Compare recent runs to find tests that intermittently fail:

```bash
gh run list --branch "$BRANCH" --limit 20 --json databaseId,conclusion
```

For each failed run, extract failed test names from logs. Tests that fail in some runs but pass in others are flaky. Report with pass/fail ratio and suspected cause (race condition, timing, port conflict, shared state).

### Slow Step Profiling (`--slow`)

Extract step timing data:

```bash
gh run view <run-id> --json jobs --jq '.jobs[].steps[] | {name, startedAt: .started_at, completedAt: .completed_at, conclusion}'
```

Calculate durations, sort descending, identify bottlenecks. Suggest optimizations (caching, parallelism, unnecessary steps).

### History Analysis (`--history [n]`)

Analyze the last n failed runs (default 10):

```bash
gh run list --status failure --limit <n> --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

For each, get failed job/step names. Identify recurring patterns: same step failing repeatedly, specific branch with persistent issues, time-correlated failures.

### Watch Mode (`--watch`)

Monitor a running workflow in real time:

```bash
gh run watch --exit-status
```

When it finishes, if it failed, automatically switch to diagnose mode and analyze the failure.

## Example Sessions

### Auto-diagnose (no flags)

```text
User: /gh-logs

Claude: Checking CI status for branch feat/auth-flow...

Found failed run #4521 (CI / test) from 3 minutes ago.

## Diagnosis

**Category**: test
**Failed step**: Run tests (job: test-ubuntu)
**Root cause**: Snapshot mismatch in LoginForm component — expected output changed after adding the "Remember me" checkbox.

**Log excerpt**:
  FAIL src/components/LoginForm.test.tsx
  - renders login form (2ms)
    Expected: "<form>..."
    Received: "<form>...<label>Remember me</label>..."
  1 snapshot failed.

**Fix**: Update the snapshot:
  bun test -- -u src/components/LoginForm.test.tsx

**Verify**:
  git add -A && git commit -m "test: update LoginForm snapshot" && git push
  gh run watch
```

### Flaky test detection

```text
User: /gh-logs --flaky

Claude: Analyzing last 20 runs on feat/payments...

## Flaky Tests Detected

| Test | Pass | Fail | Rate |
|---|---|---|---|
| checkout.test.ts > handles concurrent requests | 14 | 6 | 70% |
| webhook.test.ts > validates signature | 18 | 2 | 90% |

**checkout.test.ts > handles concurrent requests**
Suspected cause: Race condition — test uses shared port 3000 without isolation.
Fix: Use random port assignment or `--forceExit` with test isolation.

**webhook.test.ts > validates signature**
Suspected cause: Timing-dependent — signature validation uses Date.now().
Fix: Mock the clock in test setup.
```

### Slow step profiling

```text
User: /gh-logs --slow

Claude: Profiling run #4519 (CI / build)...

## Step Timing

| Step | Duration | % of Total |
|---|---|---|
| Install dependencies | 2m 34s | 42% |
| Run tests | 1m 48s | 29% |
| Build | 58s | 16% |
| Lint | 28s | 8% |
| Checkout | 12s | 2% |
| Setup Node | 8s | 1% |

**Bottleneck**: Install dependencies (2m 34s / 42%)
**Suggestion**: Add dependency caching. Example step:
  - uses: actions/cache@v4
    with:
      path: ~/.bun/install/cache
      key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
```

## Edge Cases

- **No failures found**: Report "No failed runs found" with the search scope used. Suggest checking a different branch or workflow.
- **Rate limits**: If `gh` returns 403/rate limit, wait and retry. Inform the user.
- **Large logs**: If `--log-failed` output exceeds 5000 lines, narrow to specific job with `--job`. If still too large, use `gh api` to download raw log and grep for errors.
- **No `gh` CLI**: Tell user to install: `brew install gh` or see https://cli.github.com
- **Not authenticated**: Direct user to run `gh auth login`.
- **Private repo / no access**: `gh` will error with 404. Explain permission requirements.
- **Multiple failed jobs**: Analyze each failed job separately. Report the most likely root cause first.
- **Cancelled runs**: Treat as infra category. Check if cancellation was manual or due to timeout/concurrency.

## Reference

- See `references/failure-patterns.md` for the full failure signature database
- See `references/gh-commands.md` for complete `gh` CLI command reference
- See `references/analysis-templates.md` for output format templates
