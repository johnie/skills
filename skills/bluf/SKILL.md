---
name: bluf
description: Rewrite wordy or AI-generated work text so the main point comes first and every sentence is short and plain, using Bottom Line Up Front (BLUF) order and Simplified Technical English (STE) sentence rules. Use when the user asks to clean up, simplify, shorten, tighten, check, or "BLUF" a pull request description, commit message, issue, status update, Slack message, email, release note, README section, or other work text. Also use to check work text that you wrote before you publish it, even if the user does not say "BLUF".
when_to_use: Also applies to work text in other languages, for example a Swedish PR description, and to a draft with a decision or a warning buried at the end. For work text that also has stock AI phrasing (fake contrasts, filler, dramatic fragments), apply BLUF first, then the de-slop pattern checks if that skill is available. Skip for translation, typo fixes that must keep the approved wording, creative or personal writing that must keep its voice, summaries of long documents, and certification against the ASD-STE100 dictionary.
argument-hint: "[file, PR number, or pasted text]"
---

# BLUF

Rewrite text so that a busy reader gets the main point from the first sentence and can stop there. Facts, uncertainty, literals, and required structure must survive the rewrite.

BLUF (Bottom Line Up Front) controls the order, and rules adapted from Simplified Technical English (ASD-STE100) control the sentences. These adapted rules do not make text conform to STE. See [Limits](#limits).

If the user asks you to check, audit, or review text, do not rewrite or edit it. List each problem with its fix.

## Procedure

Do the steps in this order. Structure comes first, because it is a waste of time to polish sentences that you will delete.

### 1. Find the bottom line

Read the full text. Then answer these questions in one or two sentences, for yourself:

- **What?** What changed, what was found, or what was decided?
- **So what?** Why is this important to this reader?
- **What must the reader do?** Approve, review, decide, answer, or nothing?

If you cannot answer from the text, the text has no bottom line. Do not invent one. Tell the user what is missing and ask.

### 2. Put the bottom line first

- Start with the bottom line. Do not write a greeting, a preamble, or a "This PR..." introduction before it.
- If the reader must do something, say what and by when in the first two sentences.
- Do not write the label "BLUF:" unless the user or the format asks for it. The position does the work.
- Put the remaining content in order of importance to the reader, not in the order in which the events occurred. The reader must be able to stop after any paragraph and have the most important part.
- Start each paragraph with its main point. A reader who reads only the first sentence of each paragraph must get a correct summary.

### 3. Delete what the reader does not need

Remove content when the removal changes nothing for the reader:

- Narrative of the work ("First I looked at..., then I found...") when only the result is important.
- A second statement of the same information: a summary at the end, a "Key takeaways" section, or a heading that says the same as the sentence below it.
- Content that the reader can see somewhere else, for example a list of each changed file in a PR.
- Praise and sales words about the work: _robust_, _comprehensive_, _seamless_, _significantly improves_.
- Offers and pleasantries: "Let me know if...", "I hope this helps", "Great question".
- Claims without evidence. "Thoroughly tested" becomes the name of the test that ran, or it goes.

Keep content that changes what the reader does: risks, breaking changes, steps to verify, decisions the reader must make, and facts that are not obvious.

See [references/phrases.md](references/phrases.md) for the phrases and words to remove or replace.

### 4. Rewrite the sentences

These rules are adapted from the STE writing rules. See [references/ste-rules.md](references/ste-rules.md) for the full list with examples.

- **Short sentences.** Maximum 20 words for an instruction, 25 words for a description. Divide longer sentences.
- **One instruction per sentence.** One topic per paragraph. Maximum six sentences per paragraph.
- **Active voice.** Name who or what does the action. Use the passive voice only if the agent is not known or not important.
- **Simple verb forms.** Use present, past, or future tense, or the imperative. Replace "has been updated to be able to handle" with "now handles".
- **No trailing "-ing" clauses.** Replace ", ensuring that the cache stays fresh" with a new sentence: "This keeps the cache fresh."
- **One word, one meaning.** If you call it a "job" in the first sentence, do not call it a "task" or a "worker" later. Different words tell the reader that there are different things.
- **Plain words.** Write "use", not "utilize" or "leverage". Write "start", not "initiate".
- **Short noun groups.** Maximum three nouns together. Change "user session token refresh logic" to "the logic that refreshes session tokens".
- **Complete sentences.** Keep the articles, subjects, and verbs. "Fixed bug, added tests, updated docs" in body text is harder to read than it is to write. Short does not mean telegraphic.
- **Vertical lists** for three or more parallel items, or for steps in a sequence. Use prose when the items are connected by "because" or "but". A list hides those connections.
- **Warnings start with the command or the condition.** Write "Run the migration before you deploy. If you do not, logins fail." Do not put the warning in the middle of a paragraph.

### 5. Verify

Read the result as the reader, and check:

- Does the first sentence give the bottom line? If the reader stops there, do they know what occurred and what to do?
- Is each fact in the result also in the source? Is each important fact in the source also in the result?
- Is there a sentence that you can delete with no loss? Delete it.
- Is there an instruction longer than 20 words, or a description longer than 25 words? Divide it.

## What you must not change

A rewrite that changes the meaning is worse than wordy text.

- **Facts.** Do not add facts, numbers, causes, or claims that are not in the source. Do not make an uncertain statement certain. If the source says "probably", keep the uncertainty in one plain word. If you delete a hedge, you change a fact.
- **Technical terms and literals.** Keep code, commands, file paths, identifiers, error messages, version numbers, URLs, and issue references exactly as they are. STE permits technical names in addition to its general vocabulary. Simplify the words around them, not the terms.
- **Lines that tools read.** Keep lines such as `Closes #123`, `Fixes NEWS-2291`, `Co-authored-by:`, and `BREAKING CHANGE:` on their own line, in the position that the convention requires. A mention (`@dba-oncall`) stays with the request that it belongs to.
- **Required structure.** If the text follows a template (for example a PR template with fixed headings), keep the headings. Apply the rules in each section. Put the bottom line in the first section.
- **Language.** Write the result in the language of the source text. The structure rules apply to all languages. The word lists apply to English only.
- **Voice of a human writer.** If a person wrote the text and wants only a light edit, change the order and the length. Do not make their sentences uniform.

## Formats

The bottom line is different for each type of text. Read [references/formats.md](references/formats.md) when the text is a pull request description, commit message, issue or bug report, status update, chat message, email, or release note.

## Output

For a check, audit, or review request, give the list of problems and fixes only. Do not change the source.

Otherwise, give the rewritten text only, in a form that the user can paste. Do not put an introduction before it or a list of your changes after it.

Add a short note after the text only in these cases:

- You removed something that the user possibly wants to keep. Name it in one line.
- The source has no clear bottom line, or it is missing a fact that the reader needs (for example, how the change was tested). Ask for it. Do not fill the gap.

If the user gives a file or a PR to edit, make the change there. Then report the bottom line of what you changed.

See [references/examples.md](references/examples.md) for before-and-after rewrites.

## Limits

This skill does not make text conform to ASD-STE100. The standard has 53 rules and a dictionary of approximately 900 approved words. This skill uses the rules that apply to everyday work text and does not use the dictionary. If the user needs text that conforms to STE, tell them that they need the standard and a trained writer.
