# PR Templates and Guidelines

This file defines the PR body template structure and provides guidelines for filling each section.

## Standard PR Template

**Required sections** (always include):

```markdown
## What

[Concise summary of what this PR does - 1-3 sentences]

## Why

[Context and motivation for these changes:
- What problem does this solve?
- Why is this change needed?
- Link to related issues if applicable]

## How

[Implementation approach and key technical decisions:
- What approach was taken?
- What are the main components/files changed?
- Any notable technical decisions or trade-offs?]

## Changes

- [Bullet point list of key changes]
- [Focus on user-facing or significant internal changes]
- [Group related changes together]
```

**Conditional sections** (include ONLY when applicable - omit entirely otherwise):

```markdown
## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases considered

## Deployment

[Deployment considerations:
- Database migrations
- Feature flags
- Configuration changes
- Environment variables
- Rollback plan]

## Screenshots

[Screenshots or screen recordings for UI changes]
```

## Section Guidelines

### What
- **Purpose**: Quick summary for reviewers to understand at a glance
- **Length**: 1-3 sentences
- **Content**: Focus on the end result, not implementation details
- **Examples**:
  - "Adds user authentication with JWT tokens"
  - "Fixes race condition in payment processing that caused duplicate charges"
  - "Refactors database queries to improve performance by 40%"

### Why
- **Purpose**: Provide context and justification
- **Length**: 2-5 sentences or bullet points
- **Content**: Business value, user impact, or technical necessity
- **Examples**:
  - "Users reported confusion when logging in with social providers. This adds clear visual feedback during the OAuth flow."
  - "Current queries scan entire tables, causing timeouts for large datasets. Optimizing now before user base grows."

### How
- **Purpose**: Explain the technical approach
- **Length**: 3-7 sentences or bullet points
- **Content**: Architecture decisions, key components, trade-offs
- **Examples**:
  - "Implements caching layer using Redis with 5-minute TTL. Cache is invalidated on writes. Chose Redis over in-memory for horizontal scaling."
  - "Extracts payment logic into separate service class. Adds idempotency keys to prevent duplicate charges. Uses database transactions for atomicity."

### Changes
- **Purpose**: Itemized list of modifications
- **Format**: Bullet points, grouped by area if large PR
- **Content**: File changes, new features, bug fixes, refactors
- **Examples**:
  - "Add `AuthService` class for token management"
  - "Update `LoginForm` component with loading states"
  - "Add `auth.test.ts` with 15 test cases"
  - "Remove deprecated `legacyAuth` function"

### Testing (CONDITIONAL)
- **Purpose**: Checklist for test coverage
- **Format**: Markdown checkboxes
- **Include when**:
  - `*.test.*` or `*.spec.*` files in diff
  - `__tests__/` or `tests/` directory changes
  - Test-related imports added to existing files
  - Changes require specific manual testing steps
- **Omit when**: No test files changed and no special testing needed
- **Note**: Leave checkboxes unchecked - user will check off

### Deployment (CONDITIONAL)
- **Purpose**: Alert to special deployment needs
- **Include when**:
  - Migration files (db/migrations, prisma/migrations, drizzle, etc.)
  - `.env*` files referenced or changed
  - Config files (docker-compose, k8s, terraform, Dockerfile)
  - `package.json` scripts changes
  - CI/CD workflow changes (.github/workflows, .gitlab-ci)
  - Infrastructure or environment variable changes
- **Omit when**: Standard code changes with no deployment considerations

### Screenshots (CONDITIONAL)
- **Purpose**: Visual proof for UI changes
- **Include when**:
  - `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` component files modified
  - CSS/SCSS/Tailwind/styled-components changes
  - Image assets added/modified
  - Any user-facing visual changes
- **Omit when**: Backend-only changes, non-visual code changes
- **Format**: Prompt user to add screenshots

## Filling the Template

