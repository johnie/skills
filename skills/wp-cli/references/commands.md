# WP-CLI Command Reference

Organized by category with focus on non-obvious flags, gotchas, and best practices.

## Database Commands (`wp db`)

### Export & Import

```bash
wp db export [filename]
  --tables=<tables>              # Export specific tables (comma-separated)
  --exclude_tables=<tables>      # Skip tables (useful for logs, cache)
  --porcelain                    # Output only filename (for scripting)
  --add-drop-table               # Include DROP TABLE (default: true)

wp db import <file>
  --skip-optimization            # Faster for large databases
```

**Gotcha**: `wp db import` doesn't create the database. Run `wp db create` first if needed.

### Query & Search-Replace

```bash
wp db query '<SQL>'
  --skip-column-names            # Remove header row (useful for scripts)

wp search-replace <old> <new> [<table>...]
  --dry-run                      # ALWAYS test first
  --precise                      # Slow but handles serialized data correctly
  --skip-columns=<columns>       # Usually skip 'guid'
  --all-tables                   # Include non-WP tables
  --network                      # Search across multisite
  --export=<file>                # Export before replace
  --skip-tables=<tables>         # Skip specific tables
  --report                       # Show detailed report
  --report-changed-only          # Only show modified rows
```

**Critical Gotchas**:
- `guid` column warnings are normal - use `--skip-columns=guid` to suppress
- Without `--precise`, serialized data may corrupt (slower but safer)
- Always run with `--dry-run` first on production
- Search-replace changes are immediate and can't be undone without backup

### Maintenance

```bash
wp db optimize               # Optimize all tables
wp db repair                 # Repair corrupted tables
wp db size                   # Show database size
  --tables                   # Show size per table
  --human-readable           # Use KB, MB, GB
  --format=json              # Machine-readable output

wp db check                  # Check table integrity
wp db cli                    # Open MySQL/MariaDB shell
wp db reset --yes            # DESTRUCTIVE: Drops all tables
wp db clean                  # Remove tables from old installations
  --all-tables-with-prefix   # Remove tables matching wp_ prefix
```

**Warning**: `wp db reset` and `wp db clean` are irreversible without backups.

## Core WordPress (`wp core`)

```bash
wp core download
  --version=<version>        # Specific WordPress version
  --locale=<locale>          # Language (en_US, es_ES, etc.)
  --skip-content             # Don't download default themes/plugins

wp core update
  --version=<version>        # Update to specific version
  --minor                    # Only minor version updates
  --force                    # Reinstall same version (repair)

wp core verify-checksums
  --version=<version>        # Check specific version
  --locale=<locale>          # For non-English installs

wp core is-installed
  --network                  # Check if multisite is configured

wp core multisite-convert    # Convert single → multisite
  --title=<network-title>
  --base=<url-path>
  --subdomains               # Use subdomains instead of subdirectories
```

**Gotcha**: `wp core update` doesn't backup - do this manually first.

## Plugins (`wp plugin`)

```bash
wp plugin list
  --update=available         # Show only plugins with updates
  --status=active            # Filter by status (active, inactive, must-use)
  --format=json              # For scripting

wp plugin install <slug|url|zip>
  --version=<version>        # Specific version
  --activate                 # Activate after install
  --activate-network         # Network-activate (multisite)
  --force                    # Overwrite existing

wp plugin update <plugin>...
  --all                      # Update all plugins
  --exclude=<plugins>        # Skip specific plugins
  --minor                    # Only minor updates
  --patch                    # Only patch updates
  --dry-run                  # Test first

wp plugin activate <plugin>...
  --all                      # Activate all inactive
  --network                  # Network-activate (multisite)

wp plugin deactivate <plugin>...
  --all                      # Deactivate all
  --network                  # Network-deactivate (multisite)
  --uninstall                # Also remove data

wp plugin delete <plugin>...
  --all                      # Delete all inactive plugins

wp plugin get <plugin>
  --field=<field>            # Get specific field (name, version, status)
  --format=json
```

**Gotchas**:
- `--force` overwrites without prompting - backup first
- `wp plugin delete --all` only deletes inactive plugins (safety feature)
- Network-activated plugins can't be deactivated on sub-sites

## Themes (`wp theme`)

Commands mirror plugins with similar flags:

```bash
wp theme list
  --update=available
  --status=active

wp theme install <slug|url|zip>
  --activate
  --force

wp theme activate <theme>

wp theme update <theme>...
  --all
  --dry-run

wp theme delete <theme>...
  --all                      # Only deletes inactive themes

wp theme mod list            # List theme_mods (customizer settings)
wp theme mod get <mod>
wp theme mod set <mod> <value>
wp theme mod remove <mod>
```

**Gotcha**: Deleting active theme without specifying replacement will auto-activate default theme.

## Users (`wp user`)

```bash
wp user list
  --role=<role>              # Filter by role
  --field=<field>            # Single field output
  --fields=<fields>          # Specific fields (ID,user_login,user_email,roles)
  --orderby=<field>
  --order=<asc|desc>

wp user create <login> <email>
  --role=<role>              # Default: subscriber
  --user_pass=<password>     # Set password (prompts if omitted)
  --display_name=<name>
  --first_name=<name>
  --last_name=<name>
  --send-email               # Send new user email
  --porcelain                # Output only user ID

wp user delete <user>...
  --reassign=<user-id>       # REQUIRED to prevent orphaned content
  --network                  # Delete from entire network (multisite)
  --yes                      # Skip confirmation

wp user update <user>
  --user_pass=<password>
  --user_email=<email>
  --role=<role>
  --display_name=<name>

wp user add-role <user> <role>
wp user remove-role <user> <role>
wp user set-role <user> <role>  # Replaces all roles

wp user generate
  --count=<number>           # Generate multiple users
  --role=<role>

wp user reset-password <user>
  --skip-email               # Don't send email notification
```

