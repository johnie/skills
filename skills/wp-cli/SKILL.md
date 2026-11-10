---
name: wp-cli
description: Drive WordPress from the command line via `wp` CLI. Covers site migrations, search-replace, bulk plugin/theme/user/post operations, option and config edits, multisite management, and cron scheduling. Use when the user wants to run one of these operations on a WordPress site from a terminal or over SSH.
when_to_use: Also applies to database backups, exports, and imports, and to inspecting a site's plugins, users, options, or cron events. Skip for one-off edits a content editor would make in seconds in the admin UI. Skip for data transformations spanning millions of rows; use a direct SQL migration with an explicit transaction. Skip for logic that runs inside a plugin's hook lifecycle (REST validation, custom post type registration, business rules); that is PHP code, not CLI.
allowed-tools:
  - Bash(wp --version)
  - Bash(wp core is-installed *)
  - Bash(wp core version *)
  - Bash(wp plugin list *)
  - Bash(wp theme list *)
  - Bash(wp user list *)
  - Bash(wp post list *)
  - Bash(wp comment list *)
  - Bash(wp site list *)
  - Bash(wp option get *)
  - Bash(wp option list *)
  - Bash(wp cron event list *)
  - Bash(wp db check *)
  - Bash(wp db size *)
  - Bash(wp db export *)
---

# wp-cli

Run WordPress operations from a terminal: migrations, bulk updates, database work, and multisite administration. This skill often targets production. Get the user's approval before any mutating command. Require a current backup before any destructive command.

Only inspection commands and `wp db export` (which takes a backup) are pre-approved. Mutating commands (`search-replace`, `db import`, `db reset`, plugin/theme installs, user and post writes) need the user's approval before they run.

Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

## Preflight

Confirm the target first. If not at the WordPress root, pass `--path=/path/to/wordpress` or `cd` there. On remote hosts, use `--ssh=user@host/path` or a configured alias (see [Remote execution](#remote-execution)).

Then verify the install:

```bash
wp --version                  # wp-cli is installed
wp core is-installed          # WordPress is actually set up at this path
wp core version               # which WP version
```

## Safety patterns

### Backup before destructive work

```bash
# Database snapshot
wp db export backup-$(date +%Y%m%d-%H%M%S).sql

# Full site snapshot (db + content)
tar -czf site-backup-$(date +%Y%m%d-%H%M%S).tar.gz wp-content/ backup-*.sql
```

### Dry-run when available

```bash
wp plugin update --all --dry-run
wp search-replace 'old.com' 'new.com' --dry-run
```

### Dangerous commands: confirm explicitly

These are irreversible without a backup. Confirm with the user before running:

- `wp db reset`: drops every table
- `wp db clean`: drops every table matching the current `$table_prefix`
- `wp site delete` (multisite): removes a site and its content
- `wp user delete` without `--reassign`: deletes the user's posts along with the user. Always pass `--reassign=<new_author_id>` to reassign their content first.
- `wp post delete $(wp post list --format=ids)` and similar bulk-delete pipes: delete every post the filter matches, so a wrong filter empties the site.

## Performance flags

```bash
--format=json              # machine-readable
--format=csv               # spreadsheet import
--format=ids               # space-separated IDs, for piping
--fields=ID,post_title     # return only what you need
--skip-plugins             # bypass plugin load (fast, may break plugin-dependent commands)
--skip-themes              # bypass theme load
--quiet                    # suppress info output
```

`--skip-plugins` skips loading plugins, which speeds up commands such as `wp db export`. It breaks commands that rely on a plugin's hooks (e.g., ACF exporters, custom taxonomies registered by a plugin).

## Command catalog

Full flag docs and gotchas, by category, are in [`references/commands.md`](references/commands.md).

## Workflows

Full step-by-step workflows live in `references/`, split by task. Load only the one the user is doing end-to-end:

| Workflow | File |
| --- | --- |
| Site migration (local → prod) + search-replace | [`references/examples-migration.md`](references/examples-migration.md) |
| Plugin updates with rollback, debugging, DB maintenance | [`references/examples-maintenance.md`](references/examples-maintenance.md) |
| User audit, cleanup, safe password rotation | [`references/examples-users.md`](references/examples-users.md) |
| Bulk content import from CSV | [`references/examples-content.md`](references/examples-content.md) |
| Multisite / network operations | [`references/examples-multisite.md`](references/examples-multisite.md) |

## Remote execution

Target remote sites with `--ssh=user@host/path` or a configured `@alias` from `~/.wp-cli/config.yml`. Prefer aliases for targets you reuse. Setup and examples: [`references/remote.md`](references/remote.md).

## Common errors

| Error | Cause | Fix |
| --- | --- | --- |
| `The site you have requested is not installed` | Not at WordPress root / `wp-config.php` missing | `cd` to root or `--path=/path/to/wordpress` |
| `MySQL connection failed` | Bad credentials or MySQL down | Check `wp-config.php`, confirm MySQL is running |
| `Error: Can't select database` | DB doesn't exist | `wp db create` |
| `PHP Fatal error: Allowed memory size exhausted` | Large op or heavy plugins | `php -d memory_limit=512M $(which wp) db export` |
| `This does not seem to be a WordPress installation` | WP files not found | Check directory; confirm WP is actually installed |
| `The \`guid\` column is often used ... but should not be updated` | Expected warning | `--skip-columns=guid` suppresses it; GUIDs are permanent IDs, not URLs |

## Antipatterns: when wp-cli is the wrong tool

- **Looping over many rows** in shell with `xargs` or `for`. Each `wp` invocation bootstraps WordPress. Prefer a single `wp db query` with one SQL statement, or a PHP-side batched job.
- **Using `wp search-replace` without `--precise` when serialized data is present.** `--precise` is slower but handles PHP serialized strings correctly. Without it, serialized arrays silently corrupt.
- **Credential-bearing commands in your shell history.** `wp user create` with `--user_pass=...` leaks. Pipe the password in or let wp-cli prompt.

## Best practices

1. **Staging first, always.** Never run an untested command on production.
2. **Track `wp-config.php` changes in version control** when feasible (exclude secrets).
3. **Read the output.** wp-cli warnings often precede data loss.
4. **Document non-obvious workflows** (migrations, multisite conversions) as they happen, including the flags used.
5. **`--format=json` whenever piping to `jq` or another script.** Don't parse the default human-readable format.
6. **Verify after mutating changes**: migrations, search-replace, database imports, core/plugin/theme updates, and bulk deletes. Load the homepage, check admin, and exercise the workflows the change touched.
7. **Keep wp-cli current**: `wp cli update` (Phar installs only; Homebrew and Composer installs update through their package manager).

Upstream docs: <https://developer.wordpress.org/cli/commands/>
