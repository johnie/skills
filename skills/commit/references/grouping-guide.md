# Commit Grouping Guide

Decision tree and examples for splitting changes into atomic commits.

## Decision Tree

```
Start: Look at all changed files
  |
  +--> Only 1 file changed?
  |     |
  |     +--> Single logical change? --> 1 commit
  |     +--> Multiple logical changes (e.g., refactor + feature)? --> Consider splitting hunks
  |
  +--> Multiple files changed?
        |
        +--> Group by: feature/scope/type (in priority order)
        |
        +--> For each group, ask:
              - Do these files change for the same reason?
              - Would reverting one file but not the others make sense?
              - If yes to reverting separately --> split into separate commits
```

## Scope Determination

Derive scope from file paths:

| Path pattern | Scope |
|---|---|
| `src/routes/auth.ts` | `auth` |
| `src/components/Button.tsx` | `button` or `ui` |
| `lib/db/migrations/...` | `db` |
| `tests/cart.test.ts` | `cart` |
| `package.json`, `tsconfig.json` | _(no scope)_ or `deps`/`config` |
| `src/utils/date.ts` | `utils` or `date` |
| `.github/workflows/ci.yml` | `ci` |

**When multiple files share a scope**: Use the common parent. E.g., `src/auth/login.ts` + `src/auth/register.ts` --> scope is `auth`.

**When files span multiple scopes but serve one feature**: Use the feature name. E.g., route + component + test all for "user preferences" --> scope is `preferences`.

## Type Disambiguation

When the type isn't obvious:

| Situation | Type | Reasoning |
|---|---|---|
| Rename variable for clarity, no behavior change | `refactor` | Restructuring code |
| Rename variable AND fix a bug in same file | Split into `fix` + `refactor` | Different reasons for change |
| Move code to new file, no changes | `refactor` | Restructuring only |
| Update formatting/whitespace only | `style` | No logic change |
| Update `.gitignore`, CI config, linter config | `chore` | Tooling/maintenance |
| Update deps in lockfile only | `chore` | Maintenance |
| Add dep + use it in feature code | `feat` (bundle together) | Dep serves the feature |
| Add dep for dev tooling | `chore` | Maintenance |
| Improve perf without changing behavior | `perf` | Performance-specific |
| Fix types without behavior change | `refactor` or `fix` | `fix` if types were wrong, `refactor` if improving |

## Good vs Bad Grouping

### Scenario: 6 files changed

Files:
1. `src/routes/users.ts` - Add avatar upload endpoint
2. `src/utils/image.ts` - New image resize utility
3. `src/routes/users.test.ts` - Tests for avatar upload
4. `package.json` - Add `sharp` dependency
5. `src/config.ts` - Fix typo in database URL variable name
6. `README.md` - Update API docs with avatar endpoint

**Good grouping (4 commits):**

```
feat(users): add avatar upload endpoint
  - src/routes/users.ts, src/utils/image.ts, package.json

test(users): add avatar upload tests
  - src/routes/users.test.ts

fix(config): fix typo in database URL variable name
  - src/config.ts

docs: update API docs with avatar endpoint
  - README.md
```

Rationale: Feature + its utility + its dep are one logical unit. Tests separated (different type). Config fix is unrelated. Docs separated (different type).

**Bad grouping (2 commits):**

```
feat(users): add avatar upload with tests and docs
  - src/routes/users.ts, src/utils/image.ts, src/routes/users.test.ts, package.json, README.md

fix(config): fix typo
  - src/config.ts
```

Problem: Lumps feature, tests, and docs together. Can't revert tests without reverting feature. Commit message tries to describe too much.

**Also bad (6 commits - too granular):**

```
chore: add sharp dependency          # package.json
feat(utils): add image resize        # src/utils/image.ts
feat(users): add avatar endpoint     # src/routes/users.ts
test(users): add avatar tests        # src/routes/users.test.ts
fix(config): fix typo                # src/config.ts
docs: update API docs                # README.md
```

Problem: The dependency and utility only exist to serve the feature. Splitting them means intermediate commits are broken (utility without its dep, endpoint without its utility).

## Untracked Files

New (untracked) files need special handling:

| Situation | Action |
|---|---|
| New file is part of a feature (e.g., new component + modified route) | Group with related tracked changes |
| New standalone file (e.g., new config, new utility) | Own commit |
| New test file for existing modified code | Separate `test()` commit |
| New file + its companion test file | Two commits: `feat()` + `test()` |

## File Rename / Move Detection

- `git diff` shows renames as delete + add. Check `git diff --stat` for rename detection (shows `old -> new`).
- A rename with no content change --> `refactor(<scope>): rename/move <description>`
- A rename with content changes --> decide if the rename and content change are one logical unit or should be split

## Binary Files

- Binary files (images, fonts, compiled assets) group with the feature that uses them
- Commit message should mention what the binary is for: `feat(ui): add logo assets for header`
- Don't try to describe binary diffs in commit body
