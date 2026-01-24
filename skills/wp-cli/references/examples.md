# WP-CLI Workflow Examples

Complete workflow scenarios with step-by-step commands.

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

# Run health check (WP 5.2+)
wp site health
```

### Rollback if Needed

```bash
# If something breaks, roll back specific plugin
wp plugin install plugin-slug --version=1.2.3 --force

# Or restore from backup
wp db import backup-before-updates-20240115.sql

# Or restore all plugins from tar
rm -rf wp-content/plugins/*
tar -xzf plugins-backup-20240115.tar.gz
```

## User Audit & Cleanup

Audit user accounts and clean up inactive or spam users.

### Discovery Phase

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

### Cleanup Phase

```bash
# Create a fallback admin user for content reassignment
wp user create content-archive archive@example.com \
  --role=editor \
  --display_name="Archived Content"

ARCHIVE_USER=$(wp user get content-archive --field=ID)

# Delete spam users (no role, no content)
# CAUTION: Verify these are actually spam
wp user list --format=json | \
  jq -r '.[] | select(.roles | length == 0) | .ID' | \
  xargs -I {} wp user delete {} --reassign=$ARCHIVE_USER --yes

# Bulk delete inactive subscribers (example: registered but never logged in)
# NOTE: Requires custom query or plugin to track last_login
```

### Role Management

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

### Security Audit

```bash
# Check for users with weak usernames (admin, test, demo)
wp user list --field=user_login | grep -E '^(admin|test|demo|user)$'

# List users with admin email domains
wp user list --format=json | jq -r '.[] | select(.user_email | contains("@admin"))'

# Generate strong passwords for all admins
wp user list --role=administrator --field=ID | \
  xargs -I {} wp user update {} --user_pass=$(openssl rand -base64 16)
```

## Content Import from CSV

Import posts or pages from CSV data.

### CSV Format

Create CSV file (`import.csv`):
```csv
post_title,post_content,post_status,post_type,post_author
"First Post","This is content","publish","post","1"
"Second Post","More content","draft","post","1"
```

### Import Script

```bash
#!/bin/bash

# Read CSV and import posts
tail -n +2 import.csv | while IFS=',' read -r title content status type author; do
  # Remove quotes from CSV fields
  title=$(echo $title | sed 's/"//g')
  content=$(echo $content | sed 's/"//g')
  status=$(echo $status | sed 's/"//g')
  type=$(echo $type | sed 's/"//g')
  author=$(echo $author | sed 's/"//g')

  # Create post
  POST_ID=$(wp post create \
    --post_title="$title" \
    --post_content="$content" \
    --post_status="$status" \
    --post_type="$type" \
    --post_author="$author" \
    --porcelain)

  echo "Created post ID: $POST_ID"
done
```

### Advanced Import with Metadata

CSV with meta fields (`import-meta.csv`):
```csv
post_title,post_content,post_status,custom_field_1,custom_field_2
"Product 1","Description","publish","value1","value2"
```

Import script:
```bash
#!/bin/bash

tail -n +2 import-meta.csv | while IFS=',' read -r title content status meta1 meta2; do
  title=$(echo $title | sed 's/"//g')
  content=$(echo $content | sed 's/"//g')

  POST_ID=$(wp post create \
    --post_title="$title" \
    --post_content="$content" \
    --post_status="$status" \
    --porcelain)

  # Add custom fields
  wp post meta add $POST_ID custom_field_1 "$meta1"
  wp post meta add $POST_ID custom_field_2 "$meta2"

  echo "Created post $POST_ID with metadata"
done
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

# Or use regex in database query
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

# Clean up orphaned metadata
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

## Multisite Operations (Basic)

Basic multisite management workflows.

### Network Setup

```bash
# Convert single site to multisite
wp core multisite-convert --title="My Network"

# Or with subdomains
wp core multisite-convert --title="My Network" --subdomains
```

### Site Management

```bash
# List all sites in network
wp site list --format=table

# Create new site
wp site create --slug=newsite --title="New Site" --email=admin@example.com

# Get site info
wp site list --field=url

# Empty site (remove content but keep site)
wp site empty --slug=oldsite --yes

# Delete site completely
wp site delete --slug=oldsite --yes
```

### Network-wide Operations

```bash
# Activate plugin network-wide
wp plugin activate plugin-name --network

# Update all sites
wp site list --field=url | xargs -I {} wp --url={} core update

# Run command on all sites
wp site list --field=url | xargs -I {} wp --url={} cache flush

# List plugins across all sites
wp site list --field=url | xargs -I {} sh -c 'echo "Site: {}"; wp --url={} plugin list'
```

### User Management in Multisite

```bash
# Add user to specific site
wp user add-to-site <user-id> --blog-id=<site-id> --role=editor

# Remove user from site
wp user remove-from-site <user-id> --blog-id=<site-id>

# List users across all sites (super admins)
wp super-admin list

# Grant super admin privileges
wp super-admin add <user-login>
```