**Critical Gotcha**: `wp user delete` without `--reassign` fails if user has posts. Always reassign content to another user.

## Posts & Content (`wp post`)

```bash
wp post list
  --post_type=<type>         # post, page, custom types
  --post_status=<status>     # publish, draft, trash, any
  --author=<id>
  --orderby=<field>
  --fields=<fields>
  --format=ids               # For piping to other commands

wp post create
  --post_type=<type>
  --post_title=<title>
  --post_content=<content>
  --post_status=<status>
  --post_author=<id>
  --post_date=<date>         # YYYY-MM-DD HH:MM:SS
  --porcelain                # Output only post ID

wp post update <id>...
  --<field>=<value>          # Any post field

wp post delete <id>...
  --force                    # Bypass trash (permanent)
  --defer-term-counting      # Performance for bulk deletes

wp post generate
  --count=<number>
  --post_type=<type>
  --post_status=<status>

wp post term list <id> <taxonomy>
wp post term add <id> <taxonomy> <term>...
wp post term remove <id> <taxonomy> <term>...
```

**Bulk delete pattern**:
```bash
# Delete all draft posts
wp post delete $(wp post list --post_status=draft --format=ids) --force
```

## Comments (`wp comment`)

```bash
wp comment list
  --status=<status>          # approve, hold, spam, trash
  --post_id=<id>
  --format=ids

wp comment approve <id>...
wp comment spam <id>...
wp comment trash <id>...
wp comment delete <id>...
  --force                    # Permanent delete

wp comment generate
  --count=<number>
  --post_id=<id>
```

## Options (`wp option`)

```bash
wp option list
  --search=<pattern>         # Search option names
  --autoload=<on|off>        # Filter by autoload status
  --format=json

wp option get <key>
  --format=json              # For structured data

wp option add <key> <value>
  --format=json              # Input JSON for arrays/objects
  --autoload=<yes|no>

wp option update <key> <value>
  --format=json
  --autoload=<yes|no>

wp option delete <key>

wp option pluck <key> <key-path>...  # Extract nested values
wp option patch <op> <key> <key-path> <value>  # Update nested values
```

**Common options**:
- `siteurl` - WordPress address
- `home` - Site address
- `blogname` - Site title
- `blogdescription` - Tagline
- `admin_email` - Administrator email
- `permalink_structure` - Permalink format
- `active_plugins` - Array of active plugins

**Gotcha**: Changing `siteurl` or `home` incorrectly can lock you out of wp-admin.

## Cache & Transients

```bash
wp cache flush               # Clear object cache
wp cache type                # Show cache type (redis, memcached, etc.)

wp transient delete <transient>
  --all                      # Delete all transients
  --expired                  # Delete only expired

wp transient get <transient>
wp transient set <transient> <value> [<expiration>]
wp transient list
  --search=<pattern>
  --format=json
```

## Cron (`wp cron`)

```bash
wp cron event list
  --format=table
  --due-now                  # Show events ready to run
  --fields=<fields>

wp cron event run <hook>
  --due-now                  # Run all due events
  --all                      # Run all events (even future)

wp cron event schedule <hook> <time> [<recurrence>] [<args>]
wp cron event delete <hook>

wp cron schedule list        # List cron schedules (hourly, daily, etc.)

wp cron test                 # Test if cron is working
```

**Gotcha**: WordPress cron requires site traffic. Use system cron for reliable execution:
```bash
*/15 * * * * wp cron event run --due-now --path=/var/www/html
```

## Configuration (`wp config`)

```bash
wp config create
  --dbname=<name>
  --dbuser=<user>
  --dbpass=<password>
  --dbhost=<host>            # Default: localhost
  --dbprefix=<prefix>        # Default: wp_
  --locale=<locale>
  --extra-php                # Additional PHP code

wp config get <constant>
wp config set <constant> <value>
  --type=<constant|variable>
  --raw                      # Don't quote value

wp config shuffle-salts      # Regenerate security keys
  --force                    # Update wp-config.php directly
```

## Multisite (`wp site`)

```bash
wp site list
  --network=<id>
  --field=<field>
  --fields=<fields>
  --format=json

wp site create
  --slug=<slug>              # Site path or subdomain
  --title=<title>
  --email=<email>            # Admin email

wp site delete <id>
  --slug=<slug>
  --yes                      # Skip confirmation

wp site empty
  --slug=<slug>              # Remove posts/comments but keep site
  --uploads                  # Also delete uploads
  --yes

wp site activate <id>
wp site deactivate <id>
wp site archive <id>
wp site unarchive <id>
```

**Note**: Multisite commands require network admin privileges.

## Performance Tips

1. **Use `--format=ids` for piping**:
   ```bash
   wp post delete $(wp post list --post_status=draft --format=ids)
   ```

2. **Skip plugins/themes for speed**:
   ```bash
   wp --skip-plugins db export
   wp --skip-themes cache flush
   ```

3. **Limit fields to reduce output**:
   ```bash
   wp user list --fields=ID,user_login
   ```

4. **Use JSON for structured data**:
   ```bash
   wp option get active_plugins --format=json
   ```

5. **Batch operations with `xargs`**:
   ```bash
   wp plugin list --status=inactive --field=name | xargs wp plugin delete
   ```
