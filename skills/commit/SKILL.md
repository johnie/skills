---
name: commit
description: Split working-tree changes into atomic git commits with conventional-commit messages. Use when the user asks to commit, save work as commits, break one messy diff into multiple logical commits, or commit a branch's changes before a PR. Terse prompts like "commit this" count; "ship it" or "wrap up" count only when the context is committing local changes.
when_to_use: Also applies to "make some commits out of this", and whether or not files are already staged; grouping covers staged, unstaged, and untracked changes together. This skill stages and commits. Skip for staging-only requests ("stage everything" with no commit); use git add directly. Skip when the user wants exactly one commit without splitting; use git commit directly. Skip for amending the last pushed commit on a shared branch; propose a new commit instead. Skip for rebasing or reordering existing commits; use git rebase.
argument-hint: "[-v|--dry-run|--amend] [push]"
allowed-tools:
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git log *)
  - Bash(git branch *)
  - Bash(git rev-parse *)
  - Bash(git push origin HEAD)
---

# Commit

Turn the current working tree into a set of atomic conventional-commit commits. Atomic means each commit captures one logical change that you can revert on its own without breaking the rest. Never amend a pushed commit without the user's confirmation.

Requested options: `$ARGUMENTS`. If that is blank or still shows the literal placeholder, no options were passed: analyze, group, and commit without asking.

## Working tree state

- Branch: !`git branch --show-current`
- Status: !`git status --short --branch`
- Unstaged: !`git diff --stat`
- Staged: !`git diff --cached --stat`
- Unmerged paths: !`git diff --name-only --diff-filter=U`
- Recent commits: !`git log --oneline -5`

This snapshot is captured once, before the turn starts. After you stage or commit anything it is stale. Re-read with `git` rather than trusting it. Fetch full diffs (`git diff`, `git diff --cached`) as you need them. Only summaries are inlined above, so a large diff does not crowd out the instructions.

## Arguments

- `(none)`: analyze, group, and commit without confirmation
- `-v` / `--verify`: show plan, wait for y/n/edit
- `--dry-run`: show plan, exit without committing
- `--amend`: amend the last commit only. Implies `-v`. If the last commit is already pushed, amending rewrites published history and needs a force push, which is not pre-approved. Warn the user and amend only after they confirm. On a shared branch, recommend a new commit instead.
- `push`: after committing, push to the current remote branch
- `push -v` / `push --verify`: push with confirmation

## Workflow

1. **Safety**: abort if _Unmerged paths_ above is non-empty; if the branch is `main`/`master`, warn the user and wait for confirmation before committing.
2. **Read state**: the snapshot above covers status, staged/unstaged summaries, and renames. Pull the full `git diff` / `git diff --cached` only for the files you need to reason about.
3. **Group**: split changes into logical commits. See [`references/grouping-guide.md`](references/grouping-guide.md) for the decision tree, scope derivation, and type disambiguation.
4. **Verify** (if `-v`/`--dry-run`/`--amend`): show plan. `--dry-run` exits here.
5. **Execute**: for each group, `git add <files>` then `git commit -m "<message>"` (or `git commit --amend` for amend).
6. **Push** (if `push`): `git push origin HEAD`. On failure, classify (auth / branch protection / diverged / other) and suggest a next step.

Only `git push origin HEAD` is pre-approved. Any other push form (a different remote, a different refspec, `--force`) prompts for permission.

## Staging model

Grouping covers _everything_ in the working tree (already staged, unstaged tracked, and untracked):

- **Already staged**: respect the user's intent. Commit staged files first (their own group) unless they clearly belong with something unstaged.
- **Unstaged tracked**: auto-stage into the group they belong to.
- **Untracked**: attach to a related tracked group if the new file supports one; otherwise give it its own commit.

## Grouping, in one paragraph

Each group must revert on its own and leave the tree in a working state. If it does not, merge or split groups until each stands alone. Prefer more commits over fewer. Group by feature, then scope, then type, then nature. Avoid intermediate commits that do not compile.

Decision tree, scope derivation, type disambiguation, and the definition of each grouping axis: [`references/grouping-guide.md`](references/grouping-guide.md). Worked scenarios: [`references/examples.md`](references/examples.md).

## Commit message format

```text
<type>(<scope>): <description>
```

### Types

`feat` (new feature) · `fix` (bug fix) · `refactor` (restructure, no behavior change) · `chore` (maintenance/deps/config) · `docs` (documentation) · `test` (tests) · `style` (formatting) · `perf` (performance)

### Rules

- Subject ≤ 72 chars, imperative mood, no trailing period.
- Body only to explain **why** when non-obvious. Skip bodies for typos, deps, trivial changes. Do not repeat the subject in the body.

### Examples

```text
feat(auth): add JWT refresh token rotation
fix(api): handle null response from payment provider
refactor(utils): extract date formatting helpers
chore: upgrade typescript to 5.4
test(cart): add edge cases for discount calculation
```

## Pre-commit hooks

Hooks (prettier, eslint, biome, lint-staged, etc.) run on each `git commit`.

- **Hook modifies files, commit succeeds**: the modifications are already included in the commit. Nothing to do.
- **Hook modifies files, commit fails** (common with formatters that exit non-zero when they touch files): the commit did _not_ happen. Do NOT `--amend`: the failed run created no new commit, so `--amend` would fold these changes into the previous group's commit. Re-stage the affected files (`git add <paths>`) and commit again.
- **Hook rejects unrelated to formatting**: fix the underlying issue, don't bypass with `--no-verify`.

## Edge cases

| Situation | Action |
| --- | --- |
| Conflicts in working tree | Abort; ask user to resolve first. |
| On `main`/`master` | Warn and wait for confirmation before committing. |
| File renames | `git diff --stat` detects them; group rename with related import-path updates. |
| Binary files | Group with the feature that uses them. Don't try to describe binary diffs. |
| Deletions replacing code | Treat delete + new file as one logical refactor commit. |
| Generated artifacts (`coverage/`, `dist/`, lockfile-only churn) | Give them their own `chore` commit and note that they may belong in `.gitignore` instead. |
| Empty diff after staging | Changes were already committed. Stop and report. |
| `--amend` of a pushed commit | Warn that it rewrites published history and needs a force push; amend only after the user confirms. On a shared branch, recommend a new commit. |

Worked scenarios, including `/commit` and `/commit -v` interactions: [`references/examples.md`](references/examples.md).
