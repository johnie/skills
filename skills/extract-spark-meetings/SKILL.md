---
name: extract-spark-meetings
description: Extract Spark Mail +AI Meeting Notes into tagged markdown files with YAML frontmatter (participants, action items, decisions, next steps). Use when the user has one or more Spark meeting links (sparkmailapp.com/dpl/bl?token=… deep links or readdle-spark:// links) to convert into a searchable local meeting archive, in single-link or batch mode from a links.md checklist.
argument-hint: "[spark-meeting-link]"
allowed-tools:
  - Read
  - Write
  - Edit
  - WebFetch
  - Glob
  - Bash(which spark)
  - Bash(spark meeting *)
---

# Extract Spark Meetings

Spark Mail (the email client) records and summarizes meetings as +AI Meeting Notes and lets the owner share each note as a link. This skill converts those links into local markdown files with structured frontmatter, so meetings become greppable, taggable, and visible to future search.

Output is plain markdown + YAML — no Spark dependency once extracted.

Target link, if given: `$ARGUMENTS`. If that is blank or still shows the literal placeholder, run batch mode against `links.md`.

Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

## Link shapes

Spark deep links look like `https://sparkmailapp.com/dpl/bl?token=…`; the same link can also arrive as `readdle-spark://bl=…` or `readdlespark://bl=…`. Treat any of these as a Spark meeting link. Spark may also hand out other share-link forms — if the user says it is a Spark meeting link, try it rather than rejecting it on shape.

## When NOT to use

- The source isn't a Spark meeting link (e.g., Google Meet transcripts, Zoom cloud recordings, Otter.ai) — different link shapes and page structures; this skill's extractor will miss fields.
- You need a one-line summary, not a structured file — read the meeting directly and answer inline.
- Live-meeting capture (as it happens) — this skill reads already-saved meeting notes.

## Expected layout

```text
{current-directory}/
├── spark-meetings/          # Output directory (auto-created)
│   └── YYYY-MM-DD-*.md      # Extracted meeting files
└── links.md                 # Optional: links checklist for batch mode
```

## Modes

### Single link

Given one link, process it and write one file. Update `links.md` only if it exists and contains that link.

### Batch (`links.md`)

Given no link, treat `links.md` as a checklist and process every unchecked entry:

```markdown
- [ ] https://sparkmailapp.com/dpl/bl?token=AbC123...
- [x] https://sparkmailapp.com/dpl/bl?token=XyZ789... # already processed — skipped
```

## Workflow

Process links **sequentially, one at a time** — do not parallelize. The CLI talks to a single Spark Desktop process over IPC, and web endpoints can throttle or return partial pages when hit concurrently; sequential runs also produce per-link errors you can act on rather than a jumbled burst of failures. Parallelism looks faster but costs you correctness and debuggability.

For each link:

### 1. Fetch the content

Try sources in this order and stop at the first that returns real meeting content. Each fallback exists because the one before it has a precondition that may not hold.

**a. Official `spark` CLI** — check with `which spark`. If present, run:

```bash
spark meeting --transcript --notes "https://sparkmailapp.com/dpl/bl?token=..."
```

The positional accepts a numeric meeting ID or a Spark deep link. Prefer this path because it reads the note straight from the user's Spark Desktop — no scraping, no rate limits, works offline, and it is the only route for `readdle-spark://` links, which no browser can fetch. It requires Spark Desktop running on the same machine with CLI access enabled (Settings → AI Agents), and the note must belong to an account signed in there. If the command is missing, errors, or reports that the meeting isn't found, fall through.

**b. Browser-automation MCP** — Playwright MCP and Chrome DevTools MCP are the common ones. Don't hard-code a server name: check what's actually available, since tool names differ per server. Use this when the link opens a JS-rendered page; a browser waits for the DOM instead of returning an empty shell.

**c. `WebFetch`** — last resort, with the prompt: _"Extract all meeting content including participants, discussion points, action items, decisions, and next steps."_ Fast and needs no browser, but a deep link may render as an app-launch landing page rather than the transcript. A near-empty body means the page is JS-rendered or gated: retry once with a browser MCP, not with `WebFetch` again.

If every route fails after a single retry, mark the link as failed (leave it unchecked in `links.md`) and move on.

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
spark_url: https://sparkmailapp.com/dpl/bl?token=AbC123...
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

### 5. Update `links.md`

Mark the link as `[x]` only after **both** content extraction and file write succeed. If either step failed, leave it unchecked and surface the failure in the output summary — this way a re-run will retry only the failed links.

- **Single link mode**: update `links.md` only if it already exists and contains the link; otherwise skip the update.
- **Batch mode**: walk unchecked (`- [ ]`) links in order, update the checkbox after each successful extraction, continue on failures.

## Output summary

Report:

- Files created, with paths
- Links skipped or failed, each with a one-line reason (CLI error, fetch error, parse failure, etc.)

If batch mode ran zero links (all already checked), say so explicitly so the user knows nothing was missed.
