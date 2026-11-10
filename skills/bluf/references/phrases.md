# Phrases to remove or replace

These lists show families of patterns. They are not complete. If you remove one phrase and a similar phrase takes its place, change the structure of the sentence.

## Remove: text before the point

The first sentence must be the bottom line. Delete each sentence that only prepares for it.

- "This PR introduces / This pull request aims to / This commit..." Start with the change: "Adds...", "Fixes...", or the subject.
- "I wanted to reach out to / I'm writing to let you know that / Just a quick update:"
- "In this document, we will / Let me walk you through / Here's a breakdown of"
- "As you may know / As discussed / To give some context" (if the context is necessary, give it after the bottom line)
- "Great question / Sure / Absolutely / Happy to help"
- "After investigating / After some digging / Upon closer inspection" Give the result.

## Remove: text after the point

- "In summary / Overall / To summarize / In conclusion" followed by a second statement of the text
- "Key takeaways" or "TL;DR" at the end. If the text needs a TL;DR, the TL;DR is the first sentence and the text is too long.
- "Let me know if you have any questions / Feel free to reach out / Happy to discuss"
- "I hope this helps / Hope that makes sense"
- "Next steps could include..." when nobody asked and nobody owns them

## Remove: words that tell the reader what to think

Each of these words says that something is good or important, with no evidence. Delete the word. If the claim then has no content, delete the sentence or replace it with the measured fact.

| Word | Do this |
| --- | --- |
| robust, comprehensive, seamless, elegant, powerful, clean | Delete, or say what the thing does |
| significantly, greatly, dramatically, substantially | Give the number, or delete |
| crucial, critical, essential, vital, key | Delete, or say what breaks without it |
| simply, just, easily, straightforward | Delete. The reader decides what is easy. |
| various, several, a number of, multiple | Give the number or name the items |
| properly, correctly, appropriately | Say what "correct" means here |
| best practices, industry standard | Name the practice |
| enhance, improve, optimize, streamline (with no object or measure) | Say what changed and by how much |

## Remove: empty intensifiers and hedges

- "It's worth noting that / It's important to note that / Note that / Notably / Importantly" Delete the phrase. Keep the fact, if there is one.
- "really, very, quite, actually, basically, essentially, fundamentally, truly"
- "I think / I believe / It seems like / It appears that" when the fact is verified. Keep one plain word of doubt when the doubt is real: "probably", "not verified", "we do not know why".
- Many hedges in one sentence: "this could potentially help to possibly reduce". Use one.

Do not delete a real uncertainty. "The fix probably resolves #482; I could not reproduce the original failure" is a fact about what is known. Say it one time, in the place where it applies.

## Replace: long words and phrases with plain ones

| Not this | Use this |
| --- | --- |
| utilize, leverage, make use of | use |
| implement (for a small change) | add, write, make |
| facilitate, enable (someone to) | let, help; or say what the person can now do |
| initiate, commence | start |
| terminate | stop, end |
| in order to | to |
| due to the fact that, owing to | because |
| in the event that | if |
| at this point in time, currently (when obvious) | now, or delete |
| prior to / subsequent to | before / after |
| with regard to, with respect to, in terms of, when it comes to | about, for; or change the sentence |
| a large number of | many, or the number |
| is able to / has the ability to | can |
| in addition, additionally, furthermore, moreover | also; or delete and start the sentence |
| ensure | make sure that |
| modify, alter | change |
| functionality | function, feature; or name it |
| perform a check / carry out a review / make a decision | check / review / decide |
| address (an issue) | fix, answer, or say what was done |
| delve into, dive into, explore | examine, read; or delete |
| a wide range of, a variety of | many, or name them |
| going forward, moving forward | from now; or delete |

A verb that is hidden in a noun ("perform validation of", "provides an implementation of") becomes the verb ("validates", "implements").

## Replace: structures

| Pattern | Problem | Do this |
| --- | --- | --- |
| "It's not X, it's Y." / "Rather than X, this Y." | The reader must read the wrong answer first | Say Y. Add X only if the reader believed it. |
| Three items in each list ("fast, reliable, and scalable") | A habit, not a count | Keep the items that are true and that you can support |
| A question, then its answer ("Why does this matter? Because...") | Delays the point | Say the answer |
| A colon or dash before a reveal ("The result: chaos.") | Drama | Write a plain sentence |
| A heading for each two sentences | The text looks like a document and reads like a form | Remove the headings in short text |
| An emoji at the start of headings or bullets | Decoration | Remove |
| Bold text on many phrases | Nothing is more important than the rest | Remove the bold. Keep it for one warning at most. |
| A bold label and a colon on each bullet ("**Performance:** ...") | Each bullet becomes a small heading | Write the sentence |
| "Not only... but also" | Long | "and" |
| Em dashes that add a side comment | A second idea in the sentence | Make two sentences, or delete the comment |

## Do not write these in the result

The rewrite must not add new empty text. In particular:

- Do not start with "Here is the rewritten text".
- Do not add the label "BLUF:" or "Summary:" unless the format requires it.
- Do not add a closing sentence that says what the text said.
