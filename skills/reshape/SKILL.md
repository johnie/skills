---
name: reshape
description: Reshape a codebase or a focused area so agents read less per change, miss fewer breakages, and debug faster. Use for structural refactoring of dependencies, module boundaries, and code that changes together.
disable-model-invocation: true
argument-hint: "[optional area or concern to focus on]"
---

# Reshape

Refactor the requested area thoroughly. Use `$ARGUMENTS` and the user's request to set the scope; without a focus, cover the codebase. Inspect dependencies as needed, but change outside the scope only when required to complete an in-scope refactor. Report unrelated findings without fixing them.

## Why do this at all?

- **Better output:** agents write better code in a well-structured codebase.
- **Cheaper & faster changes:** agents spend fewer tokens searching and more on the problem.
- **Fewer silent breaks:** agents break less without noticing.
- **Faster debugging:** agents find root causes faster.

## 1. Set scope and establish a baseline

Besides reshaping the codebase, there are two other things you may do:

| Addition | What it does |
| --- | --- |
| **Comments** | Remove comments that only restate the code. |
| **Tests** | Remove tests that wouldn't catch a real bug, and fix the ones that fail without one. |

List these (with their exact descriptions) for the user and ask which ones to do. Then do only those.

Before editing, identify the affected behavior and run the relevant existing checks. Record any existing failures; don't weaken tests to make them pass. If coverage is missing, add a focused behavior check before changing that path.

## 2. List evidenced problems

Don't change anything yet.

Within scope, ask: **should these pieces change together?** Record each finding with file locations and evidence of the coupling or maintenance cost, as in the [decision log example](#decision-log-example). Look for three kinds of problem.

**Hidden links:** pieces that must change together, where the code doesn't show it.

- Copies of the same rule or value: one requirement change must update them all. Similar-looking code for independent requirements is not duplication to remove.
- A module that reads a global or file set by another module: change that module and this one breaks, but nothing shows it (self-contained code).
- A feature split across folders by layer, or related code in different folders: one change needs all of them, but the layout hides that (domain-driven code, colocation).
- A call order or convention callers just have to know: change it and callers break, but nothing warns them (explicit over implicit).

**Needless links:** pieces tied together that change for different reasons.

- Callers that depend on internals: the internals change for their own reasons, and the callers break anyway (encapsulation).
- Stable code that imports something more volatile: the stable code has to change whenever the volatile code does (dependency direction).
- A general function with a parameter only one workflow understands: the function has to change whenever that workflow does (caller vocabulary).
- A shallow module: its interface changes whenever its internals do, so its callers change with it (deep modules).

**Surplus:** pieces with no reason of their own to change.

- Wrappers: they only change when the thing they wrap does (pass-through wrappers).
- Extension points and config for things that never vary: nothing will ever change them (speculative generality).
- Dead code: nothing uses it, so nothing will ever need it to change.

Investigate **special cases** such as value-specific branches, caller-specific parameters, swallowed exceptions, retries, sleeps, and disabled tests. They are clues, not proof of bad design. Check requirements, callers, tests, and history before deciding whether they are workarounds or necessary behavior.

Keep justified exceptions, including retry limits and timing required by external systems. Record why they remain; fewer branches is not a goal.

## 3. Redesign from first principles

Design for today's evidenced requirements. Look for one fix behind several findings, but prefer the smallest coherent redesign over a new framework or speculative abstraction.

Ask the same thing of every fix, even one that looks better in the code: pieces that change together end up together, pieces that don't aren't tied, and everything depends on what changes less.

Write each fix above the problems it solves, as in the [decision log example](#decision-log-example).

## 4. Refactor and verify

Remove only special cases made unnecessary by the redesign. Preserve behavior, including error and timing contracts; report discovered bugs separately unless the user authorizes a behavior change.

Complete one coherent refactor at a time, update its callers, and run the narrowest relevant checks before continuing. If behavior changes unexpectedly, fix or undo that refactor before proceeding. Keep comment and test cleanup within scope and limited to the options the user chose.

If the user chose Comments:

- Comments that restate the implementation, like `// sort first so the binary search works`, only change when it does, so they have no reason of their own to change. Remove them, even if they're phrased as a why.
- Comments about something outside the code, like `// the proxy drops websockets, so we poll`, change when that does, and the code can't show it. Keep them.
- Comments that explain a workaround in the codebase, like `// wait 100ms because the cache isn't ready yet`, only change when the problem behind the workaround does. They go when the redesign removes that problem.

If the user chose Tests, do this last, because tests are your regression safety net. A test should fail on a regression, and only then:

- Tests that repeat the implementation only change when it does, so they have no reason of their own to change. They check the same interpretation against itself, so remove them.
- Tests tied to internals break when the code changes but behavior doesn't, so they change for the wrong reason. Rewrite them to depend on behavior, which changes less.
- Tests that can't fail pass whatever the code does, so no change ever affects them. They aren't checking anything, so remove them.

## 5. Review and finish

Review the affected area for unresolved findings and regressions. Use independent subagent review when available and useful; otherwise do a separate review pass yourself.

Finish when:

- Each evidenced in-scope finding is fixed or explicitly justified as remaining; unresolved blockers are reported, not called complete.
- Changes that share a requirement are colocated or explicitly connected; unrelated requirements remain independent.
- Relevant checks pass relative to the baseline, with no unapproved behavior changes.

Report the structural changes, verification results, and any retained exceptions or out-of-scope findings. Don't keep expanding scope to chase a perfect codebase.

## Tips

- **Start from a read-only map:** extract declarations, imports, or summaries into temporary output; never strip function bodies from source files.
- **Summarize large areas:** use subagents when useful and available, or inspect and summarize the areas yourself.
- **Check the dependency graph often:** script one that shows what imports what, and rerun it as you go.
- **Enter where leverage is highest:** start looking there first.
- **Keep a decision log:** compaction is less of a problem that way.
- **Use Git as evidence:** for how often pieces change, and what changes together.

## Decision log example

Findings before editing:

```md
- Fix: give Dialog explicit focus ownership so closing a nested dialog returns focus correctly.
  - ui/LogoutDialog.tsx:30 uses a delay; ui/SettingsDialog.tsx:61 sets a global skipRefocus flag.
  - Evidence: the nested-dialog test shows both workarounds compensate for the same focus race.
  - Verify: run nested-dialog focus checks before and after the refactor.
- Keep: payments/client.ts:18 retries rate-limited requests.
  - Evidence: the provider requires Retry-After handling; tests cover the retry limit and exhausted error.
- Leave separate: checkout and reporting each calculate a percentage.
  - Evidence: checkout follows tax rules; reporting follows independently versioned analytics rules.
```
