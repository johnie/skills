---
name: de-slop
description: Rewrite prose to remove patterns that read as AI-generated. Cuts throat-clearing openers, "not X, it's Y" contrasts, dramatic fragments, em dashes, filler adverbs, vague declaratives, and false agency that hides who acted, while it keeps the writer's facts and voice. Use when the user asks to de-slop or humanize text, to make it sound less like ChatGPT, Claude, or "an AI", to remove AI tells or clichés, or to rate how AI-sounding a draft is. Also run it on an essay, blog post, newsletter, social post, talk script, or landing page copy that you drafted, before you deliver it, even if the user does not say "slop".
when_to_use: Also applies to drafts in other languages and to reviews that want a score and a list of problems but no rewrite. Also applies to work text such as a PR description with formulaic phrasing; if it also buries its conclusion, fix the order with BLUF first, then run these checks. Skip for code and code comments, translation, proofreading that must keep approved wording, quoted or legal text, work text whose only problem is order, and deciding whether a person used AI (a style score does not prove authorship).
argument-hint: "[file or pasted text]"
---

# De-slop

Remove the AI-associated patterns listed below from prose. Keep every fact, the writer's certainty, all literals, and the writer's voice. A shorter text is a side effect, not the goal.

## Choose the mode

- **Rewrite** (default): change the text.
- **Review**: the user asks to check, audit, rate, or score a text, or asks how AI it sounds. Do not change the source. Report the problems, the fixes, and the score.
- **Your own drafts**: run the checks silently before you deliver prose you wrote.

## Procedure

### 1. Read for meaning

Before you change a word, note what the text claims: facts, numbers, names, quotes, the writer's position, and how sure the writer is. These survive the rewrite.

### 2. Find the patterns

Read [references/phrases.md](references/phrases.md) and [references/structures.md](references/structures.md), then mark each hit in the text. The phrases file covers words and stock phrases. The structures file covers sentence, paragraph, and formatting shapes.

### 3. Rewrite

Skip this step in review mode. For each hit, identify what the writer meant and write that, using the checks below. If nothing specific sits behind the phrase, delete the sentence.

### 4. Check the result

Run the checks below on the result, because a fix can introduce a new pattern. Revise until it passes. Then compare it with the source: every fact, number, name, and real hedge from step 1 must still be there.

## Checks

- **Filler adverbs** that intensify, soften, or hedge ("really", "just", "genuinely", "truly")? Cut them. Keep an adverb that carries information: "only", "rarely", and "already" change what a sentence claims.
- **Announcing openers** ("Here's the thing", "Here's why"), meta-commentary ("In this post, we'll..."), or emphasis crutches? Start with the point.
- **Binary contrasts** ("Not X, it's Y", "X isn't the problem, Y is"), negative listing, or rhetorical setups? State Y directly. A comparison that is itself the claim can stay, in one plain clause.
- **Wh- clefts** ("What makes this hard is...")? Start with the subject.
- **Passive voice or false agency** that hides who acted ("the decision emerged", "the data tells us")? Make the actor in the text the subject. If the text names no actor, do not invent a person: ask, or use "we" or "you" when the writer's context supports it.
- **Vague declaratives** ("The implications are significant")? Name the implication. Replace a lazy extreme ("everyone", "always", "never") with the real scope, unless the writer means it literally.
- **A narrator from a distance** ("Nobody designed this")? Put the reader in the scene. "You" beats "people". Keep the register: a formal report stays formal.
- **Rhythm**: three sentences in a row of the same length? Break one. List as many items as the content has, not a reflexive three. Vary paragraph endings instead of ending each on a punchy one-liner.
- **Em dashes**? Replace them with commas, colons, parentheses, or periods.
- **Repetition and hand-holding**: state a fact once. Cut softening, permission ("And that's okay"), recaps, and bold lead-ins on every bullet, emoji headings, or a "Key takeaways" recap on a short piece.
- **Quotables**: a line that sounds like a pull quote or a poster? Rewrite it as a plain statement or delete it.
- **Additions**: something in the result that the source does not say? Remove it or ask.

## What you must not change

Removing slop must not remove meaning.

- **Facts and certainty.** Keep every fact, number, name, and claim. Do not add examples, numbers, causes, or actors that are not in the source. A hedge that carries real doubt ("probably", "most teams") is a fact, so keep it in one plain word. Only empty hedges go.
- **Literals.** Keep quotes, code, commands, titles, product names, and links exactly as written.
- **Language.** Write in the language of the source. The word lists are English. The structural patterns apply in most languages, and each language has its own filler to look for.
- **Voice.** Keep the writer's vocabulary, humor, person, and register. You remove model defaults, not personality. When a person wrote the text and asks for a light pass, change only the patterns you found and leave their other sentences alone.
- **Length.** The rewrite is usually shorter. Do not pad it to match the original.

## Output

- **Rewrite**: give only the rewritten text, ready to paste, with no introduction and no list of changes.
- **Rewrite of a file**: edit the file in place. Then say in one line which kinds of pattern you removed.
- **Review**: list each pattern with the quoted text and its fix. Then give the score table. Rewrite only if the user asks.

After a rewrite, add a short note in two cases:

- You cut something the user may want back.
- A fix needs a fact that the source lacks (who decided, which number).

In the second case, ask for the fact. Do not fill the gap.

## Scoring

Rate the text from 1 to 10 on each dimension:

| Dimension    | Question                                        |
| ------------ | ----------------------------------------------- |
| Directness   | Does it make statements, or announce them?      |
| Rhythm       | Does sentence length vary, or is it metronomic? |
| Trust        | Does it respect the reader's intelligence?      |
| Authenticity | Does it sound like a specific person wrote it?  |
| Density      | Is anything left to cut?                        |

In rewrite mode and for your own drafts, revise a result below 35 of 50. In review mode, show the table with a one-line reason for each score and the total, and list the recommended fixes.

See [references/examples.md](references/examples.md) for before-and-after rewrites, including cases where the right fix keeps a hedge or asks for a missing actor.
