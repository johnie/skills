# WP-CLI: Multisite Operations

Basic multisite (network) management workflows. All require network admin privileges.

## Network Setup

```bash
# Convert single site to multisite
wp core multisite-convert --title="My Network"

# Or with subdomains
wp core multisite-convert --title="My Network" --subdomains
```

## Site Management

```bash
# List all sites in network
wp site list --format=table

# Create new site
wp site create --slug=newsite --title="New Site" --email=admin@example.com

# Get site info
wp site list --field=url

# Empty site (remove ALL posts/comments but keep the site).
# DESTRUCTIVE and irreversible without a backup. --yes skips the confirmation prompt,
# so double-check the --slug before running. Export first: wp db export.
wp site empty --slug=oldsite --yes

# Delete site completely (removes the site and its content from the network).
# DESTRUCTIVE and irreversible. Confirm the slug is correct before using --yes.
wp site delete --slug=oldsite --yes
```

## Network-wide Operations

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

## User Management in Multisite

WP-CLI core has no `wp user add-to-site` / `remove-from-site` command. Use `wp eval` to call the
core multisite functions directly, or `wp super-admin` for network-wide privileges.

```bash
# Add an existing network user to a specific site with a role
wp eval "add_user_to_blog(<site-id>, <user-id>, 'editor');"

# Remove a user from a specific site
wp eval "remove_user_from_blog(<user-id>, <site-id>);"

# List super admins
wp super-admin list

# Grant / revoke super admin privileges
wp super-admin add <user-login>
wp super-admin remove <user-login>
```
