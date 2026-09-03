---
name: deep-inference
description: Achieving deep type inference with const type parameters and as const
---

# Deep Type Inference

## Contents

- [The Problem: Type Widening](#the-problem-type-widening)
- [Solution 1: `const` Type Parameter (TS 5.0+) — Recommended](#solution-1-const-type-parameter-ts-50--recommended)
- [Solution 2: User-Provided `as const`](#solution-2-user-provided-as-const)
- [Legacy (pre-5.0)](#legacy-pre-50)
- [Practical Example: Type-Safe Router](#practical-example-type-safe-router)
- [Combining with Conditional Types](#combining-with-conditional-types)
- [Comparison of Techniques](#comparison-of-techniques)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)

## Overview

By default, TypeScript widens types when inferring objects and arrays. For advanced type-safe APIs, you often need to preserve literal types deeply within nested structures. This document covers techniques for achieving deep inference.

## The Problem: Type Widening

```typescript
const makeRouter = <TConfig>(config: TConfig) => {
  return { config };
};

const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
});

// TConfig is inferred as:
// {
//   "/": {};
//   "/search": {
//     search: string[]; // NOT ["query", "page"]!
//   };
// }
```

The literal tuple `["query", "page"]` is widened to `string[]`, losing type information.

## Solution 1: `const` Type Parameter (TS 5.0+) — Recommended

TypeScript 5.0 introduced `const` type parameters — the modern, zero-dependency solution:

```typescript
const makeRouter = <const TConfig extends BaseRouterConfig>(
  config: TConfig
) => {
  return { config };
};

// TConfig is automatically narrowed like as const
const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
});
```

### Benefits

- No external library needed
- Built into TypeScript
- Clean syntax
- Works with constraints

### When Deep Inference Matters

**Configuration objects:**

```typescript
const createTheme = <const TTheme extends Record<string, string>>(
  theme: TTheme
): TTheme => theme;

const theme = createTheme({
  primary: "#0066cc",
  secondary: "#666666",
});

// theme.primary is "#0066cc", not string
```

**Route definitions:**

```typescript
const routes = defineRoutes({
  home: { path: "/" },
  user: { path: "/users/:id" },
  post: { path: "/posts/:postId" },
});

// Route names and paths are literal types
```

**Event systems:**

```typescript
const events = createEventMap({
  click: (x: number, y: number) => {},
  keydown: (key: string) => {},
});

// Event names are literal unions, handlers are properly typed
```

## Solution 2: User-Provided `as const`

Require users to add `as const` at the call site:

```typescript
const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
} as const);

// Now TConfig preserves literals:
// {
//   readonly "/": {};
//   readonly "/search": {
//     readonly search: readonly ["query", "page"];
//   };
// }
```

### Drawbacks

- Users must remember to add `as const`
- Types become readonly (may require type adjustments)
- Easy to forget, leading to subtle bugs

## Legacy (pre-5.0)

Before `const` type parameters existed, libraries forced literal inference by wrapping the parameter type in a recursive conditional such as `F.Narrow<T>` from `ts-toolbelt` or a hand-written `Narrow<T>` that mapped strings to literals and arrays to tuples. Those helpers still appear in older codebases — recognize `config: F.Narrow<TConfig>` or `config: Narrow<TConfig>` as "preserve literals" and migrate to `<const TConfig extends …>(config: TConfig)`, which is built in, needs no dependency, and handles the edge cases the custom versions missed. This skill covers 5.x through 7.x, so there is no supported target where the legacy form is still required — see [typescript-versions.md](typescript-versions.md).

## Practical Example: Type-Safe Router

```typescript
type BaseRouterConfig = Record<string, { search?: string[] }>;

type TupleToSearchParams<T extends string[]> = {
  [K in T[number]]?: string;
};

const makeRouter = <const TConfig extends BaseRouterConfig>(
  config: TConfig
) => {
  return {
    config,
    goTo: <TRoute extends keyof TConfig>(
      route: TRoute,
      search?: TConfig[TRoute]["search"] extends string[]
        ? TupleToSearchParams<TConfig[TRoute]["search"]>
        : never
    ) => {
      // Implementation
    },
  };
};

const router = makeRouter({
  "/": {},
  "/dashboard": {
    search: ["page", "perPage", "sort"],
  },
});

// Fully type-safe!
router.goTo("/dashboard", {
  page: "1",
  perPage: "10",
  sort: "name", // Must be one of the defined search params
});

// Error: "invalid" is not a valid search param
router.goTo("/dashboard", { invalid: "value" });
```

## Combining with Conditional Types

Deep inference enables powerful conditional type logic:

```typescript
const makeApi = <const TConfig extends Record<string, { returns: string }>>(
  config: TConfig
) => {
  return {
    call: <TMethod extends keyof TConfig>(
      method: TMethod
    ): TConfig[TMethod]["returns"] => {
      // Implementation
      return "" as any;
    },
  };
};

const api = makeApi({
  getUser: { returns: "User" },
  getPost: { returns: "Post" },
});

const user = api.call("getUser"); // Type: "User"
const post = api.call("getPost"); // Type: "Post"
```

## Comparison of Techniques

| Technique | Pros | Cons |
| --- | --- | --- |
| `const` type param | Built-in, clean, recommended | TypeScript 5.0+ only |
| `as const` | No dependencies | Manual, readonly types |
| `F.Narrow` / custom `Narrow<T>` | Worked before 5.0 | Legacy; replace with `const` type params |

## Common Pitfalls

### Forgetting Constraints

```typescript
// Without constraint, inference has no base to work with
const bad = <const TConfig>(config: TConfig) => config;

// With constraint, inference works properly
const good = <const TConfig extends Record<string, unknown>>(config: TConfig) =>
  config;
```

### Readonly Arrays

With `as const`, arrays become `readonly`:

```typescript
const config = {
  values: [1, 2, 3],
} as const;

// config.values is readonly [1, 2, 3]
config.values.push(4); // Error: Property 'push' does not exist on type 'readonly [1, 2, 3]'
```

### Deep Nesting Performance

Very deeply nested types can slow down the compiler:

```typescript
// May cause performance issues with extremely deep nesting
type DeepConfig = {
  level1: {
    level2: {
      level3: {
        // ... many more levels
      };
    };
  };
};
```

## Best Practices

1. **Use `const` type parameters** as the default approach (TS 5.0+)
2. **Fall back to `as const`** for simple, user-provided configs
3. **Add proper constraints** to guide inference
4. **Test with complex examples** to ensure inference works
5. **Document the inference behavior** for API consumers

Code that still wraps parameters in `F.Narrow<T>` or a hand-rolled `Narrow<T>` is a migration target, not a pattern to copy — see [Legacy (pre-5.0)](#legacy-pre-50).
