# Analysis Output Templates

Structured output formats for each analysis mode. Always use these templates for consistent, scannable output.

## Diagnosis Report (default)

Use for the standard diagnose workflow.

```text
## Diagnosis

**Category**: <test|build|deps|infra|lint|auth|timeout>
**Failed step**: <step name> (job: <job name>)
**Root cause**: <1-2 sentences explaining what went wrong and why>

**Log excerpt**:
```
<relevant log lines, max 20 lines, truncated with ... if longer>
```

**Fix**:
<specific, actionable fix — code change, command to run, or config update>

**Verify**:
<command to re-run CI and confirm the fix>
```

### Multiple failures

When a run has multiple failed jobs, report each separately:

```text
## Diagnosis

### 1. <job name>

**Category**: ...
**Failed step**: ...
**Root cause**: ...
...

### 2. <job name>

**Category**: ...
...
```

Lead with the most likely root cause — often one failure causes cascading failures in other jobs.

## Flaky Test Report

Use for `--flaky` mode.

```text
## Flaky Tests

Analyzed last <n> runs on <branch>. Found <count> flaky test(s).

| Test | Pass | Fail | Rate |
|---|---|---|---|
| <test name> | <n> | <n> | <n%> |

### <test name>

**Suspected cause**: <race condition, timing, port conflict, shared state, etc.>
**Evidence**: <which runs passed vs failed, any pattern in timing>
**Fix**: <specific suggestion to stabilize>
```

If no flaky tests found:

```text
## Flaky Tests

Analyzed last <n> runs on <branch>. No flaky tests detected — all failures were consistent.
```

## Slow Step Profile

Use for `--slow` mode.

```text
## Step Timing — Run #<id>

Total duration: <time>

| Step | Duration | % of Total |
|---|---|---|
| <step> | <time> | <pct> |

**Bottleneck**: <step name> (<duration> / <pct>)
**Suggestion**: <specific optimization — caching, parallelism, skip, etc.>
```

### With comparison

When `--history` is also used, include comparison:

```text
## Step Timing — Run #<id> vs Average

| Step | This Run | Average | Delta |
|---|---|---|---|
| <step> | <time> | <time> | <+/- time> |

**Regression**: <step name> is <X>% slower than average.
**Possible cause**: <cache miss, new tests, dependency change, etc.>
```

## History Report

Use for `--history` mode.

```text
## Failure History — Last <n> Runs

**Failure rate**: <n>/<total> (<pct>)
**Time range**: <oldest date> to <newest date>

### By Category

| Category | Count | % |
|---|---|---|
| <category> | <n> | <pct> |

### Recurring Failures

| Step / Test | Occurrences | Last Seen |
|---|---|---|
| <name> | <n> | <date> |

### Trend

<increasing/decreasing/stable> — <1-2 sentence summary of the trend>

### Recommendations

1. <most impactful fix>
2. <second priority>
3. <third priority>
```

## Watch Mode Completion

Use after `--watch` when a run finishes and fails.

```text
Run #<id> completed: **failed**

Switching to diagnosis mode...

## Diagnosis
...
```

If the run succeeds:

```text
Run #<id> completed: **success** (took <duration>)
All jobs passed.
```

## No Failures Found

```text
No failed runs found for <scope>.

Searched: <branch / workflow / all branches>
Last <n> runs: all passing.
```

## Error States

### Not authenticated

```text
Error: gh CLI is not authenticated.
Run `gh auth login` to authenticate, then try again.
```

### Not a git repo

```text
Error: Not in a git repository.
Navigate to a repo directory and try again.
```

### Rate limited

```text
Warning: GitHub API rate limit reached. Retry in <n> seconds.
```
