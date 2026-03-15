# Parameters

Define typed flags and positional arguments for commands.

## Type Inference

Stricli infers parameter configuration from the TypeScript function signature and flag types you provide.

Use `strict: true` in `tsconfig.json` whenever possible. Upstream docs strongly recommend it because optionality and parameter inference rely on strict TypeScript behavior.

## Flag Kinds

Stricli currently supports four flag kinds:

- `parsed`
- `enum`
- `boolean`
- `counter`

There is no separate `kind: "variadic"`. Variadic behavior is configured on supported flag kinds with `variadic`.

## Parsed Flags

Use `kind: "parsed"` when a flag should parse string input into a custom type.

```typescript
import { buildCommand, numberParser } from "@stricli/core";

interface Flags {
    readonly port?: number;
}

export const serveCommand = buildCommand({
    docs: {
        brief: "Start the server"
    },
    parameters: {
        flags: {
            port: {
                kind: "parsed",
                parse: numberParser,
                brief: "Port to bind",
                placeholder: "port",
                optional: true,
                default: "3000"
            }
        }
    },
    func(this, flags: Flags) {
        const port = flags.port ?? 3000;
        this.process.stdout.write(`Listening on ${port}\n`);
    }
});
```

Important details:

- `default` for parsed flags is a raw string, not the already-parsed value
- `parse` can be sync or async
- `optional: true` must match the flag type being optional

## Enum Flags

Use `kind: "enum"` when valid values are known string literals.

```typescript
interface Flags {
    readonly format: "json" | "yaml" | "toml";
}

flags: {
    format: {
        kind: "enum",
        values: ["json", "yaml", "toml"] as const,
        brief: "Output format",
        default: "json"
    }
}
```

Enum flags:

- validate inputs against `values`
- show choices in help output
- feed values into completion proposals automatically

## Boolean Flags

Use `kind: "boolean"` for on/off flags.

```typescript
interface Flags {
    readonly quiet?: boolean;
}

flags: {
    quiet: {
        kind: "boolean",
        brief: "Suppress normal output",
        optional: true,
        withNegated: true
    }
}
```

Notes:

- when `withNegated` is omitted or `true`, Stricli supports a negated flag like `--noQuiet`
- scanner/documentation case style may display that as `--no-quiet`
- use `withNegated: false` if the negated form is not desirable

## Counter Flags

Use `kind: "counter"` when repeated appearances should increment a number.

```typescript
interface Flags {
    readonly verbose: number;
}

flags: {
    verbose: {
        kind: "counter",
        brief: "Increase verbosity"
    }
}

aliases: {
    V: "verbose"
}
```

Typical usage:

```bash
my-cli -V
my-cli -VV
my-cli -VVV
```

## Common Flag Variants

### Optional

If the TypeScript flag property is optional or nullable in a way Stricli recognizes, the flag config should include `optional: true`.

```typescript
interface Flags {
    readonly host?: string;
}

flags: {
    host: {
        kind: "parsed",
        parse: String,
        brief: "Host to connect to",
        optional: true
    }
}
```

Do not rely on undocumented "all flags are optional" behavior. Current Stricli typing expects optionality to be explicit.

### Defaults

Defaults depend on the flag kind:

- `parsed`: string or string array for variadic parsed flags
- `enum`: enum value or enum value array for variadic enum flags
- `boolean`: boolean

```typescript
flags: {
    region: {
        kind: "parsed",
        parse: String,
        brief: "Target region",
        optional: true,
        default: "eu-west-1"
    }
}
```

### Variadic

Variadic flags collect multiple values into an array.

```typescript
interface Flags {
    readonly include?: readonly string[];
}

flags: {
    include: {
        kind: "parsed",
        parse: String,
        brief: "Glob(s) to include",
        optional: true,
        variadic: true
    }
}
```

This accepts repeated flags:

```bash
my-cli --include src --include test
```

You can also provide a separator string:

```typescript
include: {
    kind: "parsed",
    parse: String,
    brief: "Glob(s) to include",
    optional: true,
    variadic: ","
}
```

This accepts comma-separated input:

```bash
my-cli --include src,test,docs
```

### `inferEmpty`

Parsed flags can distinguish between `--flag` and `--flag value` by inferring an empty string when no explicit value is provided.

```typescript
flags: {
    message: {
        kind: "parsed",
        parse: String,
        brief: "Optional message",
        optional: true,
        inferEmpty: true
    }
}
```

### Hidden Flags

Hidden flags do not appear in normal help or standard completion proposals.

```typescript
flags: {
    debugToken: {
        kind: "parsed",
        parse: String,
        brief: "Internal debug token",
        optional: true,
        hidden: true
    }
}
```

Users can still reveal hidden flags with `--helpAll`.

## Flag Aliases

Aliases are defined in `parameters.aliases`.

```typescript
parameters: {
    flags: {
        output: {
            kind: "parsed",
            parse: String,
            brief: "Output file",
            optional: true
        }
    },
    aliases: {
        o: "output"
    }
}
```

Rules:

- aliases are single characters
- aliases can be batched, such as `-abc`
- reserve `-h`, `-H`, and `-v` as described in upstream docs

## Positional Arguments

Stricli supports two positional modes:

- `tuple` - fixed shape
- `array` - repeated values of one shape

### Tuple Positionals

Use `kind: "tuple"` for a fixed ordered argument list.

```typescript
positional: {
    kind: "tuple",
    parameters: [
        {
            brief: "Source path",
            parse: String,
            placeholder: "source"
        },
        {
            brief: "Destination path",
            parse: String,
            placeholder: "dest"
        }
    ]
}
```

Command implementation:

```typescript
func(this, flags, source: string, dest: string) {
    this.process.stdout.write(`Copying ${source} to ${dest}\n`);
}
```

### Array Positionals

Use `kind: "array"` for a repeated positional value.

```typescript
positional: {
    kind: "array",
    parameter: {
        brief: "Input file",
        parse: String,
        placeholder: "file"
    }
}
```

Command implementation:

```typescript
func(this, flags, ...files: string[]) {
    this.process.stdout.write(`Received ${files.length} file(s)\n`);
}
```

## Practical Patterns

### Cross-Argument Validation

Use command logic for constraints that Stricli does not model directly.

```typescript
func(this, flags) {
    const selected = [flags.create, flags.update, flags.remove].filter(Boolean);
    if (selected.length !== 1) {
        throw new Error("Choose exactly one of --create, --update, or --remove");
    }
}
```

### Camel Case + Kebab Case

Use camelCase in TypeScript and enable app-level scanning when you want users to type kebab-case flags.

```typescript
const app = buildApplication(routes, {
    name: "my-cli",
    scanner: {
        caseStyle: "allow-kebab-for-camel"
    }
});
```

Then `dryRun` can be passed as `--dry-run`.
