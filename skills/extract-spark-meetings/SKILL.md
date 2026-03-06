---
name: extract-spark-meetings
description: Extract meeting summaries from Spark Mail shared links. Use as `/extract-spark-meetings <url>` for single link or `/extract-spark-meetings` to batch-process unchecked links from links.md.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - Glob
---

# Extract Spark Meetings

**Expected folder structure:**
```text
{current-directory}/
├── spark-meetings/          # Output directory (auto-created)
│   └── YYYY-MM-DD-*.md     # Extracted meeting files
└── links.md                 # Optional: Links file for batch processing
```

## Usage Modes

### Single URL Mode
Process one Spark Mail link:
```bash
/extract-spark-meetings https://share.sparkmailapp.com/...
```

### Batch Mode
Process all unchecked links from `links.md`:
```bash
/extract-spark-meetings
```

The `links.md` file should contain checkboxes:
```markdown
- [ ] https://share.sparkmailapp.com/link1
- [x] https://share.sparkmailapp.com/link2  # Already processed
```

## Workflow

**CRITICAL: Process URLs sequentially, one at a time. NEVER process multiple URLs in parallel.**

For each URL:

### 1. Content Extraction

Use Puppeteer MCP if available. Fallback: WebFetch with prompt "Extract all meeting content including participants, discussion points, and action items."

### 2. Parse Content

Extract in the original language of the meeting content. Use English for section headings.

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
```text
spark-meetings/YYYY-MM-DD-{meeting-title-slug}.md
```

If a file with the same name exists, append `-2`, `-3`, etc. before the extension.

Examples:
- `2024-03-15-quarterly-planning.md`
- `2024-03-15-quarterly-planning-2.md`

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

### 5. Update Links File

Mark URL as checked (`- [x]`) in `links.md` only after both content extraction AND file write succeed. Never mark a URL as processed if either step failed.

- **Single URL mode**: If `links.md` exists and contains the URL, update it. Otherwise skip.
- **Batch mode**: Read `links.md`, parse unchecked (`- [ ]`) URLs. Update checkbox after each successful extraction. If extraction fails, leave unchecked and continue.

## Output Summary

Report files created with paths and any URLs skipped with reasons.
