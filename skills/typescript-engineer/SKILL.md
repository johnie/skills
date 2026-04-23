---
name: typescript-engineer
description: Resolve TypeScript errors, eliminate `any`, and design complex types (generics, conditional, mapped, template literal, branded/opaque). Use for type-inference problems, `infer` / `extends` questions, utility types (`Partial`, `Record`, `ReturnType`, `Awaited`, `NoInfer`), `satisfies`, function overloads, declaration merging, and strict-mode refactors.
---

# TypeScript Engineer

Type-level design, compiler-error diagnosis, and strict-safety refactoring. This skill routes the user's intent to one of fifteen focused rule files in `references/`; don't try to answer from SKILL.md alone on anything non-trivial.

## When to use

- TypeScript compiler errors the user can't untangle
- Eliminating `any` / `unknown` / unchecked casts
- Designing generics, conditional types, mapped types, template literal types
- Refactoring a file/module toward stricter types
- Explaining a TS concept with concrete before/after examples

## When NOT to use

- Runtime validation — use Zod / io-ts / Valibot (separate concern; types won't validate unknown input at the boundary).
- Refactors that change runtime behavior — this skill preserves behavior. If the change is behavioral, use a refactoring / testing skill.
- Build tooling issues (`tsc` not found, wrong `tsconfig` paths, module resolution not finding files) — that's config, not type-level design.
- JavaScript-only questions where types aren't involved.

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
|---|---|
| `as const`, `typeof`, `satisfies`, enum alternative, derive types from values | [as-const-typeof.md](references/as-const-typeof.md) |
| array element type, `[number]` index | [array-index-access.md](references/array-index-access.md) |
| `Partial`, `Record`, `Omit`, `Pick`, `ReturnType`, `Parameters`, `Awaited`, `NoInfer`, utility type | [utility-types.md](references/utility-types.md) |
| generic, constraint, `extends`, type parameter | [generics-basics.md](references/generics-basics.md) |
| builder pattern, chainable, fluent API | [builder-pattern.md](references/builder-pattern.md) |
| deep inference, `const` type parameter, `F.Narrow`, preserve literal types | [deep-inference.md](references/deep-inference.md) |
| conditional type, `extends ? :`, distribute | [conditional-types.md](references/conditional-types.md) |
| `infer`, extract inner type | [infer-keyword.md](references/infer-keyword.md) |
| template literal type, string manipulation at type level | [template-literal-types.md](references/template-literal-types.md) |
| mapped type, `in keyof`, transform properties | [mapped-types.md](references/mapped-types.md) |
| brand type, opaque type, nominal typing, validated ID | [opaque-types.md](references/opaque-types.md) |
| narrowing, `typeof`, `instanceof`, `in`, discriminated union, type guard, `is` | [type-narrowing.md](references/type-narrowing.md) |
| assertion function, `asserts value is`, validate-and-throw | [assertion-functions.md](references/assertion-functions.md) |
| overload, multiple signatures | [function-overloads.md](references/function-overloads.md) |
| type error, diagnostic, `ts(…)`, "not assignable" | [error-diagnosis.md](references/error-diagnosis.md) |

## Working style

- **Reproduce first.** Run `tsc --noEmit` on the user's code before proposing a fix so you're reasoning about the real error, not a guess.
- **Simplest type that works.** Don't reach for conditional/mapped/template-literal machinery when a plain generic or utility type would do. Complexity has a cost to everyone who reads the code later.
- **Validate type-level code.** Use the `Expect<Equal<A, B>>` pattern (or similar) to prove the types are what you claim. Types that compile but are wrong are worse than runtime bugs — they silently lie.
- **Explain why the type works.** Dense types are hard to read; a one-line comment naming the technique (`// distributive conditional over UnionKey`) pays for itself.

## One snippet per category

These are smell-tests — read them, then jump to the reference file for the full pattern.

### Eliminate `any` with a generic

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
// getProperty({ name: "Alice" }, "name") → inferred as string
```

See [generics-basics.md](references/generics-basics.md).

### Narrow an unknown response at the boundary

```ts
function isUser(value: unknown): value is { id: number; name: string } {
  return typeof value === "object" && value !== null
      && "id" in value && "name" in value;
}
```

See [type-narrowing.md](references/type-narrowing.md) and [assertion-functions.md](references/assertion-functions.md).

### Preserve literals while enforcing shape

```ts
const palette = {
  red:   [255, 0, 0],
  green: [0, 255, 0],
} as const satisfies Record<string, readonly [number, number, number]>;
// palette.red → readonly [255, 0, 0]
```

See [as-const-typeof.md](references/as-const-typeof.md).

## Reference map

Core patterns — [as-const-typeof](references/as-const-typeof.md) · [array-index-access](references/array-index-access.md) · [utility-types](references/utility-types.md)

Generics — [generics-basics](references/generics-basics.md) · [builder-pattern](references/builder-pattern.md) · [deep-inference](references/deep-inference.md)

Type-level programming — [conditional-types](references/conditional-types.md) · [infer-keyword](references/infer-keyword.md) · [template-literal-types](references/template-literal-types.md) · [mapped-types](references/mapped-types.md)

Safety — [opaque-types](references/opaque-types.md) · [type-narrowing](references/type-narrowing.md) · [assertion-functions](references/assertion-functions.md) · [function-overloads](references/function-overloads.md)

Debugging — [error-diagnosis](references/error-diagnosis.md)