### For `create` command:
1. Generate What/Why/How/Changes based on commits and diff (always include)
2. Make educated guesses about Why if not obvious from commits
3. **Evaluate conditional sections**:
   - Check diff for test files → include Testing if found
   - Check diff for migrations/config/env → include Deployment if found
   - Check diff for UI components/CSS → include Screenshots if found
4. **Omit sections entirely** if detection criteria not met - never include headers with placeholder text

### For `update` command:
1. Regenerate What/How/Changes based on ALL commits (not just new ones)
2. Preserve Why section (usually doesn't change)
3. **Preserve existing conditional sections** exactly as-is if present
4. **Do not add** new conditional sections during update

## Template Variations

### Small Bug Fix (no conditional sections needed)
```markdown
## What
Fixes null pointer exception in user profile page.

## Why
Users reported crashes when viewing profiles with missing avatar data.

## How
Adds null check before accessing avatar URL property. Returns default avatar if null.

## Changes
- Add null check in `ProfileCard.tsx`
- Add default avatar constant
```

Note: No Testing/Deployment/Screenshots sections - simple fix with no test files changed, no deployment needs, backend-only change.

### Bug Fix with Tests (includes Testing section)
```markdown
## What
Fixes null pointer exception in user profile page.

## Why
Users reported crashes when viewing profiles with missing avatar data.

## How
Adds null check before accessing avatar URL property. Returns default avatar if null.

## Changes
- Add null check in `ProfileCard.tsx`
- Add default avatar constant
- Add test case for null avatar scenario

## Testing
- [ ] Unit tests added
- [ ] Manual testing completed
- [ ] Edge cases considered
```

Note: Testing section included because test files were added/modified.

### Feature Addition with UI (includes Testing + Screenshots)
```markdown
## What
Adds dark mode support to the application.

## Why
User feedback indicates 40% prefer dark themes. Reduces eye strain for night usage.

## How
Implements theme context with CSS custom properties. Uses localStorage to persist preference. Adds toggle button in settings.

## Changes
- Add `ThemeProvider` context with light/dark modes
- Add CSS variables for colors in both themes
- Add theme toggle component in settings
- Update all components to use CSS variables
- Add tests for theme switching

## Testing
- [ ] Unit tests added
- [ ] Manual testing in both themes
- [ ] Verified localStorage persistence
- [ ] Tested theme toggle animation

## Screenshots
[Add before/after screenshots of light and dark modes]
```

Note: Testing included (test files added), Screenshots included (UI components modified). No Deployment section (no config/migration changes).

### Backend Refactoring (no conditional sections)
```markdown
## What
Refactors API client to use modern fetch API instead of deprecated request library.

## Why
`request` library is deprecated and has security vulnerabilities. Modern fetch API is built-in and more maintainable.

## How
Replaces all `request` calls with `fetch`. Adds error handling wrapper. Updates types to match fetch response format.

## Changes
- Remove `request` dependency from package.json
- Replace all API calls with fetch
- Add `apiClient` wrapper with error handling
- Update response type definitions
- Add retry logic for transient failures
```

Note: No Testing (existing tests updated but no new test files), no Screenshots (backend), no Deployment (standard code change).

### Database Migration (includes Deployment)
```markdown
## What
Adds user preferences table for storing notification settings.

## Why
Users need granular control over notification types. Current all-or-nothing approach causes unsubscribes.

## How
Creates new `user_preferences` table with foreign key to users. Adds migration with safe rollback. Updates user service to read/write preferences.

## Changes
- Add migration `20240115_add_user_preferences.sql`
- Add `UserPreferences` model and repository
- Update `UserService` with preference methods
- Add preference endpoints to API

## Deployment
- Run database migration before deploying: `bun run migrate`
- Migration is backwards compatible - no downtime required
- Rollback: `bun run migrate:rollback` removes table
```

Note: Deployment included (migration files detected). No Testing/Screenshots (no test files, backend-only).
