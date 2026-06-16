# WP-CLI: User Audit & Cleanup

Audit user accounts and clean up inactive or spam users.

## Discovery Phase

```bash
# List all users with roles
wp user list --fields=ID,user_login,user_email,roles,user_registered

# Count users by role
wp user list --role=subscriber --format=count
wp user list --role=administrator --format=count

# Find users with no role (usually spam)
wp user list --format=json | jq '.[] | select(.roles | length == 0)'

# Find users registered in specific timeframe
wp user list --format=json | \
  jq '.[] | select(.user_registered < "2023-01-01")'

# Check for users with no posts/comments
wp user list --format=json | \
  jq -r '.[].ID' | \
  xargs -I {} sh -c 'echo -n "User {}: "; wp post list --author={} --format=count'
```

## Cleanup Phase

```bash
# Create a fallback admin user for content reassignment
wp user create content-archive archive@example.com \
  --role=editor \
  --display_name="Archived Content"

ARCHIVE_USER=$(wp user get content-archive --field=ID)

# Delete spam users (no role, no content)
# CAUTION: Verify these are actually spam — print the list before deleting.
# --reassign moves their posts to the archive user so content isn't orphaned/deleted.
wp user list --format=json | \
  jq -r '.[] | select(.roles | length == 0) | .ID' | \
  xargs -I {} wp user delete {} --reassign=$ARCHIVE_USER --yes

# Bulk delete inactive subscribers (example: registered but never logged in)
# NOTE: Requires custom query or plugin to track last_login
```

## Role Management

```bash
# Demote users from administrator to editor
wp user set-role 15 editor

# Remove role but keep user
wp user remove-role 15 subscriber

# Add secondary role
wp user add-role 15 shop_manager

# Audit users with specific capability
wp user list --role=administrator --fields=ID,user_login,user_email
```

## Security Audit

```bash
# Check for users with weak usernames (admin, test, demo)
wp user list --field=user_login | grep -E '^(admin|test|demo|user)$'

# List users with admin email domains
wp user list --format=json | jq -r '.[] | select(.user_email | contains("@admin"))'
```

### Rotating administrator passwords — do it safely

Prefer `wp user reset-password`. It generates a strong password server-side and emails it to the
user, so the secret never touches your shell — unlike piping `openssl rand` into `--user_pass=...`,
which leaks the password into shell history and process listings (see the skill's antipatterns).

```bash
# Recommended: reset every administrator's password and email them the new one
wp user list --role=administrator --field=ID | \
  xargs -I {} wp user reset-password {}

# Skip the email (e.g. on a staging box with no mail) but still avoid logging the value:
wp user list --role=administrator --field=ID | \
  xargs -I {} wp user reset-password {} --skip-email
```

> Resetting *all* administrator passwords at once can lock out every admin if email delivery
> fails. On production, reset one account, confirm the new password works, then proceed.
