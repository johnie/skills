---
name: commit
description: Create semantically correct, granular git commits by analyzing staged and unstaged changes. Use when committing code, splitting changes into atomic commits, or preparing commits before a PR.
allowed-tools:
  - Bash
---

# Commit Skill

Create semantically correct, granular git commits by analyzing staged and unstaged changes.

**Auto-staging behavior:**
- **Already staged files**: Respected as-is. Commit them first (as their own group) unless they logically belong with unstaged changes.
- **Unstaged tracked files**: Auto-staged and grouped with related changes.
- **Untracked files**: Grouped with related tracked changes if applicable; otherwise offered separately.
- Use `--dry-run` to preview the plan before any staging/committing.

## Model

Use `haiku` for all operations unless complex reasoning is required.

## Arguments

- `(none)`: Auto-commit without confirmation
- `-v` or `--verify`: Show plan and ask for confirmation before committing
- `--dry-run`: Show commit plan without executing
- `--amend`: Amend the last commit only. Shows current last commit contents. Always requires `-v` verification for safety.
- `push`: After committing, push to current remote branch
- `push -v` / `push --verify`: Push with verification prompt

## Workflow

1. Check for merge conflicts - abort if found
2. Check current branch - warn if committing to main/master
3. Run `git status` and `git diff` to understand current changes
4. Run `git diff --cached` to see already staged changes
5. Analyze changes and group them logically
6. Create atomic commits with clear messages
7. If `push` argument: push to remote

## Grouping Strategy

Prefer **more commits over fewer**. Group by:

- **Feature/functionality**: Related changes that implement one thing
- **File type**: Config changes, test files, types, etc.
- **Scope**: Single module/component changes together
- **Nature**: Refactors separate from features separate from fixes

Never combine unrelated changes. When in doubt, split.

See `references/grouping-guide.md` for the full decision tree, scope derivation, type disambiguation, and good/bad grouping examples.

## Commit Message Format

```text
<type>(<scope>): <description>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `chore`: Maintenance, deps, config
- `docs`: Documentation only
- `test`: Adding/updating tests
- `style`: Formatting, whitespace
- `perf`: Performance improvement

### Rules

- Subject line: max 72 chars, imperative mood, no period
- Body: only if necessary to explain **why**, not **what**
- No body for obvious changes (typos, simple additions, config tweaks)

### Good Examples

```text
feat(auth): add JWT refresh token rotation
fix(api): handle null response from payment provider
refactor(utils): extract date formatting helpers
chore: upgrade typescript to 5.4
test(cart): add edge cases for discount calculation
```

## Execution Steps

1. **Check safety**: Detect conflicts, warn on protected branches (main/master)
2. **Analyze**: `git diff --stat` and `git diff` for full context
3. **Plan**: Determine commit groups with files and messages
4. **Verify** (if `-v`/`--verify`/`--dry-run`/`--amend`): Show plan, wait for confirmation
   - `--dry-run`: Exit after showing plan
   - `--amend`: Modify last commit instead of creating new
5. **Execute**: For each commit:
   ```bash
   git add <files>
   git commit -m "<message>"
   # or for --amend:
   git add <files>
   git commit --amend -m "<message>"
   ```
6. **Push** (only if `push` argument): Run `git push origin HEAD`
   - On failure, suggest action based on error:
     - **Authentication error**: Check credentials / SSH keys
     - **Branch protection**: Create PR instead of direct push
     - **Diverged branches**: Suggest `git pull --rebase` then retry
     - **Other errors**: Show error, stop (user handles manually)

## Example Session

### Auto-commit (no flags)

```text
User: /commit

Claude: Analyzing 7 changed files...

Grouping rationale:
- preferences route + types are one feature
- test file is a separate commit (different type)
- zod dep was added to support preferences validation -> groups with feature
- package-lock.json always goes with package.json

✓ feat(api): add user preferences endpoint
  - src/routes/preferences.ts, src/types/preferences.ts, package.json, bun.lock

✓ test(api): add preferences endpoint tests
  - tests/preferences.test.ts

2 commits created.
```

### With `-v` (verification)

```text
User: /commit -v

Claude: Analyzing 4 changed files...

Commit plan:

1. fix(auth): handle expired refresh tokens gracefully
   - src/auth/refresh.ts, src/auth/errors.ts

2. chore(deps): upgrade vitest to 2.0
   - package.json, bun.lock

Proceed? (y/n/edit)

User: y

✓ fix(auth): handle expired refresh tokens gracefully
✓ chore(deps): upgrade vitest to 2.0

2 commits created.
```

**With `--dry-run`**: Same as `-v` but exits after showing plan without executing.

**With `--amend -v`**: Shows contents of last commit, proposed amended state, asks for confirmation.

**With `push`**: Adds "Pushing to origin/feature-branch... Pushed." at end.

See `references/examples.md` for more scenarios (simple, medium, complex, edge cases, anti-patterns).

## Pre-commit Hooks

Pre-commit hooks (e.g., ultracite, prettier, eslint) will run on each `git commit`. If a hook modifies files, those modifications are automatically included in the commit. If a hook fails, the commit is aborted -- fix the issue and retry.

## Edge Cases

- **Protected branches**: Warn if committing directly to main/master
- **Merge conflicts**: Abort and instruct user to resolve first
- **Single file**: Still analyze if it contains multiple logical changes
- **Large refactors**: May warrant a single commit if truly atomic
- **Mixed changes**: Always split features from fixes from refactors
- **Already staged files**: Respect existing staging (see auto-staging behavior above)
- **File renames/moves**: Check `git diff --stat` for rename detection. Group rename with import path updates.
- **Binary files**: Group with the feature that uses them. Don't describe binary diffs.
- **Untracked files**: Group with related tracked changes; standalone untracked files get their own commit
- **Empty diff after staging**: Can happen if changes were already committed. Check `git log` before proceeding.
