---
name: typescript-engineer
description: Resolve TypeScript errors, eliminate `any`, and design complex types (generics, conditional, mapped, template literal, branded/opaque). Use for type-inference problems, `infer` / `extends` questions, utility types (`Partial`, `Record`, `ReturnType`, `Awaited`, `NoInfer`), `satisfies`, function overloads, declaration merging, and strict-mode refactors.
when_to_use: Also applies to explaining or teaching a type-level concept with before/after examples, and to migrating JavaScript files to TypeScript. Covers TypeScript 5.x through 7.x, including inferred type predicates, `erasableSyntaxOnly`, and type-checking or inference breakage after a 6.0/7.0 upgrade. Skip for runtime validation of unknown input (use Zod, io-ts, or Valibot), refactors that change runtime behavior, build tooling and config issues (`tsc` not found, wrong `tsconfig` paths, module resolution not finding files), and JavaScript-only questions where types are not involved.
allowed-tools:
  - Bash(tsc *)
  - Bash(npx tsc *)
  - Bash(pnpm tsc *)
  - Bash(pnpm exec tsc *)
  - Read
  - Edit
  - Grep
  - Glob
---

# TypeScript Engineer

Type-level design, compiler-error diagnosis, and strict-safety refactoring that preserves runtime behavior. Load the matching rule file in `references/` before diagnosing an error or recommending a type design.

Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

## Decision tree

Identify the user's goal first, then load the matching rule file on demand.

```text
1. "Something doesn't compile / tsc is red"
   → start at references/error-diagnosis.md
   → then the rule file that matches the error category

2. "Design a type / API for X"
   → references/generics-basics.md (always the foundation)
   → then conditional-types.md / mapped-types.md / template-literal-types.md
     depending on whether you need branching, per-key transforms, or string ops

3. "Remove any / tighten types in this code"
   → references/type-narrowing.md (for input validation)
   → references/utility-types.md (for structural transforms)
   → references/generics-basics.md (when a function/class needs to be generic)

4. "Explain / teach concept X"
   → match X in the routing table below
```

## Routing table

Match keywords in the user's request to load the right rule file.

| Keyword / topic | Rule file |
| --- | --- |
| `as const`, `typeof`, `satisfies`, enum alternative, derive types from values | [as-const-typeof.md](references/as-const-typeof.md) |
| array element type, `[number]` index | [array-index-access.md](references/array-index-access.md) |
| `Partial`, `Record`, `Omit`, `Pick`, `ReturnType`, `Parameters`, `Awaited`, `NoInfer`, utility type | [utility-types.md](references/utility-types.md) |
| generic, constraint, `extends`, type parameter | [generics-basics.md](references/generics-basics.md) |
| builder pattern, chainable, fluent API | [builder-pattern.md](references/builder-pattern.md) |
| deep inference, `const` type parameter, preserve literal types, `F.Narrow` in old code | [deep-inference.md](references/deep-inference.md) |
| conditional type, `extends ? :`, distribute | [conditional-types.md](references/conditional-types.md) |
| `infer`, extract inner type | [infer-keyword.md](references/infer-keyword.md) |
| template literal type, string manipulation at type level | [template-literal-types.md](references/template-literal-types.md) |
| mapped type, `in keyof`, transform properties | [mapped-types.md](references/mapped-types.md) |
| brand type, opaque type, nominal typing, validated ID | [opaque-types.md](references/opaque-types.md) |
| narrowing, `typeof`, `instanceof`, `in`, discriminated union, type guard, `is` | [type-narrowing.md](references/type-narrowing.md) |
| assertion function, `asserts value is`, validate-and-throw | [assertion-functions.md](references/assertion-functions.md) |
| overload, multiple signatures | [function-overloads.md](references/function-overloads.md) |
| type test, prove a type, assert a type, `Expect`, `Equal`, `@ts-expect-error` | [type-testing.md](references/type-testing.md) |
| type error, diagnostic, `ts(…)`, "not assignable" | [error-diagnosis.md](references/error-diagnosis.md) |
| TS version, "which version added", 5.5 / 5.9 / 6 / 7, `erasableSyntaxOnly`, `stableTypeOrdering`, native compiler, no compiler API, upgrade broke my build | [typescript-versions.md](references/typescript-versions.md) |

## Working style

- **Check the version.** Read `typescript` in `package.json` (or run `npx tsc --version`) before recommending anything version-gated. [typescript-versions.md](references/typescript-versions.md) lists what changed.
- **Reproduce first.** Run `tsc --noEmit` on the user's code before proposing a fix so you're reasoning about the real error, not a guess. Prefer a real run over reasoning from a snippet.
- **Simplest type that works.** Don't reach for conditional/mapped/template-literal machinery when a plain generic or utility type would do. Complexity has a cost to everyone who reads the code later.
- **Validate type-level code.** Compiling alone does not prove that a type models the intended behavior. Use the `Expect<Equal<A, B>>` pattern (or similar) to prove the types are what you claim; see [type-testing.md](references/type-testing.md).
- **Explain why the type works.** When a type is hard to read, add a one-line comment naming the technique (`// distributive conditional over UnionKey`).
