# Sentence rules (adapted from ASD-STE100)

STE was made in the 1980s for aircraft maintenance manuals. The readers were mechanics, and for many of them English was a second language. The rules below are the STE writing rules that apply to everyday work text, with the adaptations that this skill makes.

Each rule has the same purpose: the reader must get the meaning from one reading, with no need to guess.

## Contents

1. Sentence length
2. One instruction per sentence
3. Paragraphs
4. Active voice
5. Verb forms
6. "-ing" forms
7. One word, one meaning
8. Noun groups
9. Complete sentences
10. Vertical lists
11. Warnings
12. Specific instructions
13. What this skill does not take from STE

## 1. Sentence length

Maximum 20 words in an instruction. Maximum 25 words in a description.

Count a term in code format (`refreshToken()`) as one word. If a sentence is too long, find the "and", "which", "while", or comma that connects two ideas, and divide the sentence there.

| Before | After |
| --- | --- |
| The service now retries failed requests up to three times with exponential backoff, which should help reduce the number of transient errors that users see when the upstream API is under heavy load. | The service now retries a failed request a maximum of three times, with exponential backoff. Users see fewer errors when the upstream API is under heavy load. |

## 2. One instruction per sentence

A reader does the steps one at a time. Write them one at a time.

| Before | After |
| --- | --- |
| Pull the branch, run the migration and then restart the worker after making sure the queue is empty. | 1. Pull the branch.<br>2. Run the migration.<br>3. Make sure that the queue is empty.<br>4. Restart the worker. |

If two actions must occur at the same time, they can be in one sentence: "Hold the button and connect the cable."

Put the condition before the instruction, so that the reader sees it in time: "If the build fails, clear the cache."

## 3. Paragraphs

- One topic per paragraph.
- The first sentence gives the topic. This is BLUF at the level of the paragraph.
- Maximum six sentences.
- A paragraph of one sentence is permitted. Do not use many of them in sequence for effect.

## 4. Active voice

Name the agent. The passive voice hides who or what does the action, and in technical text the agent is frequently the important fact.

| Before | After |
| --- | --- |
| The token is validated before the request is forwarded. | The gateway validates the token before it forwards the request. |
| It was decided that the flag would be removed. | We removed the flag. |
| Tests were added. | This change adds tests for the retry path. |

In a description, the passive voice is permitted when the agent is not known or not important: "The server was restarted at 03:14."

In an instruction, always use the imperative: "Run the migration", not "The migration should be run".

## 5. Verb forms

STE permits the infinitive, the imperative, the simple present, the simple past, the simple future, and the past participle as an adjective. It does not permit auxiliary verbs that make complex verb constructions.

In practice:

| Before | After |
| --- | --- |
| has been updated to handle | now handles |
| will be able to configure | can configure |
| is going to be removed | will be removed in v3 |
| would need to be changed | must change |
| we have been seeing | we see |
| should now be working | works (if you verified it) / is not verified (if you did not) |

"Should" has two meanings: an obligation ("you should run the tests") and an expectation ("this should work"). Replace it with the word for the meaning that applies: "must" or "we recommend" for an obligation, "we expect" for an expectation.

## 6. "-ing" forms

STE permits the "-ing" form only in a technical name ("logging", "load balancing"). This skill is less strict. It removes the two uses that make sentences hard to read:

**Trailing "-ing" clause.** The clause adds a result or a purpose at the end of the sentence, and it does not say what does the action.

| Before | After |
| --- | --- |
| This adds an index on `user_id`, significantly improving query performance. | This adds an index on `user_id`. The query time decreased from 800 ms to 40 ms. |
| The handler now validates input, ensuring that malformed requests are rejected early. | The handler now validates input and rejects malformed requests. |

**"-ing" opener.** The reader must hold the clause in memory until the subject comes.

| Before | After |
| --- | --- |
| Building on the previous refactor, this change moves the config loader. | This change moves the config loader. It depends on the refactor in #212. |

Also note that many trailing "-ing" clauses are claims without evidence ("improving maintainability", "enhancing the developer experience"). If you divide the sentence and the second part is empty, delete it.

## 7. One word, one meaning

STE gives each approved word one meaning and one part of speech. The useful rule for work text is consistency:

- Use one name for one thing. If you write "job", "task", "worker", and "process" for the same thing, the reader thinks that there are four things. This is the opposite of the school rule about variation.
- Use one word for one action. Do not change between "remove", "delete", "drop", and "clean up" unless they are different operations.
- Use the name that the code uses. If the class is `OrderQueue`, do not call it "the order pipeline".

## 8. Noun groups

Maximum three nouns in sequence. English permits long sequences of nouns, and the reader must guess how the words connect.

| Before | After |
| --- | --- |
| user session token refresh logic | the logic that refreshes session tokens |
| production database connection pool exhaustion issue | the production database had no free connections in its pool |

An identifier or a product name counts as one word.

## 9. Complete sentences

STE does not permit you to omit the subject, the verb, or the article to make text shorter. This rule matters because "be concise" frequently produces telegraphic text:

| Before | After |
| --- | --- |
| Fixed race in cache. Added lock. Tests green. | This change fixes a race condition in the cache. It adds a lock around the write. All tests pass. |
| Root cause: missing null check → crash on empty cart | The crash occurred because the code did not check for an empty cart. |

Exceptions, because the format has its own rules:

- A commit subject line and a PR title use the imperative with no article where the convention requires it: "Fix race in cache write".
- Items in a short list can be fragments if all items have the same form.
- A table cell can be a fragment.

Do not use symbols (→, =>, &, +, w/) as a replacement for words in body text.

## 10. Vertical lists

Use a list when the reader gets a benefit from it:

- Steps in a sequence: use numbers.
- Three or more parallel items: use bullets.
- Items that the reader will check one by one.

Do not use a list for reasoning. "We chose X because Y, but Z is a risk" is one idea. Three bullets hide the "because" and the "but".

Make all items in a list the same grammatical form. Introduce the list with a complete sentence or a clause that ends in a colon.

Do not use headings in a text of fewer than approximately 150 words. Do not use bold text to mark an ordinary word as important. If everything is bold, nothing is.

## 11. Warnings

STE requires a safety instruction to start with a clear command or condition. Then it gives the reason.

For work text, this applies to breaking changes, data loss, necessary sequences, and security.

| Before | After |
| --- | --- |
| Note that it's worth keeping in mind that this migration isn't reversible, so you may want to consider taking a backup first. | Make a backup before you run this migration. You cannot reverse the migration. |

Put a warning before the step that it applies to, and near the top of the text. A warning in the last paragraph is read after the damage.

## 12. Specific instructions

STE requires instructions to be as specific as possible. Replace a general word with the value, the name, or the command.

| Before | After |
| --- | --- |
| Make sure everything is set up correctly. | Set `DATABASE_URL` in `.env`. |
| This improves performance significantly. | The p95 latency decreased from 1.2 s to 300 ms. |
| Wait a bit before retrying. | Wait 30 seconds, then try again. |

If the source does not contain the specific value, do not invent it. Delete the general claim, or ask the user for the value.

## 13. What this skill does not take from STE

- **The dictionary.** STE has approximately 900 approved general words. This skill does not restrict you to them. It uses the principle (plain words, one meaning) and the replacement list in [phrases.md](phrases.md).
- **The total ban on "-ing" forms and on the present perfect.** These are applied only where they cause problems, as sections 5 and 6 show.
- **Uppercase and manual layout rules.** They are for maintenance manuals.

The standard says that partial use decreases its accuracy. Thus the result of this skill is plain English in the style of STE. It is not STE.
