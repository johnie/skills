---
name: de-slop
description: Rewrite prose so it stops reading as AI-generated. Cuts throat-clearing openers, "not X, it's Y" contrasts, dramatic fragments, em dashes, filler adverbs, vague declaratives, and inanimate things doing human verbs, while it keeps the writer's facts and voice. Use whenever the user asks to de-slop or humanize text, to make it sound less like ChatGPT, Claude, or "an AI", to remove AI tells or clichés, or to rate how AI-sounding a draft is, and before you deliver an essay, blog post, newsletter, social post, talk script, or landing page copy that you drafted, even if the user does not say "slop".
when_to_use: Also applies to drafts in other languages and to reviews that want a score and a list of problems but no rewrite. Skip for code and code comments, translation, proofreading that must keep approved wording, quoted or legal text, and work text whose problem is order rather than phrasing, such as a PR description or status update that buries its conclusion.
argument-hint: "[file or pasted text]"
license: MIT. Adapted from stop-slop by Hardik Pandya (https://github.com/hardikpandya/stop-slop). Full terms in assets/LICENSE.txt.
---

# De-slop

Rewrite prose so a reader cannot tell that a model drafted it, and so it says more in fewer words.

Readers spot AI patterns within a sentence or two and then discount the rest. Each pattern is a default that a model reaches for when it has nothing specific to say: an opener that announces the point, a contrast that manufactures drama, an adverb that inflates a claim. The fix is rarely a synonym. It is the specific thing the pattern stood in for, or nothing.

## Procedure

### 1. Read for meaning

Before you change a word, note what the text claims: facts, numbers, names, quotes, the writer's position, and how sure the writer is. These survive the rewrite.

### 2. Find the patterns

Read [references/phrases.md](references/phrases.md) and [references/structures.md](references/structures.md), then mark each hit in the text. The phrases file covers words and stock phrases. The structures file covers sentence, paragraph, and formatting shapes, which are harder to see and do more damage.

### 3. Rewrite

Apply the core rules below. For each hit, ask what the writer meant and write that. If nothing specific sits behind the phrase, delete the sentence.

### 4. Check the rewrite

Fixes breed new patterns. A deleted contrast turns into a stack of fragments, and three cut adverbs leave three paragraphs that each end on a punch line. Run the quick checks on your own output and revise until it passes. Then compare it with the source: every fact, number, name, and real hedge from step 1 must still be there.

## Core rules

1. **Cut filler.** Throat-clearing openers, emphasis crutches, meta-commentary, and adverbs that intensify, soften, or hedge ("really", "just", "genuinely", "truly"). Keep an adverb when it carries information: "only", "rarely", and "already" change what a sentence claims.
2. **Break formulaic structures.** Binary contrasts, negative listing, dramatic fragmentation, rhetorical setups. State the point directly. A comparison that is itself the claim can stay, in one plain clause.
3. **Name the actor.** Prefer active voice. Inanimate things doing human verbs ("the decision emerged", "the data tells us") hide who acted. Use the actor that the text gives you. If it gives none, do not invent a person: ask, or use "we" or "you" when the writer's context supports it.
4. **Be specific.** Replace a vague declarative ("The implications are significant") with the implication. Replace a lazy extreme ("everyone", "always", "never") with the real scope, unless the writer means it literally.
5. **Put the reader in the room.** "You" beats "people", and a scene beats a lecture. Keep the register: a formal report stays formal.
6. **Vary rhythm.** Mix sentence lengths. List as many items as the content has, not a reflexive three. End paragraphs in different ways. Replace em dashes with commas, colons, parentheses, or periods.
7. **Trust the reader.** State a fact once. Cut softening, permission ("And that's okay"), recaps, and hand-holding.
8. **Cut quotables.** If a line sounds like a pull quote or a poster, rewrite it as a plain statement or delete it.

## What you must not change

Removing slop must not remove meaning.

- **Facts and certainty.** Keep every fact, number, name, and claim. Do not add examples, numbers, causes, or actors that are not in the source. A hedge that carries real doubt ("probably", "most teams") is a fact, so keep it in one plain word. Only empty hedges go.
- **Literals.** Keep quotes, code, commands, titles, product names, and links exactly as written.
- **Language.** Write in the language of the source. The word lists are English. The structural patterns apply in most languages, and each language has its own filler to look for.
- **Voice.** Keep the writer's vocabulary, humor, person, and register. You remove model defaults, not personality. When a person wrote the text and asks for a light pass, change only the patterns you found and leave their other sentences alone.
- **Length.** The rewrite is usually shorter. Do not pad it to match the original.

## Output

- **Rewrite** (default): give only the rewritten text, ready to paste, with no introduction and no list of changes. If the user gave a file, edit it in place and say in one line which kinds of pattern you removed.
- **Review** (the user asks to check, audit, rate, or score a text, or asks how AI it sounds): list each pattern with the quoted text and its fix, then give the score table. Rewrite only if the user asks.
- **Your own drafts**: run the quick checks silently before you deliver prose you wrote.

After a rewrite, add a short note only when you cut something the user may want back, or when a fix needs a fact that the source lacks (who decided, which number). Ask for the fact. Do not fill the gap.

## Quick checks

- An adverb that adds no information? Cut it.
- Passive voice or false agency? Find the actor in the text and make it the subject.
- "Here's the thing", "Here's why", or another opener that announces the point? Start with the point.
- "Not X, it's Y" or "X isn't the problem, Y is"? State Y.
- "What makes this hard is..." or another Wh- cleft? Start with the subject.
- Three sentences in a row of the same length? Break one.
- Every paragraph ends on a punchy one-liner? Vary the endings.
- An em dash? Replace it.
- A vague declarative? Name the specific thing.
- A narrator from a distance ("Nobody designed this")? Put the reader in the scene.
- Meta-commentary ("In this post, we'll...")? Delete it.
- Bold lead-ins on every bullet, emoji headings, or a "Key takeaways" recap on a short piece? Remove them.
- Something in the rewrite that the source does not say? Remove it or ask.

## Scoring

Rate the text from 1 to 10 on each dimension:

| Dimension    | Question                                        |
| ------------ | ----------------------------------------------- |
| Directness   | Does it make statements, or announce them?      |
| Rhythm       | Does sentence length vary, or is it metronomic? |
| Trust        | Does it respect the reader's intelligence?      |
| Authenticity | Does it sound like a specific person wrote it?  |
| Density      | Is anything left to cut?                        |

Below 35 of 50: revise. In review mode, show the table with a one-line reason for each score and the total.

## Examples

See [references/examples.md](references/examples.md) for before-and-after rewrites, including cases where the right fix keeps a hedge or asks for a missing actor.
