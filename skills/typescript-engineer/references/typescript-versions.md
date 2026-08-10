---
name: typescript-versions
description: What changed in TypeScript 5.5 through 7.x that affects type-level design and error diagnosis
---

# TypeScript Version Notes (5.5 → 7.x)

Only the changes that alter *advice*, not the full release notes. Check the project's installed version before applying anything here — `npx tsc --version`, or read `typescript` in `package.json`.

## Contents

- [Check the version first](#check-the-version-first)
- [TypeScript 7.0 — the native compiler](#typescript-70--the-native-compiler)
- [TypeScript 6.0 — the deprecation cutover](#typescript-60--the-deprecation-cutover)
- [5.8 — `erasableSyntaxOnly`](#58--erasablesyntaxonly)
- [5.7 — uninitialized variable checks](#57--uninitialized-variable-checks)
- [5.6 — iterator and truthiness checks](#56--iterator-and-truthiness-checks)
- [5.5 — inferred type predicates](#55--inferred-type-predicates)
- [Advice that aged out](#advice-that-aged-out)

## Check the version first

```bash
npx tsc --version
```

Most of the guidance in this skill is version-independent, but the items below are not. Recommending `erasableSyntaxOnly` to a project on 5.4 wastes everyone's time, and hand-writing a type predicate on 5.9 adds noise.

## TypeScript 7.0 — the native compiler

7.0 replaced the JavaScript compiler with a native (Go) port. What actually matters day to day:

- **`tsc` is still the command.** The `typescript` package exposes `bin/tsc` as before, so `tsc --noEmit` remains the right way to reproduce an error. There is no separate `tsgo` binary to invoke in a released 7.x — that name belonged to the `@typescript/native-preview` package during the preview period.
- **Type-checking semantics are intended to match** the 6.x line. Treat a genuine behavioural difference as a bug worth reporting upstream, not as something to design around.
- **Speed changes workflow.** Full-project checks are cheap enough that "run `tsc --noEmit` and read the real error" beats reasoning from a snippet, even on large repos. Lean on it harder than you would have on 5.x.
- **Compiler-API consumers are the actual breakage surface.** Custom transformers, ts-morph-style tooling, and anything importing from `typescript` directly may need work. That's build tooling, not type design — out of scope for this skill.

## TypeScript 6.0 — the deprecation cutover

6.0 is the final JavaScript-based release and exists mainly to remove long-deprecated options and align behaviour with 7.0. If a project is on 6.x and something stopped compiling after the upgrade, suspect a removed `tsconfig` option before suspecting a type bug.

## 5.8 — `erasableSyntaxOnly`

`--erasableSyntaxOnly` rejects TypeScript syntax that emits runtime code, so a file can be stripped rather than compiled (what Node's native TS support and `tsx` do). It bans:

- `enum` declarations
- `namespace`/`module` blocks with runtime members
- constructor parameter properties (`constructor(private x: string) {}`)
- non-declare class fields relying on TS-only emit

This makes the `as const` object pattern the default choice over `enum` rather than merely the recommended one — see [as-const-typeof.md](as-const-typeof.md). When a project sets this flag, a suggestion built on `enum` simply won't compile.

## 5.7 — uninitialized variable checks

TypeScript now reports variables that are never initialized before use in more positions than it used to. When diagnosing "used before assigned" style errors, confirm the target version before assuming the code was always broken. See [error-diagnosis.md](error-diagnosis.md).

## 5.6 — iterator and truthiness checks

Two additions that surface as new errors on upgrade:

- **Disallowed nullish and truthy checks** — expressions that are always truthy or always nullish (a common typo class, e.g. `if (/re/)`) are now errors rather than silently-dead branches.
- **Strict builtin iterator checks** — tighter typing on `Iterator`/`IteratorResult` helpers, which can surface in generic code that hand-rolls iterables.

## 5.5 — inferred type predicates

The single most advice-changing release for this skill. A function with no explicit return type that returns a narrowing boolean expression gets a `value is T` predicate inferred automatically:

```typescript
// TS infers `v is number` — no annotation, no helper needed
const nums = [1, null, 2].filter((v) => v !== null);
```

Full rules, and the four cases where inference still doesn't apply, are in [type-narrowing.md](type-narrowing.md). Note that assertion signatures (`asserts value is T`) are still never inferred — see [assertion-functions.md](assertion-functions.md).

Also in 5.5: control-flow narrowing through constant indexed access, which makes some of the index-access workarounds in [array-index-access.md](array-index-access.md) unnecessary.

## Advice that aged out

| Old advice | Status |
|---|---|
| Always annotate `value is T` on a guard | Superseded on 5.5+. Annotate only when inference can't apply |
| Write a `isNotNull` helper to filter nullables | Optional on 5.5+. Inline callbacks narrow on their own |
| Prefer `enum` for a closed set of values | Unusable under `erasableSyntaxOnly` (5.8+). Use `as const` objects |
| `F.Narrow` / `ts-toolbelt` for literal preservation | Superseded since 5.0 by `const` type parameters — see [deep-inference.md](deep-inference.md) |
| Invoke the native compiler as `tsgo` | Preview-only name. Released 7.x uses `tsc` |

## See also

- [type-narrowing.md](type-narrowing.md) — inferred predicates in full
- [as-const-typeof.md](as-const-typeof.md) — the `enum` alternative
- [error-diagnosis.md](error-diagnosis.md) — reading compiler output
- [deep-inference.md](deep-inference.md) — `const` type parameters
