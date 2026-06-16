# WP-CLI: Content Import from CSV

Import posts or pages from CSV data.

## CSV Format

Create CSV file (`import.csv`):
```csv
post_title,post_content,post_status,post_type,post_author
"First Post","This is content","publish","post","1"
"Second Post","More content","draft","post","1"
```

## Import Script

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

## Advanced Import with Metadata

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

> The naive `sed 's/"//g'` parsing above breaks on fields that legitimately contain commas or
> quotes. For anything beyond simple data, use `wp post create` driven by a `jq`/CSV parser that
> understands quoting, or the dedicated `wp-cli/import` and `humanmade/wp-cli-import-csv` packages.
