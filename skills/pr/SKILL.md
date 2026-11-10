---
name: pr
description: "Create, update, or review GitHub pull requests via `gh` CLI. Use when opening a PR from the current branch. Use when refreshing an existing PR's body after new commits. Use for a structured review of somebody's PR by number or URL."
when_to_use: "Also applies to drafting a PR as work in progress and to previewing a PR body before it is written. Skip for merging, closing, or reopening a PR (use `gh pr merge` or `gh pr close` directly). Skip for drive-by comments on an existing PR (use `gh pr comment`)."
argument-hint: "create|update|review [pr] [-v] [--draft]"
allowed-tools:
  - Bash(gh pr view *)
  - Bash(gh pr diff *)
  - Bash(gh pr create *)
  - Bash(gh pr edit *)
  - Bash(gh repo view *)
  - Bash(git log *)
  - Bash(git diff *)
  - Bash(git branch *)
  - Bash(git push -u origin HEAD)
---

# PR

Create, update, and review GitHub PRs using `gh`. Each command is a separate workflow. Pick the one that matches the user's intent. Review output goes to the terminal; post it to GitHub only if the user explicitly asks.

Requested command and target: `$ARGUMENTS`. If it is blank or still shows the literal placeholder, infer the command from the user's wording using the table below.

## Choosing a command

| User says… | Command |
| --- | --- |
| "Open a PR", "make a PR", "ship this to review" | `create` |
| "Update the PR description", "refresh the PR body", "add the latest commits to the PR" | `update` |
| "Review PR #123", "look at this PR", "can you review <url>" | `review` |

If no command is named and the branch has no PR, choose `create`. If a PR already exists, ask before assuming `update` over `review`.

## Commands

| Command | Behavior |
| --- | --- |
| `create [-v] [--draft]` | `-v` shows the draft and asks y/n before `gh pr create`. `--draft` opens a draft PR. |
| `update [-v]` | `-v` diffs old vs new body and confirms before writing. |
| `review <pr>` | Takes a PR number or URL. |

## Workflow: create

1. **Safety**: current branch must not be `main`/`master`. Abort otherwise. You don't open PRs from the trunk.
2. **Push**: if no upstream, `git push -u origin HEAD`. Otherwise the upstream branch must contain every local commit. If the local branch is ahead, push before creating.
3. **Gather**:
   - Base branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
   - Commits: `git log origin/<base>..HEAD --oneline`
   - Diff: `git diff origin/<base>...HEAD`
4. **Generate**:
   - **Conventional commits** (`type(scope): description`, as produced by a commit workflow like `/commit`): the title reuses the primary commit's subject. The `## What` bullets mirror the commit subjects. `## How` groups commits by scope.
   - **Other commits**: derive the title from the diff and branch name. If the commit subjects do not follow the format, offer to reword them (for example with `/commit --amend`) before opening the PR. Do not reword without a yes.
   - **Body**: fill the template in [`references/templates.md`](references/templates.md). What/Why/How/Changes always. Add a conditional section only when the diff meets its trigger in the [conditional sections table](references/templates.md#standard-pr-template).
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

## Workflow: update

1. **Locate PR**: `gh pr view --json number,title,body,headRefName`. Abort if no PR exists for the current branch.
2. **Gather** (same as create): base branch, commits, full diff.
3. **Parse body**: split the existing body into sections by `## ` header.
4. **Regenerate**:
   - **What / How / Changes**: regenerate from the commits + diff.
   - **Why**: preserve verbatim. It may hold ticket context or reviewer edits that the diff does not show.
   - **Conditional sections** (Testing / Deployment / Screenshots): preserve existing ones as-is. Don't auto-add new ones. Existing sections may hold reviewer checkboxes and deployment notes that the diff does not show.
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
   - **Scope**: one logical change, or several that should be split?
   - **Code quality**: readability, naming, duplication, error handling.
   - **Testing**: covered? missing cases? tests actually exercise the new code?
   - **Security**: injection, auth, secrets, input validation, unsafe deserialization.
   - **Performance**: hot-path allocations, N+1 queries, blocking I/O.
   - **Commit hygiene**: conventional commits? Atomic?
3. **Size signal**: <200 lines → small, 200–500 → medium, 500+ → suggest splitting.
4. **Output** to the terminal using the [Review Output Template](references/templates.md#review-output-template). Tag each suggestion as `[blocker]` (must fix before merge), `[should-fix]` (address or justify), or `[nit]` (stylistic preference). Do not post it as a PR comment unless the user asks.
