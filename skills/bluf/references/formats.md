# Formats

The bottom line depends on what the reader will do with the text. For each format, this file gives the reader, the bottom line, the order, and the content that you can usually delete.

## Contents

- [Pull request description](#pull-request-description)
- [Commit message](#commit-message)
- [Issue or bug report](#issue-or-bug-report)
- [Status update or report](#status-update-or-report)
- [Chat message (Slack, Teams)](#chat-message-slack-teams)
- [Email](#email)
- [Release note or changelog entry](#release-note-or-changelog-entry)
- [Documentation and README sections](#documentation-and-readme-sections)
- [Review comment](#review-comment)

## Pull request description

**Reader:** A reviewer who must decide whether to approve. Later, a person who reads the history to learn why the code changed.

**Bottom line:** What the change does to the behavior of the system, and why. Then what the reviewer must know that the diff does not show.

**Order:**

1. One or two sentences: what changes and why. Include the issue reference.
2. Warnings, if there are any: breaking changes, migrations, necessary deploy sequence, feature flags, security effects.
3. How to verify: the commands or steps, and what the author ran. Say what is not tested.
4. Decisions that the reviewer could question: why this approach, and which alternative was rejected. Only if it is not obvious.
5. Where to look first, if the diff is large.

**Delete:**

- A list of each changed file or function. The diff shows it. Keep a file reference only to point the reviewer to the important part.
- "This PR" as the subject of each sentence.
- A "Summary" heading above a text of three sentences.
- Sections that say "None" or "N/A", unless the template requires them.
- A test plan made of checkboxes that nobody ran. Write what ran. If the source does not say what ran, ask.
- A "Benefits" section. If the benefit is real, it is the "why" in the first sentence.

**Title:** Imperative, specific, maximum approximately 70 characters. Follow the convention of the repository (for example Conventional Commits). Write "Fix double charge when checkout retries", not "Fix bug" and not "Improve the robustness of the payment flow".

**Size:** A small change needs two to four sentences and no headings. Use headings only when there are three or more sections with content.

If the repository has a PR template, keep its headings and their sequence. Apply the rules in each section. Put the bottom line in the first section.

## Commit message

**Reader:** A person who runs `git log` or `git blame` months later.

**Bottom line:** The subject line. It says what the commit does, in the imperative, in approximately 50 characters (maximum 72).

**Order:**

1. Subject line.
2. Empty line.
3. Body: why the change was necessary, and what is different now. Lines of maximum 72 characters.
4. Trailers and references (`Fixes #123`, `Co-authored-by:`). Keep them exactly.

**Delete:** How the author found the problem, the list of files, and a body that says the same as the subject line. Many commits need no body.

Follow the convention of the repository for prefixes (`fix:`, `feat(scope):`).

## Issue or bug report

**Reader:** A person who must decide the priority, and then a person who must reproduce the problem.

**Bottom line:** What is wrong, where, and how bad it is. "Checkout returns HTTP 500 for carts with more than 50 items, in production, since the deploy on 3 March."

**Order:**

1. The bottom line.
2. Steps to reproduce, as a numbered list, one action per step.
3. The expected result and the actual result. Give the error message exactly, in a code block.
4. The environment: versions, browser, configuration.
5. What is known about the cause, marked clearly as verified or not verified.

**Delete:** The story of how the problem was found, apologies, and guesses that are written as facts.

For a feature request, the bottom line is who needs what, and what they cannot do now.

## Status update or report

**Reader:** A manager or a team that must decide whether to act.

**Bottom line:** The status in one sentence, and the decision or help that you need from the reader. "The migration is two days late. I need a decision by Thursday: delay the launch, or launch without search."

**Order:**

1. The status and the request.
2. What blocks the work, and who can remove the block.
3. What changed since the last update.
4. The next step, with a date and an owner.

**Delete:** A list of all activities. The reader wants the result, not a record of the effort. Delete "Things are going well overall".

If nothing is necessary from the reader, say so first: "For information only. No action is necessary."

## Chat message (Slack, Teams)

**Reader:** A person who sees the first line in a notification, among many others.

**Bottom line:** The question or the request, in the first line, with the name of the person who must act.

- Ask the question directly. Do not write "Hi, do you have a minute?" and then wait.
- Give the context after the question, in a maximum of three sentences. Put more in a thread.
- Paste the exact error or the link. Do not describe it.
- Do not use headings. Use a list only for real steps or options.
- If you give options, give them a number or a letter so that the reader can answer with one character.

## Email

**Reader:** A person who decides from the subject line whether to open the email.

**Subject line:** Start with a keyword that says what you expect, then the topic and the date if there is one. This is the military convention:

- `ACTION:` the reader must do something
- `DECISION:` the reader must decide
- `REQUEST:` you ask for permission or approval
- `INFO:` no action is necessary

Use the keyword only where the team accepts it. In other cases, write the same information as a plain subject: "Approve flyer design by Friday noon".

**Order:**

1. The bottom line: what you need, from whom, by when.
2. The background that the reader needs to act. Usually two to four sentences.
3. Details, as a list or an attachment.

Answer the five Ws in the first paragraph when they apply: who, what, where, when, and why.

**Delete:** "I hope this email finds you well", the history of the project, and the last paragraph that says what the first paragraph said.

## Release note or changelog entry

**Reader:** A user who wants to know whether the release changes something for them.

**Bottom line:** What the user can now do, or what the user must change. Write from the side of the user, not from the side of the code.

**Order:**

1. Breaking changes and necessary actions, first, with the exact steps to migrate.
2. New features.
3. Fixes.

One entry is one sentence, or two. Write "Exports larger than 2 GB no longer fail", not "Refactored the export pipeline to use streaming".

Follow the format of the existing changelog (for example Keep a Changelog).

## Documentation and README sections

**Reader:** A person who wants to do a task.

**Bottom line:** What the thing is and what the reader can do with it, in the first two sentences. Then the shortest way to a result that works.

- Instructions are numbered steps in the imperative, with one action per step.
- Put the condition before the action: "If you use Windows, run...".
- Put commands in code blocks. Do not put a command in the middle of a sentence if the reader must copy it.
- Explain a concept after the steps that work, or in a different section.
- Delete "Welcome to", the list of adjectives about the project, and the history.

## Review comment

**Reader:** The author, who must decide what to change.

**Bottom line:** What must change, and whether it blocks the approval.

- Start with the request: "Check for `null` here. `user` is undefined when the session has expired."
- Say whether it blocks: use the convention of the team (`nit:`, `blocking:`), or plain words.
- Give the reason in one sentence. Give a code suggestion if you have one.
- Delete the praise that comes before the criticism only to make it softer. If something is good, say it in a separate comment.
