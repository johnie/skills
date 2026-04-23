---
name: extract-spark-meetings
description: Extract meeting notes from Spark Mail shared-transcript links into tagged markdown files with YAML frontmatter (participants, action items, decisions, next steps). Use when the user has one or more share.sparkmailapp.com links to convert into a searchable local meeting archive, in single-URL or batch mode from a links.md checklist.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - Glob
---

# Extract Spark Meetings

Spark Mail (the email client) produces shareable transcript links for recorded/summarized meetings. This skill converts those links into local markdown files with structured frontmatter, so meetings become greppable, taggable, and visible to future search.

Output is plain markdown + YAML — no Spark dependency once extracted.

## When to use

- "Extract this Spark meeting link" — `/extract-spark-meetings <url>`
- "Process all unchecked meetings in `links.md`" — `/extract-spark-meetings` (batch)
- Building or refreshing a meeting archive from a growing list of Spark shares
- Any workflow where Spark Mail transcript links need to become files on disk

## When NOT to use

- The source isn't a Spark Mail shared link (e.g., Google Meet transcripts, Zoom cloud recordings, Otter.ai) — different URL shapes and HTML structures; this skill's extractor will miss fields.
- You need a one-line summary, not a structured file — just paste the URL into `WebFetch` directly.
- Live-meeting capture (as it happens) — this skill reads already-rendered Spark shares.

## Expected layout

```text
{current-directory}/
├── spark-meetings/          # Output directory (auto-created)
│   └── YYYY-MM-DD-*.md      # Extracted meeting files
└── links.md                 # Optional: links checklist for batch mode
```

## Modes

### Single URL

```bash
/extract-spark-meetings https://share.sparkmailapp.com/...
```

Processes one link, writes one file. Updates `links.md` only if it exists and contains that URL.

### Batch (`links.md`)

```bash
/extract-spark-meetings
```

`links.md` is a checklist of URLs. Batch mode processes every unchecked entry:

```markdown
- [ ] https://share.sparkmailapp.com/link1
- [x] https://share.sparkmailapp.com/link2   # already processed — skipped
```

## Workflow

Process URLs **sequentially, one at a time** — do not parallelize. Spark's share endpoint rate-limits and can silently truncate or return partial content when hit concurrently; sequential runs also produce per-URL errors you can act on rather than a jumbled burst of failures. Parallelism looks faster but costs you correctness and debuggability.

For each URL:

### 1. Fetch the content

Use the Puppeteer MCP if available. Otherwise, fall back to `WebFetch` with the prompt: *"Extract all meeting content including participants, discussion points, action items, decisions, and next steps."*

Choice guide:

| Signal | Use |
|---|---|
| Transcript renders via client-side JS, embedded video, or attachments | Puppeteer MCP (waits for rendered DOM) |
| Plain HTML transcript, no dynamic widgets | `WebFetch` (faster, no browser) |
| Fetch returns a near-empty body via `WebFetch` | Retry with Puppeteer — likely JS-rendered |

If neither is available or both fail after a single retry, mark the URL as failed (leave it unchecked in `links.md`) and move on.

### 2. Parse content

Extract in the **original language** of the meeting. Use English for section headings so filenames and frontmatter stay consistent across languages.

Fields:

- **date** — meeting date (YYYY-MM-DD)
- **title** — brief descriptive title
- **participants** — list of attendees
- **duration** — if mentioned
- **summary** — 2-3 sentence overview
- **discussion_points** — key topics
- **action_items** — tasks with owners and due dates
- **decisions** — decisions made
- **next_steps** — follow-ups

### 3. Write the file

Filename: `spark-meetings/YYYY-MM-DD-{title-slug}.md`. Collisions append `-2`, `-3`, etc. before the extension.

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

### 4. Apply tags

Pick tags from [`references/tagging-guide.md`](references/tagging-guide.md): one primary meeting-type tag, 1-3 topic tags, optionally a cadence tag. The guide's tag set is deliberately generic — extend it in that file with your organization's own tags (product names, team names, initiatives) and keep the additions checked in so everyone's archive uses the same vocabulary.

Common starter set:

- **Type**: `standup`, `planning`, `review`, `retrospective`, `one-on-one`, `all-hands`
- **Topic**: `engineering`, `design`, `product`, `strategy`, `hiring`, `budget`
- **Cadence**: `weekly`, `monthly`, `quarterly`, `annual`

### 5. Update `links.md`

Mark the URL as `[x]` only after **both** content extraction and file write succeed. If either step failed, leave it unchecked and surface the failure in the output summary — this way a re-run will retry only the failed URLs.

- **Single URL mode**: update `links.md` only if it already exists and contains the URL; otherwise skip the update.
- **Batch mode**: walk unchecked (`- [ ]`) URLs in order, update the checkbox after each successful extraction, continue on failures.

## Output summary

Report:

- Files created, with paths
- URLs skipped or failed, each with a one-line reason (fetch error, parse failure, etc.)

If batch mode ran zero URLs (all already checked), say so explicitly so the user knows nothing was missed.
