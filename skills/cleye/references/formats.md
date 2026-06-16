# Flag Formats & Custom Types

A flag's `type` is any function that accepts a string and returns the parsed value. To validate input, **throw** inside the type function — cleye surfaces the error to the user. Never return an `Error` value; cleye expects type functions to throw.

## Custom type functions

A custom type both validates and narrows the resulting type. Here a `Size` type narrows the flag to `"small" | "medium" | "large"`:

```typescript
const possibleSizes = ["small", "medium", "large"] as const;

type Sizes = (typeof possibleSizes)[number]; // "small" | "medium" | "large"

const Size = (size: Sizes) => {
    if (!possibleSizes.includes(size)) {
        throw new Error(`Invalid size: "${size}"`);
    }
    return size;
};

const argv = cli({
    flags: {
        size: {
            type: Size,
            description: "Size of the pizza (small, medium, large)"
        }
    }
});

// $ my-script --size large
argv.flags.size; // => "large"  ("small" | "medium" | "large")
```

Wrap a custom type in an array (`type: [Size]`) to accept multiple validated values.

## `cleye/formats` helpers

`cleye/formats` is a tree-shakable subpath with ready-made type-function helpers for common flag shapes. Import only what you need.

```typescript
import { oneOf, commaList, integer, float, range, url } from "cleye/formats";

cli({
    flags: {
        format: { type: oneOf("json", "yaml", "csv") }, // => 'json' | 'yaml' | 'csv'
        tags:   { type: commaList(String) },            // => string[]
        port:   { type: range(1024, 65_535) },          // => number, validated in range
        count:  { type: integer() },                    // => number (integer only)
        ratio:  { type: float() },                      // => number (finite float)
        apiUrl: { type: url() }                          // => URL object
    }
});
```

| Helper | Return type | Description |
|---|---|---|
| `oneOf(...values)` | Union of the given string literals | Throws if the value is not in the list. |
| `commaList(itemType)` | `T[]` | Splits on `,`, trims whitespace, maps each item through `itemType`. |
| `integer()` | `number` | Parses a base-10 integer. Throws on floats or non-numeric input. |
| `float()` | `number` | Parses a finite float. Throws on non-finite or non-numeric input. |
| `range(min, max)` | `(input: string) => number` | Returns a parser validating the input is a number in `[min, max]`. |
| `url()` | `URL` | Parses with `new URL()`; returns a `URL` so callers get `.host`, `.pathname`, etc. |

## When to use which

- **`oneOf(...)`** — a fixed set of string literals. Simpler than a hand-written choice parser and narrows the type automatically.
- **`commaList(itemType)`** — comma-delimited input in a single token (`--tags a,b,c`). Use a `[Type]` array flag instead when you want repeated flags (`--tag a --tag b`).
- **`integer()` / `float()` / `range(...)`** — numeric input with stricter validation than the bare `Number` constructor.
- **`url()`** — when you want a `URL` object rather than a raw string.
- **Custom function** — anything not covered above, especially domain-specific validation or async-free transformation.

## Defaults and parsing

A `default` is the already-typed value (not a raw string), so it should match the flag's parsed type:

```typescript
flags: {
    format: { type: oneOf("json", "yaml"), default: "json" },
    port:   { type: integer(), default: 3000 }
}
```

For array flags, the default is an array of typed values:

```typescript
flags: {
    tags: { type: [String], default: ["a", "b"] }
}
```
