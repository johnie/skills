---
name: type-testing
description: Prove type-level code is correct with Expect/Equal assertions and @ts-expect-error
---

# Type Testing

## Overview

Types that compile but are subtly wrong are worse than runtime bugs — they silently lie to every
caller. When you write non-trivial type-level code (conditional types, mapped types, `infer`
extraction), assert the result is what you claim instead of eyeballing a hover tooltip. These
assertions run at compile time and cost nothing at runtime.

## The `Equal` / `Expect` pattern

`Equal<X, Y>` resolves to `true` only when `X` and `Y` are *exactly* the same type (it checks
mutual assignability via the identical-function-signature trick, so it catches differences a plain
`extends` would miss). `Expect<T>` then forces that result to be `true` — if it isn't, the line
fails to compile.

```typescript
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

export type Expect<T extends true> = T;
```

Use them to pin down the output of a type you designed:

```typescript
type ElementType<T> = T extends readonly (infer U)[] ? U : never;

// These lines are the test. If ElementType ever regresses, the build breaks here.
type _t1 = Expect<Equal<ElementType<string[]>, string>>;
type _t2 = Expect<Equal<ElementType<[1, 2, 3]>, 1 | 2 | 3>>;
```

`Equal` is strict about exactness — `Expect<Equal<{ a: string }, { a: string; b?: number }>>` fails,
which is what you want when verifying a transform produced precisely the right shape.

## Negative cases: `@ts-expect-error`

To prove that something *should not* type-check, mark the line with `@ts-expect-error`. The line
must produce an error; if it ever stops erroring, `@ts-expect-error` itself becomes the error, so the
test still protects you.

```typescript
function greet(name: string) {
  return `Hi ${name}`;
}

// @ts-expect-error — passing a number must be rejected
greet(42);
```

## Where these live

`Equal` / `Expect` aren't in the standard library. Either paste the two-line definition into a local
`type-utils.ts`, or pull them from a published package:

- `@type-challenges/utils` — `Equal`, `Expect`, `NotEqual`, `Alike`
- `expect-type` — a fluent `expectTypeOf(x).toEqualTypeOf<Y>()` API for runtime-test files
- `tsd` / `vitest`'s `expectTypeOf` — type assertions inside your existing test runner

Pick one and keep type tests next to the types they guard, so a refactor that breaks a type also
breaks a visible, named test.
