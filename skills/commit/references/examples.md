# Commit Skill Examples

Real-world scenarios showing the full analysis-to-output process.

## Simple: Config Update (2 files, 1 commit)

**`git status` output:**

```text
 M tsconfig.json
 M biome.json
```

**`git diff` summary:** Both files update compiler/linter strictness settings.

**Analysis:** Same reason for change (tighten strictness), same type (chore), closely related config files.

**Result:**

```text
chore: enable strict mode in tsconfig and biome
  - tsconfig.json, biome.json
```

---

## Medium: 2 Features (5 files, 4 commits)

**`git status` output:**

```text
 M src/routes/auth.ts
 M src/routes/auth.test.ts
 M src/middleware/rate-limit.ts
 M src/middleware/rate-limit.test.ts
 M package.json
```

**`git diff` summary:**

- `auth.ts`: Add password reset endpoint
- `auth.test.ts`: Tests for password reset
- `rate-limit.ts`: Add sliding window algorithm
- `rate-limit.test.ts`: Tests for sliding window
- `package.json`: Add `ioredis` dep (used by rate-limit)

**Analysis:**

- Password reset (auth.ts) and rate limiting (rate-limit.ts) are unrelated features
- `ioredis` was added for the rate limiter -> groups with rate-limit
- Tests split by feature so each feature + its tests can be reverted as a pair

**Result:**

```text
1. feat(auth): add password reset endpoint
   - src/routes/auth.ts

2. test(auth): add password reset tests
   - src/routes/auth.test.ts

3. feat(middleware): add sliding window rate limiting
   - src/middleware/rate-limit.ts, package.json

4. test(middleware): add sliding window rate limit tests
   - src/middleware/rate-limit.test.ts
```

Combining both test files into one `test:` commit is acceptable only when the tests share fixtures or helpers that would leave one commit broken without the other. Here they don't, so a combined test commit would tie the two features' revert paths together.

---

## Complex: Mixed Changes (12 files, 6 commits)

**`git status` output:**

```text
 M src/routes/users.ts
 M src/routes/users.test.ts
 M src/services/email.ts
 M src/services/email.test.ts
 M src/utils/validators.ts
 M src/types/user.ts
 M src/db/migrations/20240115_add_email_verified.sql
 M package.json
 M pnpm-lock.yaml
 D src/utils/old-validators.ts
 M .env.example
?? src/services/notification.ts
```

**`git diff` summary:**

- `users.ts`: Add email verification flow
- `users.test.ts`: Tests for email verification
- `email.ts`: Refactor to use template engine
- `email.test.ts`: Update email tests for new template API
- `validators.ts`: Add email format validator (used by users.ts)
- `old-validators.ts`: Deleted (replaced by validators.ts)
- `types/user.ts`: Add `emailVerified` field
- `migration`: Add `email_verified` column
- `package.json` + `pnpm-lock.yaml`: Add `handlebars` (for email templates)
- `.env.example`: Add `SMTP_HOST` variable
- `notification.ts`: New file, standalone notification service (untracked)

**Analysis:**

1. Email verification is a feature spanning users.ts + validators.ts + types + migration
2. Old validators deletion is part of the validator refactor
3. Email service refactor is separate from the feature (different reason: modernize templates)
4. handlebars dep serves the email refactor
5. notification.ts is unrelated new code
6. .env.example change relates to email service

**Result:**

```text
1. feat(users): add email verification flow
   - src/routes/users.ts, src/utils/validators.ts, src/types/user.ts,
     src/db/migrations/20240115_add_email_verified.sql

2. refactor(utils): replace old-validators with validators module
   - src/utils/old-validators.ts (deleted)

3. refactor(email): migrate email service to handlebars templates
   - src/services/email.ts, package.json, pnpm-lock.yaml, .env.example

4. test(users): add email verification tests
   - src/routes/users.test.ts

5. test(email): update email service tests for template API
   - src/services/email.test.ts

6. feat: add notification service
   - src/services/notification.ts
```

---

## Edge Cases

### Test Files Alongside Feature Files

General rule: **separate test commits from feature commits** unless the test is trivially small (1-2 lines added to existing test).

---

## Anti-patterns

### Don't: One giant commit

```text
feat: add email verification, refactor email service, add notifications
  - (all 12 files)
```

Why bad: Can't revert email refactor without losing verification feature. Message is vague.

### Don't: Commit by file

```text
1. feat(users): update users.ts
2. feat(validators): update validators.ts
3. chore(types): update user.ts
...
```

Why bad: Individual commits are meaningless. "update users.ts" says nothing. Intermediate states may not compile.

### Don't: Group by directory

```text
1. chore(src/routes): update route files
2. chore(src/services): update service files
3. chore(src/utils): update util files
```

Why bad: Directory structure doesn't reflect logical grouping. Unrelated changes lumped together.

### Don't: Describe the diff, describe the intent

```text
BAD:  fix(api): change status code from 400 to 422
GOOD: fix(api): return 422 for validation errors instead of 400
```
