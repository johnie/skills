---
name: commit
description: Split working-tree changes into atomic git commits with conventional-commit messages. Use whenever the user asks to commit, save work, stage files, break one messy diff into multiple logical commits, or prep a branch for a PR — including terse prompts like "commit this", "ship it", or "wrap up".
allowed-tools:
  - Bash
---

# Commit

Turn the current working tree into a set of atomic conventional-commit commits. Atomic = each commit captures one logical change that could be reverted on its own without breaking the rest.

## When to use

- "Commit this / these changes"
- "Break this up into commits / split these commits"
- "Prep this branch for review"
- The user staged nothing and has a mixed diff
- The user already staged some files and wants the rest committed sensibly

## When NOT to use

- User explicitly wants one commit and doesn't want splitting — just use `git commit` directly.
- Amending the last published commit on a shared branch — propose a new commit instead (destructive to upstream history).
- Rebasing or reordering existing commits — that's `git rebase`, not this skill.

## Arguments

- `(none)` — analyze, group, and commit without confirmation
- `-v` / `--verify` — show plan, wait for y/n/edit
- `--dry-run` — show plan, exit without committing
- `--amend` — amend the last commit only. Implies `-v` because amend is irreversible once pushed.
- `push` — after committing, push to the current remote branch
- `push -v` / `push --verify` — push with confirmation

## Workflow

1. **Safety**: check for merge conflicts (abort if found) and warn if on `main`/`master`.
2. **Read state**: `git status`, `git diff`, `git diff --cached`, `git diff --stat` (for rename detection).
3. **Group**: split changes into logical commits. See [`references/grouping-guide.md`](references/grouping-guide.md) for the decision tree, scope derivation, and type disambiguation.
4. **Verify** (if `-v`/`--dry-run`/`--amend`): show plan. `--dry-run` exits here.
5. **Execute**: for each group — `git add <files>` then `git commit -m "<message>"` (or `git commit --amend` for amend).
6. **Push** (if `push`): `git push origin HEAD`. On failure, classify (auth / branch protection / diverged / other) and suggest a next step.

## Staging model

Grouping happens over *everything* in the working tree — already-staged, unstaged-tracked, and untracked:

- **Already staged**: respect the user's intent. Commit staged files first (their own group) unless they clearly belong with something unstaged.
- **Unstaged tracked**: auto-stage into the group they belong to.
- **Untracked**: attach to a related tracked group if the new file supports one; otherwise give it its own commit.

Use `--dry-run` to preview which files will end up in which commit before anything stages.

## Grouping, in one paragraph

Prefer more commits over fewer. Group by (in priority order) feature → scope → type → nature. A good test: would reverting one group without the others leave the tree in a working state? If yes, that's an atomic group. If no, the groups are entangled — merge or split until each can stand alone. Intermediate commits that don't compile are a smell. Full rules and worked examples: [`references/grouping-guide.md`](references/grouping-guide.md), [`references/examples.md`](references/examples.md).

## Commit message format

```text
<type>(<scope>): <description>
```

### Types

`feat` (new feature) · `fix` (bug fix) · `refactor` (restructure, no behavior change) · `chore` (maintenance/deps/config) · `docs` (documentation) · `test` (tests) · `style` (formatting) · `perf` (performance)

### Rules

- Subject ≤ 72 chars, imperative mood, no trailing period.
- Body only to explain **why** when non-obvious. Skip bodies for typos, deps, trivial changes — the subject already carries the signal and bodies for trivia just rot.

### Examples

```text
feat(auth): add JWT refresh token rotation
fix(api): handle null response from payment provider
refactor(utils): extract date formatting helpers
chore: upgrade typescript to 5.4
test(cart): add edge cases for discount calculation
```

## Pre-commit hooks

Hooks (ultracite, prettier, eslint, etc.) run on each `git commit`.

- **Hook modifies files, commit succeeds**: the modifications are already included in the commit. Nothing to do.
- **Hook modifies files, commit fails** (common with formatters that exit non-zero when they touch files): the commit did *not* happen. Re-stage the affected files (`git add <paths>`) and commit again. Do NOT `--amend` — there's no prior commit to amend, and amending silently moves changes into the wrong group.
- **Hook rejects unrelated to formatting**: fix the underlying issue, don't bypass with `--no-verify`.

## Edge cases

Short list below. Tricky ones with full handling rules live in [`references/grouping-guide.md`](references/grouping-guide.md) and [`references/examples.md`](references/examples.md).

| Situation | Action |
|---|---|
| Conflicts in working tree | Abort; ask user to resolve first. |
| On `main`/`master` | Warn, require confirmation. |
| File renames | `git diff --stat` detects them; group rename with related import-path updates. |
| Binary files | Group with the feature that uses them. Don't try to describe binary diffs. |
| Deletions replacing code | Treat delete + new file as one logical refactor commit. |
| Empty diff after staging | Changes were already committed — stop and report. |
| `--amend` of a pushed commit | Refuse unless user confirms; force-push rewrites upstream history. |

## Example — auto-commit

```text
User: /commit

Claude: Analyzing 7 changed files...

Grouping rationale:
- preferences route + types are one feature
- test file is a separate commit (different type)
- zod was added to validate the feature -> groups with feature
- package-lock.json always goes with package.json

feat(api): add user preferences endpoint
  - src/routes/preferences.ts, src/types/preferences.ts, package.json, bun.lock

test(api): add preferences endpoint tests
  - tests/preferences.test.ts

2 commits created.
```

## Example — verify

```text
User: /commit -v

Claude: Commit plan:

1. fix(auth): handle expired refresh tokens gracefully
   - src/auth/refresh.ts, src/auth/errors.ts

2. chore(deps): upgrade vitest to 2.0
   - package.json, bun.lock

Proceed? (y/n/edit)
```

`--dry-run` stops after the plan. `--amend -v` shows the current last commit + the proposed amended state. `push` appends `Pushing to origin/<branch>... Pushed.`

See [`references/examples.md`](references/examples.md) for simple/medium/complex/anti-pattern scenarios.

## Handoff to `/pr`

When you create a PR afterwards, the `/pr` skill reads these commits to generate the PR title and body. Writing good, conventional commit messages here pays off there — the title reuses the primary commit's `type(scope): description`, and the body's What/How sections are built from the commit set.
