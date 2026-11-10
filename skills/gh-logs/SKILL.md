---
name: gh-logs
description: Analyze GitHub Actions runs via the `gh` CLI. By default, diagnose a failed run. Fetch its logs, classify the root cause, and recommend a fix. Use when a workflow run failed and the user needs to know why, when detecting flaky tests across recent runs, profiling slow steps, analyzing failure history, or watching a live run.
when_to_use: "Also applies to a bare run ID or run URL. Skip for viewing logs of passing runs (use `gh run view <id> --log` directly), for editing workflow YAML (this skill reads runs and does not author workflows), and for running or re-running workflows (use `gh workflow run` or `gh run rerun`)."
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
  - Bash(${CLAUDE_SKILL_DIR}/scripts/classify-log.sh *)
---

# gh-logs

Diagnose GitHub Actions runs: fetch logs via `gh`, classify the failure, and suggest a fix with a verify step. This skill runs in a forked context with no conversation history, and only your finished diagnosis returns. Raw logs stay out of the main conversation. Your inputs are these instructions, `$ARGUMENTS`, and the linked references.

Request: `$ARGUMENTS`. If it is blank or contains the literal placeholder, diagnose the most recent failure.

## Preflight

- Repo: !`gh repo view --json nameWithOwner --jq .nameWithOwner`
- Branch: !`git branch --show-current`
- Auth: !`gh auth status`
- Recent failures (all branches): !`gh run list --status failure --limit 5 --json databaseId,displayTitle,workflowName,headBranch,createdAt`

If auth failed above, tell the user to run `gh auth login` and stop. If the repo lookup failed, ask which repo to target. Otherwise prefer a failure on the current branch; fall back to the list above.

## Modes

| Mode | Triggered by | Primary reference |
| --- | --- | --- |
| Diagnose (default) | "CI is broken / red / failing", "why did this run fail?", a bare run ID or URL | [`references/failure-patterns.md`](references/failure-patterns.md) |
| `--flaky` | "is this test flaky?", "it passes locally" | [`references/failure-patterns.md`](references/failure-patterns.md) (test signatures) |
| `--slow` | "why is the build so slow?" | [`references/gh-commands.md`](references/gh-commands.md) (timing jq) |
| `--history [n]` | "has this been failing for a while?" (default 10) | [`references/analysis-templates.md`](references/analysis-templates.md) |
| `--watch` | "watch this run and tell me when it's done" | [`references/gh-commands.md`](references/gh-commands.md) (`gh run watch` flags) |

Every mode reports through a template in [`references/analysis-templates.md`](references/analysis-templates.md). A `<workflow-name>` argument narrows any mode to one workflow. Full `gh` invocation cookbook: [`references/gh-commands.md`](references/gh-commands.md).

## Default workflow (diagnose)

### 1. Find the run

The Preflight block already resolved repo, branch, and recent failures. If a run ID was passed, use it directly. Otherwise narrow to the current branch:

```bash
BRANCH=$(git branch --show-current)
gh run list --branch "$BRANCH" --status failure --limit 1 \
  --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

If that is empty, fall back to the all-branches list from Preflight. With a workflow name, add `--workflow <name>`.

### 2. Get the overview

```bash
gh run view <run-id> --json jobs \
  --jq '.jobs[] | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure") | {name, conclusion}]}'
```

This tells you which jobs failed and which steps inside them.

### 3. Fetch the failing logs

```bash
gh run view <run-id> --log-failed > /tmp/run-<run-id>.log
${CLAUDE_SKILL_DIR}/scripts/classify-log.sh /tmp/run-<run-id>.log
```

Run the classifier before reading the log by hand. Failed-step output often runs past 5000 lines.

The script matches one signature regex per category. For each category it prints the hit count and the first five matching lines with line numbers. It ends with `primary: <category>`, the most upstream category that matched. Use the line numbers to pick where to `sed -n` next.

If the log is still unwieldy, narrow to one job: `gh run view <run-id> --job <job-id> --log-failed`. If even that is too large, `gh api` the raw log and grep for `error`/`FAIL`/`fatal`.

### 4. Classify

The script sees signatures, not causality. Start from its `primary:` line. Confirm it against the surrounding log and [`references/failure-patterns.md`](references/failure-patterns.md). Pick one primary category:

| Category | Strongest signals |
| --- | --- |
| **test** | `FAIL`, `AssertionError`, `--- FAIL:`, snapshot mismatch |
| **build** | `error TS`, `Build failed`, `Rollup failed to resolve`, `undefined:` |
| **deps** | `ERESOLVE`, `404 Not Found`, `ETARGET`, `ECONNREFUSED` to registry |
| **lint** | `X errors found`, biome/eslint/prettier output |
| **auth** | `403`, `401`, `Permission denied (publickey)`, missing secret |
| **infra** | `Killed` (137), `No space left`, `heap out of memory`, runner shutdown |
| **timeout** | `exceeded maximum execution time`, stuck for 10+ min |

**When multiple categories match, pick the most _upstream_ cause.** That is the one to fix. For example, an OOM during tests matches both `infra` and `test`.

Priority: `auth` > `deps` > `build` > `infra` > `lint` > `test` > `timeout`. A test that fails because deps did not install is a deps failure.

If the evidence still fits two causes, report both. Ask the user for the evidence or context that separates them, because a wrong classification leads to a wrong fix.

### 5. Report

Fill in every field of the diagnosis template in [`references/analysis-templates.md`](references/analysis-templates.md#diagnosis-report-default). A worked example is in [Example: auto-diagnose](references/analysis-templates.md#example-auto-diagnose).

## Other modes

### Flaky test detection: `--flaky`

```bash
gh run list --branch "$BRANCH" --limit 20 --json databaseId,conclusion
```

For each failed run, extract failed test names from the log. Tests that fail in some runs but pass in others are flaky. Report with pass/fail ratio and the suspected mechanism (race condition, timing dependency, shared port, external service, test ordering). See `references/analysis-templates.md` for the output shape.

### Slow step profiling: `--slow`

`gh run view --json jobs` returns `startedAt` / `completedAt` on every step (gh 2.60+, camelCase):

```bash
gh run view <run-id> --json jobs --jq '
  [.jobs[].steps[] | select(.completedAt != null and .startedAt != null) |
   {name, duration: ((.completedAt | fromdateiso8601) - (.startedAt | fromdateiso8601))}] |
  sort_by(-.duration) | .[] | "\(.duration)s\t\(.name)"'
```

Durations come back sorted descending. Identify bottlenecks and suggest cache, parallelism, or dropping the step.

On gh older than 2.60 the steps carry no timestamps. Use the REST fallback in [`references/gh-commands.md`](references/gh-commands.md) (same filter, snake_case fields).

### History: `--history [n]`

```bash
gh run list --status failure --limit <n> \
  --json databaseId,displayTitle,conclusion,event,headBranch,workflowName,createdAt
```

For each, pull failed job/step names. Surface recurring patterns: same step, specific branch, time-of-day correlation.

### Watch: `--watch`

```bash
gh run watch --exit-status
```

When it finishes, if it failed, drop into diagnose mode on the resulting run ID.

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
| Cancelled runs | First check whether cancellation was manual, concurrency, or timeout. Default to `infra`. If the log carries a timeout signature (`exceeded the maximum execution time`, `The operation was canceled` after a long silent step), classify as `timeout`. |
