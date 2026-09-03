---
name: typescript-versions
description: What changed in TypeScript 5.5 through 7.x that affects type-level design and error diagnosis, including 6.0 default changes and 7.0's native compiler
---

# TypeScript Version Notes (5.5 → 7.x)

Only the changes that alter _advice_, not the full release notes. Check the project's installed version before applying anything here — `npx tsc --version`, or read `typescript` in `package.json`.

## Contents

- [Check the version first](#check-the-version-first)
- [TypeScript 7.0 — the native compiler](#typescript-70--the-native-compiler)
- [TypeScript 6.0 — the deprecation cutover](#typescript-60--the-deprecation-cutover)
- [5.9 — inference tightening, `import defer`, `--module node20`](#59--inference-tightening-import-defer---module-node20)
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
- **Type-checking semantics match 6.0 with `--stableTypeOrdering` on** and no `ignoreDeprecations` set. Every 6.0 default change and deprecation (below) is a hard error in 7.0. Treat any other behavioural difference as a bug worth reporting upstream, not as something to design around.
- **Speed changes workflow.** Full-project checks are cheap enough that "run `tsc --noEmit` and read the real error" beats reasoning from a snippet, even on large repos. Lean on it harder than you would have on 5.x.
- **No programmatic compiler API in 7.0.** `import ts from "typescript"` has nothing to import until 7.1 ships a new API. Tools that need one (typescript-eslint, ts-morph, custom transformers, Volar-based editor tooling for Vue/Svelte/Astro/MDX, Angular template checking) stay on 6.x via the bridge package `@typescript/typescript6`, which re-exports the 6.0 API and ships a `tsc6` binary. The documented layout aliases it in as `typescript` and installs 7.0 under another name so `npx tsc` is native and the tooling keeps its API. For type-design work this means: check with 7.0's `tsc`, but expect the editor in a Vue/Svelte/Astro project to still be reporting 6.x diagnostics.
- **Template literal inference splits on Unicode code points.** With `type HeadTail<S> = S extends` `` `${infer Head}${infer Tail}` `` `? [Head, Tail] : never`, `HeadTail<"😀abc">` is now `["😀", "abc"]`; through 6.x it was `["\ud83d", "\ude00abc"]`. Recursive `Length`/`Reverse`/`Split` utilities change their answers for non-BMP input — see [template-literal-types.md](template-literal-types.md).
- **JS files are checked like TS files.** Closure-style JSDoc (`@enum`, `@class`, bare `?`, postfix `!`, `function(string): void`) is no longer specially recognized — relevant when migrating JavaScript toward types.

## TypeScript 6.0 — the deprecation cutover

6.0 is the final JavaScript-based release and exists mainly to remove long-deprecated options and align behaviour with 7.0. If a project is on 6.x and something stopped compiling after the upgrade, suspect a default change or removed `tsconfig` option before suspecting a type bug.

- **Defaults flipped:** `strict: true`, `module: "esnext"`, `target` floats to the latest stable ES version (`es2025` at release), `types: []` (only listed `@types` packages become globals; `["*"]` restores the old sweep), and `rootDir` is the `tsconfig.json` directory instead of the inferred common source root. The two symptoms to recognize: a sudden wave of strict-mode errors in a project that never set `strict`, and `Cannot find name 'describe'`/`process` because `@types/*` are no longer auto-included.
- **Removed with no-op behaviour under `ignoreDeprecations: "6.0"`, hard errors in 7.0:** `target: es5`, `downlevelIteration`, `moduleResolution: node`/`node10`/`classic`, `module: amd`/`umd`/`systemjs`/`none`, `baseUrl`, `outFile`, `esModuleInterop: false`, `alwaysStrict: false`, `module` keyword for namespaces, `assert` on imports (use `with`).
- **`--stableTypeOrdering`** makes 6.0 sort types and symbols the way 7.0's parallel checker does. Union order in declaration emit and error text stops depending on declaration order, and an error that appears only under the flag is an inference that happened to work by luck — fix it with an explicit type argument (`call<Explicit>(…)`) or a variable annotation. Diagnostic aid only (up to 25% slower); it is always on and unconfigurable in 7.0.
- **Less context-sensitivity for `this`-less functions.** A function whose parameters lack annotations used to be skipped during type-argument inference whenever it _could_ reference `this` (method syntax, `function` expressions). 6.0 only treats it as context-sensitive if the body actually uses `this`, so `callIt({ consume(y) { … }, produce(x: number) { … } })` now infers `y` regardless of property order. Expect fewer `'y' is of type 'unknown'` errors on upgrade, and a few generic calls (notably generic JSX) that now need an explicit type argument.

## 5.9 — inference tightening, `import defer`, `--module node20`

- **Type-argument inference no longer leaks type variables** ([microsoft/TypeScript#61668](https://github.com/microsoft/TypeScript/pull/61668)). Some calls that inferred a leaked `T` now report errors or produce a different type. The fix is almost always an explicit type argument on the generic call; recommend that before restructuring the types.
- **`import defer * as ns from "./mod"`** defers module evaluation until a member of `ns` is first accessed. Namespace form only — `import defer { x }` and `import defer x` are syntax errors — and it is never downleveled, so it needs `--module esnext` or `preserve` and a runtime or bundler that implements it.
- **`--module node20`** is a frozen snapshot of Node 20 resolution (implies `--target es2023`), unlike `nodenext`, which keeps moving. Suggest it when a project wants resolution that will not change under its feet.
- **`lib.d.ts`:** `ArrayBuffer` is no longer a supertype of typed arrays, so `Buffer`/`Uint8Array` passed where `ArrayBuffer` is expected now errors. Write `Uint8Array<ArrayBuffer>` explicitly, pass `.buffer`, or update `@types/node`.

## 5.8 — `erasableSyntaxOnly`

`--erasableSyntaxOnly` rejects TypeScript syntax that emits runtime code, so a file can be stripped rather than compiled (what Node's native TS support and `tsx` do). It bans:

- `enum` declarations
- `namespace`/`module` blocks with runtime members
- constructor parameter properties (`constructor(private x: string) {}`)
- non-ECMAScript `import x = require(...)` / `import x = ns.y` aliases and `export =` assignments

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
| --- | --- |
| Always annotate `value is T` on a guard | Superseded on 5.5+. Annotate only when inference can't apply |
| Write a `isNotNull` helper to filter nullables | Optional on 5.5+. Inline callbacks narrow on their own |
| Prefer `enum` for a closed set of values | Unusable under `erasableSyntaxOnly` (5.8+). Use `as const` objects |
| `F.Narrow` / `ts-toolbelt` for literal preservation | Superseded since 5.0 by `const` type parameters — see [deep-inference.md](deep-inference.md) |
| Invoke the native compiler as `tsgo` | Preview-only name. Released 7.x uses `tsc` |
| Count string length at the type level by peeling `${infer H}${infer T}` | Counts UTF-16 code units on ≤6.x, code points on 7.0+ — see [template-literal-types.md](template-literal-types.md) |

## See also

- [type-narrowing.md](type-narrowing.md) — inferred predicates in full
- [as-const-typeof.md](as-const-typeof.md) — the `enum` alternative
- [error-diagnosis.md](error-diagnosis.md) — reading compiler output
- [deep-inference.md](deep-inference.md) — `const` type parameters
