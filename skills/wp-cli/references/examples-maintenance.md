# WP-CLI: Maintenance & Debugging

Safe plugin updates with rollback, plus debugging and database-maintenance workflows.

## Bulk Plugin Updates with Rollback Plan

Safe plugin update workflow with fallback strategy.

### Pre-Update Assessment

```bash
# Check available updates
wp plugin list --update=available --format=table

# Document current versions (for rollback)
wp plugin list --format=json > plugin-versions-$(date +%Y%m%d).json

# Check for known issues with updates
wp plugin get <plugin-slug> --field=update_version
```

### Backup & Update

```bash
# Full backup
wp db export backup-before-updates-$(date +%Y%m%d).sql

# Optional: Backup wp-content/plugins
tar -czf plugins-backup-$(date +%Y%m%d).tar.gz wp-content/plugins/

# Test updates (dry-run)
wp plugin update --all --dry-run

# Update one plugin at a time (safer approach)
wp plugin update akismet --dry-run
wp plugin update akismet

# Test site functionality
curl -I https://example.com  # Check homepage loads
wp plugin list              # Verify plugin is active

# If all good, continue with others
wp plugin update --all

# Or update excluding problematic plugins
wp plugin update --all --exclude=woocommerce,some-problematic-plugin
```

### Verification

```bash
# Check all plugins are active
wp plugin list --status=active

# Verify no PHP errors
wp eval 'error_log("WP-CLI test");'

# Clear caches
wp cache flush
wp transient delete --all

# Health-ish checks. There is no core `wp site health` command — Site Health is an
# admin-UI feature. The CLI equivalent is the separate wp-cli/doctor package (`wp doctor check --all`).
wp core verify-checksums
wp cron test
```

### Rollback if Needed

```bash
# If something breaks, roll back specific plugin
wp plugin install plugin-slug --version=1.2.3 --force

# Or restore from backup
wp db import backup-before-updates-20240115.sql

# Or restore all plugins from tar.
# CAUTION: `rm -rf wp-content/plugins/*` deletes every installed plugin. Confirm the tar
# below exists and is the right backup BEFORE running the rm — there is no undo.
rm -rf wp-content/plugins/*
tar -xzf plugins-backup-20240115.tar.gz
```

## Debugging & Maintenance

Common debugging and maintenance workflows.

### Debugging Environment

```bash
# Enable debug mode
wp config set WP_DEBUG true --raw
wp config set WP_DEBUG_LOG true --raw
wp config set WP_DEBUG_DISPLAY false --raw

# Check current debug settings
wp config get WP_DEBUG
wp config get WP_DEBUG_LOG

# Tail debug log
tail -f wp-content/debug.log
```

### Plugin/Theme Conflict Resolution

```bash
# Deactivate all plugins
wp plugin deactivate --all

# Test site - if working, reactivate one by one
wp plugin activate plugin-1
# Test site
wp plugin activate plugin-2
# Test site - repeat until issue found

# Switch to default theme to test theme conflicts
wp theme activate twentytwentyfour

# Reactivate original theme
wp theme activate original-theme
```

### Database Maintenance

```bash
# Optimize database
wp db optimize

# Repair corrupted tables
wp db repair

# Clean up post revisions (keep last 5)
wp post list --post_type=revision --format=ids | xargs wp post delete --force

# Clean up auto-drafts
wp post delete $(wp post list --post_status=auto-draft --format=ids) --force

# Clean up trashed posts older than 30 days
wp post list --post_status=trash --format=json | \
  jq -r '.[] | select(.post_modified < "2024-01-01") | .ID' | \
  xargs wp post delete --force

# Remove expired transients
wp transient delete --expired

# Clean up orphaned metadata.
# CAUTION: raw DELETE bypasses WordPress hooks and cannot be undone — export the database first
# (`wp db export`) and dry-run the matching SELECT to confirm the row count before deleting.
wp db query "DELETE FROM wp_postmeta WHERE post_id NOT IN (SELECT ID FROM wp_posts)"
wp db query "DELETE FROM wp_commentmeta WHERE comment_id NOT IN (SELECT comment_id FROM wp_comments)"
```

### Performance Checks

```bash
# Check database size
wp db size --tables --human-readable

# Find largest tables
wp db query "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = DATABASE() ORDER BY (data_length + index_length) DESC LIMIT 10"

# Count autoloaded options (should be < 1MB)
wp option list --autoload=on --format=count

# Check large autoloaded options
wp db query "SELECT option_name, LENGTH(option_value) as size FROM wp_options WHERE autoload='yes' ORDER BY size DESC LIMIT 20"
```
