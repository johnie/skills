---
name: reshape
description: Refactor the structure of a codebase or a focused area, covering dependencies, module boundaries, and code that changes together. The result lets agents read less per change, miss fewer breakages, and debug faster.
disable-model-invocation: true
argument-hint: "[optional area or concern to focus on]"
---

# Reshape

Refactor the structure of the requested area without changing its behavior. Use `$ARGUMENTS` and the user's request to set the scope; without a focus, cover the codebase. Inspect dependencies as needed, but change outside the scope only when required to complete an in-scope refactor. Report unrelated findings without fixing them.

## 1. Set scope and establish a baseline

Besides reshaping the codebase, there are two other things you may do:

| Addition | What it does |
| --- | --- |
| **Comments** | Remove comments that only restate the code. |
| **Tests** | Remove tests that wouldn't catch a real bug, and fix the ones that fail without one. |

List these (with their exact descriptions) for the user and ask which ones to do. The choice limits only the optional comment and test cleanup; the structural refactor always runs.

Before editing, identify the affected behavior and run the relevant existing checks. Record any existing failures; don't weaken tests to make them pass. If coverage is missing, add a focused behavior check before changing that path.

## 2. List evidenced problems

Don't change anything yet.

Within scope, ask: **should these pieces change together?** Record each finding with file locations and evidence of the coupling or maintenance cost, as in the [decision log example](references/decision-log.md). Look for three kinds of problem.

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
- Extension points and config for variation no current requirement needs (speculative generality).
- Dead code: nothing uses it, so nothing will ever need it to change.

Investigate **special cases** such as value-specific branches, caller-specific parameters, swallowed exceptions, retries, sleeps, and disabled tests. They are clues, not proof of bad design. Check requirements, callers, tests, and history before deciding whether they are workarounds or necessary behavior.

Keep justified exceptions, including retry limits and timing required by external systems. Record why they remain; fewer branches is not a goal.

## 3. Redesign from first principles

Design for today's evidenced requirements. Look for one fix behind several findings, but prefer the smallest coherent redesign over a new framework or speculative abstraction.

Check every fix, even one that looks better in the code:

- Colocate pieces that change together.
- Separate pieces that serve independent requirements.
- Point dependencies toward code that changes less.

Write each fix above the problems it solves, as in the [decision log example](references/decision-log.md).

## 4. Refactor and verify

Remove only special cases made unnecessary by the redesign. Preserve behavior, including error and timing contracts; report discovered bugs separately unless the user authorizes a behavior change.

Complete one coherent refactor at a time, update its callers, and run the narrowest relevant checks before continuing. If behavior changes unexpectedly, fix or undo that refactor before proceeding. Keep comment and test cleanup within scope and limited to the options the user chose.

If the user chose Comments:

- Remove comments that restate the implementation, like `// sort first so the binary search works`, even if they're phrased as a why.
- Keep comments about constraints outside the code, like `// the proxy drops websockets, so we poll`. The code can't show them.
- Remove comments that explain a workaround, like `// wait 100ms because the cache isn't ready yet`, when the redesign removes its cause.

If the user chose Tests, do this last, because tests are your regression safety net. A test should fail on a regression, and only then:

- Remove tests that repeat the implementation. They check the code against itself.
- Rewrite tests tied to internals to depend on behavior. They break when the code changes but behavior doesn't.
- Remove tests that can't fail. They pass whatever the code does.

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
- **Keep a decision log:** record findings, decisions, evidence, and verification results so they survive compaction. See the [decision log example](references/decision-log.md).
- **Use Git as evidence:** for how often pieces change, and what changes together.
