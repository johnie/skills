# Commit Skill

Create semantically correct, granular git commits by analyzing staged and unstaged changes.

## Model

Use `haiku` for all operations unless complex reasoning is required.

## Arguments

- `(none)`: Auto-commit without confirmation
- `-v` or `--verify`: Show plan and ask for confirmation before committing
- `push`: After committing, push to current remote branch
- `push -v` / `push --verify`: Push with verification prompt

## Workflow

1. Run `git status` and `git diff` to understand current changes
2. Run `git diff --cached` to see already staged changes
3. Analyze changes and group them logically
4. Create atomic commits with clear messages
5. If `push` argument: push to remote

## Grouping Strategy

Prefer **more commits over fewer**. Group by:

- **Feature/functionality**: Related changes that implement one thing
- **File type**: Config changes, test files, types, etc.
- **Scope**: Single module/component changes together
- **Nature**: Refactors separate from features separate from fixes

Never combine unrelated changes. When in doubt, split.

## Commit Message Format

```
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

```
feat(auth): add JWT refresh token rotation
fix(api): handle null response from payment provider
refactor(utils): extract date formatting helpers
chore: upgrade typescript to 5.4
test(cart): add edge cases for discount calculation
```

### Bad Examples

```
# Too vague
fix: fixed bug
update files

# Too verbose body for simple change
chore: update prettier config

This commit updates the prettier configuration file to use
the new settings that we discussed in the team meeting.
The changes include updating the print width and adding
trailing commas.
```

## Execution Steps

1. **Analyze**: `git diff --stat` and `git diff` for full context
2. **Plan**: Determine commit groups with files and messages
3. **Verify** (only if `-v`/`--verify`): Show plan, wait for confirmation
4. **Execute**: For each commit:
   ```bash
   git add <files>
   git commit -m "<message>"
   ```
5. **Push** (only if `push` argument): Run `git push origin HEAD`
   - On failure: show git error, stop (user handles manually)

## Example Sessions

### Default (auto-commit)
```
User: /commit

Claude: Analyzing 7 changed files...

✓ feat(api): add user preferences endpoint
  - src/routes/preferences.ts, src/types/preferences.ts

✓ test(api): add preferences endpoint tests
  - tests/preferences.test.ts

✓ chore: add zod dependency
  - package.json, package-lock.json

✓ fix(ui): correct button alignment on mobile
  - src/components/Button.css

4 commits created.
```

### With verification
```
User: /commit -v

Claude: Analyzing 7 changed files...

Proposed commits:

1. `feat(api): add user preferences endpoint`
   - src/routes/preferences.ts
   - src/types/preferences.ts

2. `test(api): add preferences endpoint tests`
   - tests/preferences.test.ts

3. `chore: add zod dependency`
   - package.json
   - package-lock.json

4. `fix(ui): correct button alignment on mobile`
   - src/components/Button.css

Proceed? (y/n/edit)
```

### With push
```
User: /commit push

Claude: Analyzing 3 changed files...

✓ fix(auth): handle expired token refresh
  - src/auth/token.ts

✓ test(auth): add token expiry tests
  - tests/auth.test.ts

2 commits created.

Pushing to origin/main...
✓ Pushed successfully.
```

## Edge Cases

- **Single file**: Still analyze if it contains multiple logical changes
- **Large refactors**: May warrant a single commit if truly atomic
- **Mixed changes**: Always split features from fixes from refactors
- **Already staged files**: Respect existing staging, offer to commit separately or include

## Commands

```bash
# Analysis
git status --short
git diff --stat
git diff --name-only
git diff <file>
git diff --cached
git log --oneline -5  # Context for message style

# Push
git push origin HEAD  # Push current branch to remote
```
