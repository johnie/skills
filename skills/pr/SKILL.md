---
name: pr
description: Create, update, and review GitHub PRs. Commands: create [-v] [--draft], update [-v], review <number|url>. Generates structured PR bodies with conditional sections (Testing, Deployment, Screenshots). Requires gh CLI.
---

## Commands

- `create` - Create a new PR with structured template
- `create -v` - Show draft PR before creating, ask for confirmation
- `create --draft` - Create as draft PR (work in progress)
- `update` - Update existing PR description after new commits
- `update -v` - Show changes before updating, ask for confirmation
- `review <pr>` - Review a PR (number or URL), output analysis to terminal

## Workflow: create

1. **Safety check**: Verify current branch is not main/master. Abort if so.

2. **Push branch**: If no upstream: `git push -u origin HEAD`. Otherwise verify up to date.

3. **Gather information**:
   - Detect base branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
   - Get commits: `git log origin/<base>..HEAD --oneline`
   - Get full diff: `git diff origin/<base>...HEAD`
   - Get branch name for context

4. **Generate PR content**:
   - **Title**: Derive from branch name or primary commit. Use conventional commit format if present. Keep concise.
   - **Body**: Use the template from `references/templates.md`
     - Fill What/Why/How/Changes sections (always include all four)
     - Conditional sections -- include ONLY if criteria met, omit entirely otherwise:
       - **Testing** -> test files changed OR manual testing steps needed
       - **Deployment** -> migrations, config, env vars, feature flags, CI changes
       - **Screenshots** -> UI component files modified (tsx/jsx/vue/svelte/css)
     - Never include a section header with placeholder text

5. **Confirmation** (if `-v` flag):
   - Display the draft title and body
   - Ask: "Create PR with this content? (yes/no)"

6. **Execute**:
   ```bash
   gh pr create --title "Title here" --body "$(cat <<'EOF'
   Body here
   EOF
   )"
   ```
   Add `--draft` flag if `--draft` was specified.

7. **Return**: Output the PR URL from gh CLI response.

## Workflow: update

1. **Get current PR**:
   ```bash
   gh pr view --json number,title,body,headRefName
   ```
   Abort if no PR exists for current branch.

2. **Gather information**:
   - Detect base branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
   - Get all commits: `git log origin/<base>..HEAD --oneline`
   - Get full diff: `git diff origin/<base>...HEAD`

3. **Parse existing body**: Extract each section by header.

4. **Regenerate sections**:
   - **What/How/Changes**: Regenerate from full diff and all commits
   - **Why**: Preserve as-is (motivation rarely changes)
   - **Conditional sections** (Testing/Deployment/Screenshots): Preserve exactly as-is if present. Do not add new conditional sections during update.

5. **Confirmation** (if `-v` flag):
   - Show diff of old vs new for What/How/Changes sections
   - Ask: "Update PR with these changes? (yes/no)"

6. **Execute**:
   ```bash
   gh pr edit <number> --body "$(cat <<'EOF'
   Updated body here
   EOF
   )"
   ```

## Workflow: review

1. **Fetch PR data**:
   - Accept PR number or full GitHub URL (extract number from URL if needed)
   ```bash
   gh pr view <pr> --json title,body,files,commits,additions,deletions
   gh pr diff <pr>
   ```

2. **Analyze**:
   - **Structure**: Is the PR focused? Should it be split?
   - **Code quality**: Clean, maintainable changes?
   - **Testing**: Tests present and covering changes?
   - **Security**: Potential vulnerabilities or unsafe patterns?
   - **Performance**: Obvious performance implications?
   - **Conventional commits**: Do commits follow good practices?

3. **Size guidance**: <200 lines small, 200-500 medium, 500+ large (suggest splitting)

4. **Output to terminal** using the review template from `references/templates.md`. Categorize each suggestion as: `[blocker]`, `[should-fix]`, or `[nit]`.

   Output review to terminal only. Do NOT post as PR comment automatically.
