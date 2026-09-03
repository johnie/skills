---
name: gh-logs
description: Diagnose GitHub Actions failures via the `gh` CLI — fetch logs, classify the root cause, and recommend a fix. Use when a workflow run failed and the user needs to know why, when detecting flaky tests across recent runs, profiling slow steps, analyzing failure history, or watching a live run. Stop clicking through the GitHub UI.
argument-hint: "[run-id] [--flaky|--slow|--history N|--watch]"
context: fork
background: false
allowed-tools:
  - Bash(gh auth status *)
  - Bash(gh repo view *)
  - Bash(gh run list *)
  - Bash(gh run view *)
  - Bash(gh run watch *)
  - Bash(gh api repos/*/actions/*)
  - Bash(git branch *)
---

# gh-logs

CI log analyst. Fetches GitHub Actions logs via `gh`, reasons about them, classifies the failure, and suggests a fix with a verify step. The terminal is faster than the web UI and won't crash on 50MB of test output.

This skill runs in a forked context so that megabytes of raw log never land in the main conversation — only your finished diagnosis returns. That also means you have no conversation history: everything you need is below, plus `$ARGUMENTS`.

Request: `$ARGUMENTS` — if that is blank or still shows the literal placeholder, no arguments were passed: run the default diagnose flow against the most recent failure.

## Preflight

- Repo: !`gh repo view --json nameWithOwner --jq .nameWithOwner`
- Branch: !`git branch --show-current`
- Auth: !`gh auth status`
- Recent failures (all branches): !`gh run list --status failure --limit 5 --json databaseId,displayTitle,workflowName,headBranch,createdAt`

If auth failed above, tell the user to run `gh auth login` and stop. If the repo lookup failed, ask which repo to target. Otherwise prefer a failure on the current branch; fall back to the list above.

Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

## Modes

| Mode | Triggered by | Primary reference |
| --- | --- | --- |
| Diagnose (default) | "CI is broken / red / failing", "why did this run fail?", a bare run ID or URL | [`references/failure-patterns.md`](references/failure-patterns.md) |
| `--flaky` | "is this test flaky?", "it passes locally" | [`references/failure-patterns.md`](references/failure-patterns.md) (test signatures) |
| `--slow` | "why is the build so slow?" | [`references/gh-commands.md`](references/gh-commands.md) (timing jq) |
| `--history [n]` | "has this been failing for a while?" (default 10) | [`references/analysis-templates.md`](references/analysis-templates.md) |
| `--watch` | "watch this run and tell me when it's done" | [`references/analysis-templates.md`](references/analysis-templates.md) |

Every mode reports through a template in [`references/analysis-templates.md`](references/analysis-templates.md). A `<workflow-name>` argument narrows any mode to one workflow. Full `gh` invocation cookbook: [`references/gh-commands.md`](references/gh-commands.md).

## When NOT to use

- Viewing passing-run logs for debugging successful runs — use `gh run view <id> --log` directly.
- Editing workflow YAML — this skill reads runs, it doesn't author workflows.
- Running or re-running workflows — that's `gh workflow run` / `gh run rerun`.

## Default workflow (diagnose)

### 1. Find the run

The Preflight block already resolved repo, branch, and recent failures. If a run ID was passed, use it directly. Otherwise narrow to the current branch:

```bash
BRANCH=$(git branch --show-current)
gh run list --branch "$BRANCH" --status failure --limit 1 \
  --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

If that is empty, fall back to the all-branches list from Preflight. With a workflow name — add `--workflow <name>`.

### 2. Get the overview

```bash
gh run view <run-id> --json jobs \
  --jq '.jobs[] | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure") | {name, conclusion}]}'
```

This tells you which jobs failed and which steps inside them.

### 3. Fetch the failing logs

```bash
gh run view <run-id> --log-failed
```

If output is >5000 lines, narrow to a specific job: `gh run view <run-id> --job <job-id> --log-failed`. If still too large, `gh api` the raw log and `grep` for `error`/`FAIL`/`fatal`.

### 4. Classify

Match log lines against [`references/failure-patterns.md`](references/failure-patterns.md). Pick one primary category:

| Category | Strongest signals |
| --- | --- |
| **test** | `FAIL`, `AssertionError`, `--- FAIL:`, snapshot mismatch |
| **build** | `error TS`, `Build failed`, `Rollup failed to resolve`, `undefined:` |
| **deps** | `ERESOLVE`, `404 Not Found`, `ETARGET`, `ECONNREFUSED` to registry |
| **lint** | `X errors found`, biome/eslint/prettier output |
| **auth** | `403`, `401`, `Permission denied (publickey)`, missing secret |
| **infra** | `Killed` (137), `No space left`, `heap out of memory`, runner shutdown |
| **timeout** | `exceeded maximum execution time`, stuck for 10+ min |

**When multiple categories match** (common — e.g., an OOM during tests looks like both `infra` and `test`): pick the most _upstream_ cause, because that's what needs to be fixed. Priority: `auth` > `deps` > `build` > `infra` > `lint` > `test` > `timeout`. A test failing _because_ deps didn't install is a deps bug, not a test bug. When it's genuinely ambiguous, surface both and ask the user which feels right — a wrong classification leads to a wrong fix.

### 5. Report

Use the diagnosis template in [`references/analysis-templates.md`](references/analysis-templates.md). Always include:

1. **Category** and the failed step / job name
2. **Root cause** — 1–2 sentences, specific
3. **Log excerpt** — the lines that proved it, truncated if long
4. **Suggested fix** — actionable, with commands or code
5. **Verify command** — how to re-run and confirm the fix worked

## Other modes

### Flaky test detection — `--flaky`

```bash
gh run list --branch "$BRANCH" --limit 20 --json databaseId,conclusion
```

For each failed run, extract failed test names from the log. Tests that fail in some runs but pass in others are flaky. Report with pass/fail ratio and the suspected mechanism (race condition, timing dependency, shared port, external service, test ordering). See `references/analysis-templates.md` for the output shape.

### Slow step profiling — `--slow`

Step-level timestamps come from the REST jobs endpoint (`gh run view --json jobs` exposes timing only on jobs, not steps):

```bash
gh api repos/{owner}/{repo}/actions/runs/<run-id>/jobs --jq '
  [.jobs[].steps[] | select(.completed_at != null and .started_at != null) |
   {name, duration: ((.completed_at | fromdateiso8601) - (.started_at | fromdateiso8601))}] |
  sort_by(-.duration)'
```

Durations come back sorted descending — identify bottlenecks and suggest cache, parallelism, or dropping the step. For a coarse job-level view, `gh run view <run-id> --json jobs --jq '.jobs[] | {name, startedAt, completedAt}'` avoids the extra API call.

### History — `--history [n]`

```bash
gh run list --status failure --limit <n> \
  --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

For each, pull failed job/step names. Surface recurring patterns: same step, specific branch, time-of-day correlation.

### Watch — `--watch`

```bash
gh run watch --exit-status
```

When it finishes, if it failed, drop into diagnose mode on the resulting run ID.

## Example — auto-diagnose

```text
User: /gh-logs

Claude: Checking CI for branch feat/auth-flow...
Found failed run #4521 (CI / test) from 3 minutes ago.

## Diagnosis

Category: test
Failed step: Run tests (job: test-ubuntu)
Root cause: Snapshot mismatch in LoginForm — expected output changed after adding the "Remember me" checkbox.

Log excerpt:
  FAIL src/components/LoginForm.test.tsx
  - renders login form (2ms)
    Expected: "<form>..."
    Received: "<form>...<label>Remember me</label>..."
  1 snapshot failed.

Fix:
  <test-runner> -u src/components/LoginForm.test.tsx   # e.g. vitest -u / jest -u, via the project's package manager

Verify:
  Commit the updated snapshot (hand off to /commit), push, then `gh run watch`.
```

More session shapes (flaky / slow / history) are in [`references/analysis-templates.md`](references/analysis-templates.md).

## Edge cases

| Situation | Handling |
| --- | --- |
| No failures found | Report "no failed runs on <scope>" and suggest widening (different branch, include success, workflow filter). |
| `gh` rate limit (403) | Back off, tell the user which call hit the limit. |
| Logs >5000 lines | Narrow to failing job, then grep for `error`/`FAIL`/`fatal` if still too large. |
| No `gh` installed | `brew install gh` or <https://cli.github.com>. |
| Not authenticated | `gh auth login`. |
| Private repo / no access | `gh` returns 404; explain required permissions. |
| Multiple failed jobs | Diagnose each; lead the report with the most upstream cause. |
| Cancelled runs | Infra category. Check if cancellation was manual, timeout, or concurrency. |

## Reference index

- [`references/failure-patterns.md`](references/failure-patterns.md) — log signature database by language / category
- [`references/analysis-templates.md`](references/analysis-templates.md) — output templates for each mode
- [`references/gh-commands.md`](references/gh-commands.md) — complete `gh` CLI command cookbook with jq filters
