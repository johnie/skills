---
name: extract-spark-meetings
description: Extract meeting summaries and action items from Spark Mail shared links. Processes single URLs (pass as argument) or batch processes unchecked links from links.md. Use when working with Spark Mail shared meeting links.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - Glob
---

# Extract Spark Meetings

Extracts structured meeting summaries and action items from Spark Mail shared links. Saves organized markdown files with YAML frontmatter for easy searching and filtering.

## Overview

This skill processes Spark Mail shared meeting links and extracts key information:
- Meeting metadata (date, participants, duration)
- Summary and key discussion points
- Action items with owners
- Decisions made
- Next steps

**Expected folder structure:**
```
{current-directory}/
├── spark-meetings/          # Output directory (auto-created)
│   └── YYYY-MM-DD-*.md     # Extracted meeting files
└── links.md                 # Optional: Links file for batch processing
```

## Usage Modes

### Single URL Mode
Process one Spark Mail link:
```
/extract-spark-meetings https://share.sparkmailapp.com/...
```

### Batch Mode
Process all unchecked links from `links.md`:
```
/extract-spark-meetings
```

The `links.md` file should contain checkboxes:
```markdown
- [ ] https://share.sparkmailapp.com/link1
- [ ] https://share.sparkmailapp.com/link2
- [x] https://share.sparkmailapp.com/link3  # Already processed
```

## Workflow

**CRITICAL: Process URLs sequentially, one at a time. NEVER process multiple URLs in parallel.**

For each URL:

### 1. Content Extraction

**Preferred: Puppeteer MCP (if available)**
```javascript
// Navigate and extract text
await page.goto(url);
await page.waitForSelector('body');
const text = await page.evaluate(() => {
  return document.body.innerText.substring(0, 8000);
});
```

**Fallback: WebFetch tool**
Use WebFetch with prompt: "Extract all meeting content including participants, discussion points, and action items. Return as much raw text as possible."

### 2. Parse Content

Extract structured information:
- **Date**: Meeting date (YYYY-MM-DD format)
- **Title**: Brief descriptive title
- **Participants**: List of attendees
- **Duration**: If mentioned
- **Summary**: 2-3 sentence overview
- **Discussion Points**: Key topics covered
- **Action Items**: Tasks with owners and due dates
- **Decisions**: Key decisions made
- **Next Steps**: Follow-up actions

### 3. Generate Output File

**Filename convention:**
```
spark-meetings/YYYY-MM-DD-{meeting-title-slug}.md
```

Examples:
- `2024-03-15-quarterly-planning.md`
- `2024-03-15-design-review.md`

**File format:**
```yaml
---
date: 2024-03-15
title: Quarterly Planning Meeting
participants:
  - Alice Johnson
  - Bob Smith
  - Carol Davis
duration: 60 min
tags:
  - planning
  - quarterly
  - strategy
spark_url: https://share.sparkmailapp.com/...
extracted_date: 2024-03-15
---

# Quarterly Planning Meeting

## Summary

Brief 2-3 sentence summary of the meeting's purpose and outcomes.

## Discussion Points

- **Q1 Goals Review**: Discussed progress on Q1 objectives...
- **Q2 Planning**: Outlined key initiatives for next quarter...
- **Resource Allocation**: Reviewed team capacity and hiring needs...

## Action Items

- [ ] @alice Prepare Q2 budget proposal (Due: 2024-03-20)
- [ ] @bob Schedule follow-up with design team (Due: 2024-03-18)
- [ ] @carol Draft hiring plan for Q2 (Due: 2024-03-22)

## Decisions Made

1. Approved $50K budget for marketing initiative
2. Decided to postpone feature X to Q3
3. Agreed on weekly check-ins starting April

## Next Steps

- Schedule Q2 kickoff meeting
- Review and approve budget by March 20
- Begin hiring process for two engineering roles
```

### 4. Apply Tags

Tag each meeting according to type and topics. See `references/tagging-guide.md` for detailed tagging conventions.

Common tags:
- **Type**: `standup`, `planning`, `review`, `retrospective`, `one-on-one`, `all-hands`
- **Topic**: `engineering`, `design`, `product`, `strategy`, `hiring`, `budget`
- **Cadence**: `weekly`, `monthly`, `quarterly`, `annual`

### 5. Update Links File (if applicable)

**Single URL mode:**
- If `links.md` exists and contains the URL, mark it as checked: `- [x]`
- If `links.md` doesn't exist or doesn't contain the URL, skip this step

**Batch mode:**
- Only mark URL as checked (`- [x]`) after successful extraction
- If extraction fails, leave unchecked and report error
- Continue processing remaining URLs

## Error Handling

- **URL unreachable**: Log error, skip URL, continue with next
- **Content extraction fails**: Try fallback method, then skip if still failing
- **Parsing issues**: Extract what's possible, note limitations in summary
- **File write fails**: Report error, don't mark URL as processed

**Never mark a URL as processed unless:**
1. Content was successfully extracted
2. File was successfully written to `spark-meetings/`

## Links File Management

### Checkbox Format
- Unchecked: `- [ ] URL` → Pending processing
- Checked: `- [x] URL` → Successfully processed

### Update Rules

**Single URL mode:**
1. Check if `links.md` exists
2. If exists, search for exact URL match
3. If found, update checkbox to `- [x]` after successful extraction
4. If not found or file doesn't exist, no action needed

**Batch mode:**
1. Read `links.md` (error if missing)
2. Parse all unchecked (`- [ ]`) URLs
3. Process each URL sequentially
4. Update checkbox to `- [x]` only after successful extraction
5. Write updated `links.md` after each successful extraction

### Example Updates

Before:
```markdown
- [ ] https://share.sparkmailapp.com/abc123
- [ ] https://share.sparkmailapp.com/def456
- [x] https://share.sparkmailapp.com/old789
```

After processing first URL successfully:
```markdown
- [x] https://share.sparkmailapp.com/abc123
- [ ] https://share.sparkmailapp.com/def456
- [x] https://share.sparkmailapp.com/old789
```

## Output Summary

After processing, provide summary:
```
Extracted N meeting(s):
- spark-meetings/2024-03-15-quarterly-planning.md
- spark-meetings/2024-03-16-design-review.md

Skipped M link(s) due to errors:
- https://share.sparkmailapp.com/failed123 (reason)
```

## Tips

- **Sequential processing prevents rate limiting** and makes debugging easier
- **Rich frontmatter enables filtering**: Search by date, participant, or tag
- **Consistent naming** makes meetings easy to find chronologically
- **Action item checkboxes** can be checked off as tasks complete
- **Keep original Spark URL** in frontmatter for reference
