# PR Templates and Guidelines

This file defines the PR body template structure and provides guidelines for filling each section.

## Standard PR Template

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

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases considered

## Deployment

[Any deployment considerations:
- Database migrations?
- Feature flags needed?
- Configuration changes?
- Rollback plan?
Leave empty if standard deployment]

## Screenshots

[If applicable, add screenshots or screen recordings for UI changes]
[Leave empty if no visual changes]
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

### Testing
- **Purpose**: Checklist for test coverage
- **Format**: Markdown checkboxes
- **Content**: User fills this in before/during review
- **Note**: Leave as unchecked template - user will check off

### Deployment
- **Purpose**: Alert to special deployment needs
- **When to fill**: Only if there are deployment considerations
- **Content**: Migrations, config changes, feature flags, dependencies
- **Default**: Leave empty for standard deployments

### Screenshots
- **Purpose**: Visual proof for UI changes
- **When to fill**: Any user-facing visual changes
- **Format**: Drag-and-drop images or paste links
- **Default**: Leave empty for backend-only changes

## Filling the Template

### For `create` command:
1. Generate What/Why/How/Changes based on commits and diff
2. Make educated guesses about Why if not obvious from commits
3. Leave Testing/Deployment/Screenshots as template for user to fill

### For `update` command:
1. Regenerate What/How/Changes based on ALL commits (not just new ones)
2. Preserve Why section (usually doesn't change)
3. **Never modify** Testing/Deployment/Screenshots sections (user-edited)

## Template Variations

### Small Bug Fix
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
- Add test case for null avatar

## Testing
- [ ] Unit tests added
- [ ] Manual testing completed
- [ ] Edge cases considered
```

### Feature Addition
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
```

### Refactoring
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
- Update all tests to mock fetch

## Testing
- [ ] All existing tests pass
- [ ] Integration tests with real API
- [ ] Error scenarios tested
- [ ] Retry logic verified
```
