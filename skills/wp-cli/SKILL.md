---
name: wp-cli
description: Drive WordPress from the command line via `wp` CLI — site migrations, search-replace, bulk plugin/theme/user/post operations, option and config edits, multisite management, and cron scheduling. Use whenever the user wants to do something to a WordPress site that a terminal can reach faster than wp-admin.
allowed-tools:
  - Bash
---

# wp-cli

Terminal-first WordPress operations. Safer than wp-admin for bulk work, scriptable, SSH-friendly, and won't time out on 10k-row updates.

## When to use

- Site migration (local → staging → prod), including search-replace of URLs
- Bulk plugin / theme / user / post / comment operations
- Database export/import, optimization, repair
- Reading or setting `wp_options`, config constants, or theme mods
- Running or scheduling cron events
- Multisite admin tasks (`wp site ...`)
- Anything scripted or SSH-driven where clicking through wp-admin isn't viable

## When NOT to use

- One-off edits a content editor would do in 10 seconds in the admin UI. CLI is overkill and error-prone for single-row clicks.
- Data transformations that span millions of rows — WP's ORM will be slow; consider a direct SQL migration with an explicit transaction.
- Anything that needs to run inside a WordPress plugin's hook lifecycle (e.g., REST validation, custom post type registration) — that's PHP code, not CLI.
- Destructive commands without a current backup. `wp db reset`, `wp db clean`, bulk deletes — always snapshot first.

## Preflight

Always verify before doing anything:

```bash
wp --version                  # wp-cli is installed
wp core is-installed          # WordPress is actually set up at this path
wp core version               # which WP version
```

If not at the WordPress root, pass `--path=/path/to/wordpress` or `cd` there first. On remote hosts, use `--ssh=user@host/path` or a configured alias (see [Remote Execution](#remote-execution)).

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

### Dangerous commands — confirm explicitly

These are irreversible without a backup. Confirm with the user before running:

- `wp db reset` — drops every table
- `wp db clean` — removes tables
- `wp site delete` (multisite) — removes a site and its content
- `wp user delete` without `--reassign` — orphans the user's posts (they get deleted too). Always pass `--reassign=<new_author_id>` to reassign their content first. The flag exists because orphaning content is almost never what you want — the user's posts are the institutional record, not the user row.
- `wp post delete $(wp post list --format=ids)` and similar bulk-delete pipes — quietly turn the whole site into a blank page if the filter is wrong.

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

`--skip-plugins` is a scalpel: it makes `wp db export` instant, but breaks commands that rely on a plugin's hooks (e.g., ACF exporters, custom taxonomies registered by a plugin).

## Command catalog

Full flag docs and gotchas are in [`references/commands.md`](references/commands.md). Categories:

| Category | Prefix | Typical use |
|---|---|---|
| Database | `wp db` | export, import, query, optimize, search-replace |
| Core | `wp core` | install, update, verify-checksums, version |
| Plugins | `wp plugin` | list, install, activate, update, delete |
| Themes | `wp theme` | list, install, activate, update, delete, `theme mod` |
| Users | `wp user` | create, list, delete (`--reassign`), update, roles, generate |
| Posts / Pages | `wp post` | list, create, update, delete, generate, `post term` |
| Comments | `wp comment` | list, approve, spam, trash, delete |
| Options | `wp option` | get, update, delete, list, `pluck`/`patch` for nested values |
| Cache | `wp cache` / `wp transient` | flush, delete, set, list |
| Cron | `wp cron` | event list/run/schedule/delete, cron test |
| Config | `wp config` | create, get, set, shuffle-salts |
| Multisite | `wp site` | list, create, delete, empty, activate/archive |

## Workflows

Full step-by-step workflows — site migration, bulk plugin updates, user audit — live in [`references/examples.md`](references/examples.md). Load that file when the user is doing one of those tasks end-to-end.

## Remote execution

### Ad-hoc SSH

```bash
ssh user@example.com "cd /var/www/html && wp plugin list"
```

### Configured aliases (preferred)

Define aliases once in `~/.wp-cli/config.yml`:

```yaml
@prod:
  ssh: user@example.com/var/www/html
@staging:
  ssh: user@staging.example.com/var/www/staging
```

Then:

```bash
wp @prod plugin list
wp @staging db export
```

Aliases beat ad-hoc SSH because they compose with every wp-cli flag (`wp @prod --dry-run search-replace ...`) and don't invite shell-quoting bugs.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `The site you have requested is not installed` | Not at WordPress root / `wp-config.php` missing | `cd` to root or `--path=/path/to/wordpress` |
| `MySQL connection failed` | Bad credentials or MySQL down | Check `wp-config.php`, confirm MySQL is running |
| `Error: Can't select database` | DB doesn't exist | `wp db create` |
| `PHP Fatal error: Allowed memory size exhausted` | Large op or heavy plugins | `php -d memory_limit=512M $(which wp) db export` |
| `This does not seem to be a WordPress installation` | WP files not found | Check directory; confirm WP is actually installed |
| `The \`guid\` column is often used ... but should not be updated` | Expected warning | `--skip-columns=guid` suppresses it; GUIDs are permanent IDs, not URLs |

## Antipatterns — when wp-cli is the wrong tool

- **Looping over millions of rows** in shell with `xargs` or `for`. Each `wp` invocation bootstraps WordPress; 1M iterations = days. Prefer a single `wp db query` with a proper SQL statement, or a PHP-side batched job.
- **Using `wp search-replace` without `--precise` on serialized data** larger than a hobby blog. `--precise` is slower but handles PHP serialized strings correctly; without it, serialized arrays silently corrupt.
- **Validation and domain logic.** If the logic belongs inside a WP plugin's hook lifecycle, do it there. wp-cli is for operational work, not business rules.
- **Credential-bearing commands in your shell history.** `wp user create` with `--user_pass=...` leaks. Pipe the password in or let wp-cli prompt.

## Best practices

1. **Staging first, always.** Never run an untested command on production.
2. **Track `wp-config.php` changes in version control** when feasible (exclude secrets).
3. **Read the output.** wp-cli warnings often precede data loss.
4. **Document non-obvious workflows** — migrations, multisite conversions — as they happen; future-you will not remember which flags you used.
5. **`--format=json` whenever piping to `jq` or another script.** The default human format rots.
6. **Verify after big changes** — load the homepage, check admin, exercise critical paths.
7. **Keep wp-cli current**: `wp cli update`.

## References

- [`references/commands.md`](references/commands.md) — detailed command + flag reference by category
- [`references/examples.md`](references/examples.md) — complete workflows (migration, updates, audits)
- Upstream docs: <https://developer.wordpress.org/cli/commands/>
