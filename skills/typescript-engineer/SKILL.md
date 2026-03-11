---
name: typescript-engineer
description: Designs complex generic types, refactors `any` to strict alternatives, creates type guards and utility types, resolves TypeScript compiler errors, and explains type-level concepts. Use when the user asks about TypeScript (TS) types, generics, type inference, type guards, removing `any` types, strict typing, type errors, `infer`, `extends`, conditional types, mapped types, template literal types, branded/opaque types, `satisfies`, `unknown`, function overloads, declaration merging, strict mode, or utility types like `Partial`, `Record`, `ReturnType`, `Awaited`, and `NoInfer`.
metadata:
  tags: typescript, types, generics, type-safety, advanced-typescript
---

## When to use

Use this skill for:
- TypeScript errors and type challenges
- Eliminating `any` types from codebases
- Complex generics and type inference issues
- Designing new type structures or APIs
- Refactoring for stricter type safety
- Explaining TypeScript concepts

## Intent routing

Identify the user's goal, then follow the matching path.

### Fix errors
1. Run `tsc --noEmit` to capture the full error output
2. Diagnose root cause (unsound inference, missing constraint, implicit `any`, etc.)
3. Apply fix — consult the routing table below for the relevant rule
4. Run `tsc --noEmit` again to confirm clean compilation

### Design types
1. Clarify the data shape and API surface with the user
2. Pick the right technique (generics, conditional types, mapped types, etc.)
3. Build incrementally — start simple, add complexity only when needed
4. Validate with type tests (`Expect<Equal<…>>` pattern)

### Refactor for safety
1. Audit the target file(s) for `any`, unvalidated casts, and loose types
2. Plan replacements — map each `any` to its proper type
3. Apply file-by-file, validating each replacement still satisfies call sites
4. Confirm with `tsc --noEmit`

### Explain / teach
1. Identify the concept the user is asking about
2. Load the relevant rule file from the routing table
3. Explain with concrete before/after examples
4. Connect to related concepts

## Routing table

Match keywords in the user's request to load the right rule file.

| Keyword / topic | Rule file |
|---|---|
| `as const`, `typeof`, `satisfies`, enum alternative, derive types from values | [as-const-typeof.md](rules/as-const-typeof.md) |
| array element type, `[number]` index | [array-index-access.md](rules/array-index-access.md) |
| `Partial`, `Record`, `Omit`, `Pick`, `ReturnType`, `Parameters`, `Awaited`, `NoInfer`, utility type | [utility-types.md](rules/utility-types.md) |
| generic, constraint, `extends`, type parameter | [generics-basics.md](rules/generics-basics.md) |
| builder pattern, chainable, fluent API | [builder-pattern.md](rules/builder-pattern.md) |
| deep inference, `const` type parameter, `F.Narrow`, preserve literal types | [deep-inference.md](rules/deep-inference.md) |
| conditional type, `extends ? :`, distribute | [conditional-types.md](rules/conditional-types.md) |
| `infer`, extract inner type | [infer-keyword.md](rules/infer-keyword.md) |
| template literal type, string manipulation at type level | [template-literal-types.md](rules/template-literal-types.md) |
| mapped type, `in keyof`, transform properties | [mapped-types.md](rules/mapped-types.md) |
| brand type, opaque type, nominal typing, validated ID | [opaque-types.md](rules/opaque-types.md) |
| narrowing, `typeof`, `instanceof`, `in`, discriminated union, type guard, `is` | [type-narrowing.md](rules/type-narrowing.md) |
| assertion function, `asserts value is`, validate-and-throw | [assertion-functions.md](rules/assertion-functions.md) |
| overload, multiple signatures | [function-overloads.md](rules/function-overloads.md) |
| type error, diagnostic, `ts(…)`, "not assignable" | [error-diagnosis.md](rules/error-diagnosis.md) |

## Quick Examples

### Eliminating `any` with generics

**Before**
```ts
function getProperty(obj: any, key: string): any {
  return obj[key];
}
```

**After**
```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
// getProperty({ name: "Alice" }, "name") → inferred as string ✓
```

### Narrowing an unknown API response

**Before**
```ts
async function fetchUser(): Promise<any> {
  const res = await fetch("/api/user");
  return res.json();
}
```

**After**
```ts
interface User { id: number; name: string }

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

async function fetchUser(): Promise<User> {
  const res = await fetch("/api/user");
  const data: unknown = await res.json();
  if (!isUser(data)) throw new Error("Invalid user shape");
  return data;
}
```

### Enforcing shape with `satisfies`

**Before**
```ts
// Annotation loses literal types
const palette: Record<string, [number, number, number]> = {
  red: [255, 0, 0],
  green: [0, 255, 0],
};
palette.red; // [number, number, number] — literals lost
```

**After**
```ts
const palette = {
  red: [255, 0, 0],
  green: [0, 255, 0],
} as const satisfies Record<string, readonly [number, number, number]>;

palette.red; // readonly [255, 0, 0] — literals preserved, shape enforced ✓
```

## Reference

Read individual rule files for detailed explanations and code examples:

### Core Patterns
- [rules/as-const-typeof.md](rules/as-const-typeof.md) — Deriving types from runtime values using `as const`, `typeof`, and `satisfies`
- [rules/array-index-access.md](rules/array-index-access.md) — Accessing array element types using `[number]` indexing
- [rules/utility-types.md](rules/utility-types.md) — Built-in utility types: Parameters, ReturnType, Awaited, Omit, Partial, Record, NoInfer

### Advanced Generics
- [rules/generics-basics.md](rules/generics-basics.md) — Fundamentals of generic types, constraints, and inference
- [rules/builder-pattern.md](rules/builder-pattern.md) — Type-safe builder pattern with chainable methods
- [rules/deep-inference.md](rules/deep-inference.md) — Achieving deep type inference with `const` type parameters and `F.Narrow`

### Type-Level Programming
- [rules/conditional-types.md](rules/conditional-types.md) — Conditional types for type-level if/else logic
- [rules/infer-keyword.md](rules/infer-keyword.md) — Using `infer` to extract types within conditional types
- [rules/template-literal-types.md](rules/template-literal-types.md) — String manipulation at the type level
- [rules/mapped-types.md](rules/mapped-types.md) — Creating new types by transforming existing type properties

### Type Safety Patterns
- [rules/opaque-types.md](rules/opaque-types.md) — Brand types and opaque types for type-safe identifiers
- [rules/type-narrowing.md](rules/type-narrowing.md) — Narrowing types through control flow analysis
- [rules/assertion-functions.md](rules/assertion-functions.md) — Assertion functions that validate and narrow types
- [rules/function-overloads.md](rules/function-overloads.md) — Using function overloads for complex function signatures

### Debugging
- [rules/error-diagnosis.md](rules/error-diagnosis.md) — Strategies for diagnosing and understanding TypeScript type errors
