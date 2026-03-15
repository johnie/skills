# Parsers

Parsers transform raw CLI strings into typed values for flags and positional arguments.

## Current Parser Model

Stricli's current public parser type is effectively:

```typescript
type InputParser<T, CONTEXT> = (this: CONTEXT, input: string) => T | Promise<T>;
```

Important details:

- parsers can be synchronous or asynchronous
- parsers should throw or reject on invalid input
- the parser receives command context through `this`

Do not model parser failures by returning `Error` values — Stricli expects parsers to throw on invalid input, not return errors.

## Built-In Parsers

### `String`

Use `String` when no transformation is needed.

```typescript
flags: {
    host: {
        kind: "parsed",
        parse: String,
        brief: "Hostname",
        optional: true
    }
}
```

### `numberParser`

Prefer `numberParser` over `Number` for numeric input.

```typescript
import { numberParser } from "@stricli/core";

flags: {
    port: {
        kind: "parsed",
        parse: numberParser,
        brief: "Port number"
    }
}
```

### `booleanParser`

Use strict boolean parsing for explicit `true` / `false` style inputs.

```typescript
import { booleanParser } from "@stricli/core";

flags: {
    enabled: {
        kind: "parsed",
        parse: booleanParser,
        brief: "Explicit boolean input",
        optional: true
    }
}
```

### `looseBooleanParser`

Use `looseBooleanParser` when inputs like `yes`, `no`, `1`, or `0` should work.

```typescript
import { looseBooleanParser } from "@stricli/core";

flags: {
    enabled: {
        kind: "parsed",
        parse: looseBooleanParser,
        brief: "Flexible boolean input",
        optional: true
    }
}
```

### `buildChoiceParser`

Use `buildChoiceParser()` when you want parsed-flag behavior but only from a known set of values.

```typescript
import { buildChoiceParser } from "@stricli/core";

const logLevelParser = buildChoiceParser([
    "debug",
    "info",
    "warn",
    "error"
] as const);

flags: {
    level: {
        kind: "parsed",
        parse: logLevelParser,
        brief: "Log level"
    }
}
```

If the type is naturally a string literal union, `kind: "enum"` is often simpler.

## Custom Parsers

### Synchronous Parser

```typescript
const portParser = (input: string): number => {
    const port = Number.parseInt(input, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid port: ${input}`);
    }
    return port;
};
```

### Parser with Context Access

Parsers can use `this` to access injected services.

```typescript
import type { CommandContext, InputParser } from "@stricli/core";

interface AppContext extends CommandContext {
    readonly aliases: Map<string, string>;
}

const aliasParser: InputParser<string, AppContext> = function (input) {
    return this.aliases.get(input) ?? input;
};
```

### Async Parser

Async parsers are supported.

```typescript
import type { CommandContext, InputParser } from "@stricli/core";

interface AppContext extends CommandContext {
    readonly registry: {
        hasProject(name: string): Promise<boolean>;
    };
}

const projectParser: InputParser<string, AppContext> = async function (input) {
    if (!(await this.registry.hasProject(input))) {
        throw new Error(`Unknown project: ${input}`);
    }
    return input;
};
```

### URL Parser

```typescript
const urlParser = (input: string): URL => {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("URL must use http or https");
    }
    return url;
};
```

### JSON Parser

The `as T` cast is a convenience — it does not validate the shape at runtime. Add runtime validation (e.g., with Zod or a type guard) if the parsed structure matters.

```typescript
const jsonParser = <T = unknown>(input: string): T => {
    try {
        return JSON.parse(input) as T;
    } catch {
        throw new Error(`Invalid JSON: ${input}`);
    }
};
```

## When to Parse vs Validate in the Command

Use parsers for:

- converting one input string to one typed value
- synchronous validation of a single input
- async validation of a single input when context makes it practical

Use command logic for:

- cross-argument validation
- validations that depend on multiple flags or positional args together
- workflows where parsing and execution should remain separate for clarity

## Default Values and Parsers

For parsed flags, Stricli parses default strings through the same parser.

```typescript
flags: {
    timeout: {
        kind: "parsed",
        parse: numberParser,
        brief: "Timeout in seconds",
        optional: true,
        default: "30"
    }
}
```

For variadic parsed flags, defaults are arrays of raw strings.

```typescript
flags: {
    include: {
        kind: "parsed",
        parse: String,
        brief: "Paths to include",
        optional: true,
        variadic: true,
        default: ["src", "test"]
    }
}
```

## Best Practices

- prefer `numberParser` over `Number`
- keep parser error messages short and actionable
- use `enum` instead of a parsed choice parser when the type is just a string union
- use context-aware parsers sparingly and only when the dependency really belongs at parse time
- keep cross-argument rules in the command implementation, not inside a single parser
