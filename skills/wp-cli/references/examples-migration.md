# WP-CLI: Migration & Search-Replace

End-to-end site migration plus the search-replace patterns it depends on.

## Site Migration: Local → Production

Complete migration from local development to live production server.

### Preparation Phase

```bash
# On LOCAL - Verify WordPress installation
wp core version
wp plugin list --status=active
wp theme list --status=active

# Document current state
wp option get siteurl > migration-notes.txt
wp option get home >> migration-notes.txt
```

### Export Phase

```bash
# On LOCAL - Backup database
wp db export migration-$(date +%Y%m%d).sql

# Optional: Exclude logs and transients for smaller file
wp db export migration-clean.sql --exclude_tables=wp_actionscheduler_logs,wp_wfLeeches

# Compress for transfer
gzip migration-*.sql
```

### Search-Replace Phase

```bash
# On LOCAL - Test search-replace first (DRY RUN)
wp search-replace 'http://localhost:8000' 'https://example.com' \
  --dry-run \
  --report \
  --skip-columns=guid

# If dry-run looks good, execute
wp search-replace 'http://localhost:8000' 'https://example.com' \
  --skip-columns=guid \
  --report-changed-only

# Also update file paths if they contain absolute paths
wp search-replace '/Users/dev/mysite' '/var/www/html' \
  --skip-columns=guid

# Export the modified database
wp db export migration-final.sql
gzip migration-final.sql
```

### Transfer Phase

```bash
# Transfer database
scp migration-final.sql.gz user@example.com:/tmp/

# Transfer WordPress files (exclude wp-config.php)
rsync -avz --exclude='wp-config.php' \
  --exclude='.git' \
  --exclude='node_modules' \
  wp-content/ user@example.com:/var/www/html/wp-content/
```

### Import Phase

```bash
# On PRODUCTION - Backup existing site first
ssh user@example.com
cd /var/www/html

wp db export backup-before-migration-$(date +%Y%m%d).sql

# Import new database
gunzip /tmp/migration-final.sql.gz
wp db import /tmp/migration-final.sql

# Clean up transfer file
rm /tmp/migration-final.sql
```

### Verification Phase

```bash
# On PRODUCTION - Verify settings
wp option get siteurl       # Should show production URL
wp option get home          # Should show production URL

# Flush caches and permalinks
wp cache flush
wp rewrite flush

# Check plugins are active
wp plugin list --status=active

# Verify admin access
wp user list --role=administrator

# Test critical functionality
wp post list --posts_per_page=5
wp comment count
```

### Post-Migration Cleanup

```bash
# On PRODUCTION - Regenerate thumbnails if needed
wp media regenerate --yes

# Update file permissions if needed (as root/sudo)
chown -R www-data:www-data /var/www/html/wp-content

# Verify checksums
wp core verify-checksums

# Monitor error logs
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/nginx/error.log
```

## Search-Replace Best Practices

Advanced search-replace scenarios with safety checks.

### URL Migration

```bash
# Standard URL replacement
wp search-replace 'http://old.com' 'https://new.com' \
  --dry-run \
  --report \
  --skip-columns=guid

# Handle both www and non-www
wp search-replace 'http://old.com' 'https://new.com' --skip-columns=guid
wp search-replace 'http://www.old.com' 'https://new.com' --skip-columns=guid

# Update file paths in content
wp search-replace '/old/path/uploads' '/new/path/uploads' --skip-columns=guid
```

### Serialized Data Handling

```bash
# Use --precise for serialized data (slower but safer)
wp search-replace 'old-value' 'new-value' --precise --skip-columns=guid

# Check specific table for serialized data
wp search-replace 'old' 'new' wp_options --dry-run --precise
```

### Regex Search-Replace

```bash
# WP-CLI doesn't support regex directly, use SQL for complex patterns
wp db query "UPDATE wp_posts SET post_content = REPLACE(post_content, 'pattern', 'replacement')"

# Or use regex in database query — REGEXP_REPLACE requires MySQL 8.0+ or MariaDB 10.0.5+.
# Older servers will error with "FUNCTION REGEXP_REPLACE does not exist"; fall back to REPLACE or a PHP-side job.
# Back up first: search-replace via raw SQL bypasses WP's serialization handling and can corrupt serialized data.
wp db query "UPDATE wp_posts SET post_content = REGEXP_REPLACE(post_content, 'pattern', 'replacement')"
```

### Targeted Search-Replace

```bash
# Only in posts table
wp search-replace 'old' 'new' wp_posts --skip-columns=guid

# Only in specific columns
wp search-replace 'old' 'new' wp_posts --include-columns=post_content,post_excerpt

# Multiple tables
wp search-replace 'old' 'new' wp_posts wp_postmeta --skip-columns=guid
```
