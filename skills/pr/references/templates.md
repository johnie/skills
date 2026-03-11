# PR Templates

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

## Review Output Template

```text
## Summary
[Brief overview of what the PR does]

## Size
[small/medium/large] - X files changed, +X/-X lines

## Highlights
- [Notable positive aspects]
- [Good patterns observed]

## Suggestions
- [blocker] [Description of blocking issue]
- [should-fix] [Description of recommended fix]
- [nit] [Minor style or preference suggestion]

## Questions
- [Clarifications needed]
- [Discussion points]
```

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
