# WP-CLI: Remote Execution

Run wp-cli against a remote WordPress install over SSH, either ad hoc or through configured aliases.

## Ad-hoc SSH

```bash
ssh user@example.com "cd /var/www/html && wp plugin list"
```

## Configured aliases (preferred)

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

Prefer aliases for targets you reuse. An alias takes wp-cli flags directly (`wp @prod --dry-run search-replace ...`), so the command needs no extra shell quoting inside an `ssh` string.
