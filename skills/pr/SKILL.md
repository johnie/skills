---
name: pr
description: "Create, update, or review GitHub pull requests via `gh` CLI. Use when opening a PR from the current branch, refreshing an existing PR's body after new commits, or doing a structured review of somebody's PR by number or URL. Commands: create [-v] [--draft], update [-v], review <number|url>."
allowed-tools:
  - Bash
---

# PR

Create, update, and review GitHub PRs using `gh`. Each command is a separate workflow — pick the one that matches the user's intent.

## When to use

| User says… | Command |
|---|---|
| "Open a PR", "make a PR", "ship this to review" | `create` |
| "Update the PR description", "refresh the PR body", "add the latest commits to the PR" | `update` |
| "Review PR #123", "look at this PR", "can you review <url>" | `review` |

## When NOT to use

- Merging / closing / reopening a PR — use `gh pr merge` / `gh pr close` directly.
- Drive-by commenting on an existing PR — use `gh pr comment`.
- Posting review output to GitHub. `review` writes to the terminal for the user to decide what to do with. Only post to GitHub if the user explicitly asks.

## Commands

| Command | Purpose |
|---|---|
| `create` | Create a PR with a structured body from commits on the branch. |
| `create -v` | Show the draft, ask y/n before running `gh pr create`. |
| `create --draft` | Create as draft (work-in-progress). |
| `update` | Regenerate the PR body of the current branch's PR to reflect new commits. |
| `update -v` | Diff old vs new body, confirm before writing. |
| `review <pr>` | Fetch a PR by number or URL and output a structured review to the terminal. |

## Workflow: create

1. **Safety**: current branch must not be `main`/`master`. Abort otherwise — you don't open PRs from the trunk.
2. **Push**: if no upstream, `git push -u origin HEAD`. Otherwise verify local ≤ remote.
3. **Gather**:
   - Base branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
   - Commits: `git log origin/<base>..HEAD --oneline`
   - Diff: `git diff origin/<base>...HEAD`
4. **Generate**:
   - **Title**: derive from the primary commit or branch name, reusing conventional-commit `type(scope): description` when present. If [`/commit`](../commit/SKILL.md) produced the commits, the title comes for free from the leading commit's subject.
   - **Body**: fill the template in [`references/templates.md`](references/templates.md). What/Why/How/Changes always. Conditional sections by the table below.
5. **Confirm** (if `-v`): print draft title + body, ask `yes/no`.
6. **Execute**:
   ```bash
   gh pr create --title "Title" --body "$(cat <<'EOF'
   Body
   EOF
   )"
   ```
   Add `--draft` if `--draft` was passed.
7. **Return**: the PR URL from `gh`'s output.

### Conditional sections

Include a conditional section only when the trigger below is met. Empty placeholder sections are worse than no section — they train reviewers to skim.

| Section | Include when the diff includes… |
|---|---|
| `## Testing` | test files (`*.test.*`, `*.spec.*`, `__tests__/`) OR the change needs manual verification (UI, side effects) |
| `## Deployment` | DB migrations, config, env vars, feature flags, CI workflow changes, infra |
| `## Screenshots` | UI files: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.css`, design assets |

## Workflow: update

1. **Locate PR**: `gh pr view --json number,title,body,headRefName`. Abort if no PR exists for the current branch.
2. **Gather** (same as create): base branch, commits, full diff.
3. **Parse body**: split the existing body into sections by `## ` header.
4. **Regenerate**:
   - **What / How / Changes**: regenerate from the commits + diff. These are descriptive — they should always reflect the current state of the branch.
   - **Why**: preserve verbatim. Motivation is set when the PR is opened, comes from a ticket/conversation the branch has no visibility into, and reviewers may have refined it in-place. Regenerating from commits would destroy that context.
   - **Conditional sections** (Testing / Deployment / Screenshots): preserve as-is. Don't auto-add new ones — they often contain reviewer-specific checkboxes and deployment notes that aren't derivable from the diff.
5. **Confirm** (if `-v`): show a side-by-side diff of What/How/Changes. Ask yes/no.
6. **Execute**:
   ```bash
   gh pr edit <number> --body "$(cat <<'EOF'
   New body
   EOF
   )"
   ```

## Workflow: review

1. **Fetch**: accept a number or URL. Extract the number if given a URL.
   ```bash
   gh pr view <pr> --json title,body,files,commits,additions,deletions
   gh pr diff <pr>
   ```
2. **Analyze**: for each dimension, form an opinion backed by the diff.
   - **Scope** — one logical change, or several that should be split?
   - **Code quality** — readability, naming, duplication, error handling.
   - **Testing** — covered? missing cases? tests actually exercise the new code?
   - **Security** — injection, auth, secrets, input validation, unsafe deserialization.
   - **Performance** — hot-path allocations, N+1 queries, blocking I/O.
   - **Commit hygiene** — conventional commits? Atomic?
3. **Size signal**: <200 lines → small, 200–500 → medium, 500+ → suggest splitting.
4. **Output** to the terminal using the "Review Output Template" in [`references/templates.md`](references/templates.md). Tag each suggestion as `[blocker]` (must fix before merge), `[should-fix]` (address or justify), or `[nit]` (stylistic preference).
5. **Do not** post the review as a PR comment automatically. The user decides whether to share it.

## Handoff from `/commit`

`/pr create` assumes the branch's commits follow the conventional-commit format produced by [`/commit`](../commit/SKILL.md). When that's the case:
- PR title = primary commit's `type(scope): description`.
- `## What` bullet list mirrors the commit subjects.
- `## How` groups commits by scope.

If the branch has messy or non-conventional commits, offer to run `/commit --amend` or reword before opening the PR rather than papering over it in the body.
