# Parameters

Flag and positional parameter types for command configuration.

## Flag Parameter Types

Flags are named parameters using `--flag-name` or `-f` syntax.

### Boolean Flag

On/off switch with automatic negation support.

```typescript
interface BooleanFlagConfig {
    kind: "boolean";
    brief: string;               // Required: short description
    description?: string;        // Optional: detailed description
    default?: boolean;           // Default value (false if omitted)
    hidden?: boolean;           // Hide from help output
}
```

**Usage:**
```bash
--verbose          # Sets to true
--no-verbose       # Sets to false
```

**Example:**

```typescript
flags: {
    verbose: {
        kind: "boolean",
        brief: "Enable verbose logging",
        default: false
    },
    interactive: {
        kind: "boolean",
        brief: "Run in interactive mode",
        default: true
    }
}
```

### Counter Flag

Counts the number of times a flag is provided.

```typescript
interface CounterFlagConfig {
    kind: "counter";
    brief: string;
    description?: string;
    hidden?: boolean;
}
```

**Usage:**
```bash
-v                 # Returns 1
-vv                # Returns 2
-vvv               # Returns 3
```

**Example:**

```typescript
flags: {
    verbose: {
        kind: "counter",
        brief: "Verbosity level (use -v, -vv, -vvv)"
    }
}

func(flags) {
    if (flags.verbose >= 2) {
        console.log("Debug mode enabled");
    }
}
```

### Enum Flag

Restricts values to a predefined set of strings.

```typescript
interface EnumFlagConfig<T extends string> {
    kind: "enum";
    values: readonly T[];        // Array of valid values
    brief: string;
    description?: string;
    default?: T;                 // Default value (must be in values)
    hidden?: boolean;
}
```

**Example:**

```typescript
flags: {
    format: {
        kind: "enum",
        values: ["json", "yaml", "toml", "xml"] as const,
        brief: "Output format",
        default: "json"
    },
    logLevel: {
        kind: "enum",
        values: ["debug", "info", "warn", "error"] as const,
        brief: "Logging level",
        default: "info"
    }
}
```

### Parsed Flag

Transforms string input using a parser function.

```typescript
interface ParsedFlagConfig<T> {
    kind: "parsed";
    parse: (input: string) => T | Error;  // Parser function (can return Error)
    brief: string;
    description?: string;
    default?: T;                  // Default value (already parsed)
    placeholder?: string;         // Placeholder in help text
    hidden?: boolean;
}
```

**Example:**

```typescript
flags: {
    port: {
        kind: "parsed",
        parse: Number,
        brief: "Server port",
        default: 3000,
        placeholder: "PORT"
    },
    timeout: {
        kind: "parsed",
        parse: (input) => {
            const ms = Number.parseInt(input, 10);
            if (Number.isNaN(ms) || ms < 0) {
                throw new Error("Timeout must be a positive number");
            }
            return ms;
        },
        brief: "Timeout in milliseconds",
        default: 5000
    },
    date: {
        kind: "parsed",
        parse: (input) => new Date(input),
        brief: "Start date",
        placeholder: "YYYY-MM-DD"
    }
}
```

See [Parsers](./parsers.md) for built-in parsers and custom parser patterns.

### Variadic Flag

Accepts multiple values for the same flag.

```typescript
interface VariadicFlagConfig<T> {
    kind: "variadic";
    parse: (input: string) => T;  // Parser for each value
    brief: string;
    description?: string;
    default?: readonly T[];       // Default array of values
    placeholder?: string;
    hidden?: boolean;
}
```

**Usage:**
```bash
--include src --include tests --include docs
```

**Example:**

```typescript
flags: {
    include: {
        kind: "variadic",
        parse: String,
        brief: "Directories to include",
        default: []
    },
    exclude: {
        kind: "variadic",
        parse: String,
        brief: "Patterns to exclude"
    },
    tag: {
        kind: "variadic",
        parse: String,
        brief: "Tags to apply",
        placeholder: "TAG"
    }
}

func(flags) {
    // flags.include is string[]
    console.log(`Processing ${flags.include.length} directories`);
}
```

## Positional Parameter Types

Positional parameters are unnamed arguments passed by position.

### Tuple Positional

Fixed number of positional arguments in specific order.

```typescript
interface TuplePositionalConfig<T extends readonly unknown[]> {
    kind: "tuple";
    parameters: readonly [
        PositionalParameterConfig<T[0]>,
        PositionalParameterConfig<T[1]>,
        // ... more parameters
    ];
}

interface PositionalParameterConfig<T> {
    parse: (input: string) => T;
    brief: string;
    description?: string;
    placeholder?: string;
}
```

**Example:**

```typescript
positional: {
    kind: "tuple",
    parameters: [
        {
            brief: "Source file path",
            parse: String,
            placeholder: "SOURCE"
        },
        {
            brief: "Destination file path",
            parse: String,
            placeholder: "DEST"
        }
    ]
}

func(flags, [source, dest]) {
    console.log(`Copying ${source} to ${dest}`);
}
```

**Usage:**
```bash
my-cli copy file.txt backup.txt
```

### Array Positional

Variable number of positional arguments (all parsed the same way).

```typescript
interface ArrayPositionalConfig<T> {
    kind: "array";
    parameter: {
        parse: (input: string) => T;
        brief: string;
        description?: string;
        placeholder?: string;
    };
    optional?: boolean;         // Allow zero arguments
}
```

**Example:**

```typescript
positional: {
    kind: "array",
    parameter: {
        brief: "Files to process",
        parse: String,
        placeholder: "FILE"
    }
}

func(flags, files) {
    // files is string[]
    for (const file of files) {
        console.log(`Processing ${file}`);
    }
}
```

**Usage:**
```bash
my-cli process file1.txt file2.txt file3.txt
```

**Optional Array:**

```typescript
positional: {
    kind: "array",
    parameter: {
        brief: "Optional files to include",
        parse: String
    },
    optional: true
}
```

## Advanced Patterns

### Required vs Optional Flags

All flags are technically optional (use `default` or check for `undefined`):

```typescript
flags: {
    required: {
        kind: "parsed",
        parse: String,
        brief: "Required parameter"
        // No default - will be undefined if not provided
    },
    optional: {
        kind: "parsed",
        parse: String,
        brief: "Optional parameter",
        default: "default-value"
    }
}

func(flags) {
    if (!flags.required) {
        throw new Error("--required flag is mandatory");
    }
}
```

### Mutually Exclusive Flags

Validate flag combinations in the function:

```typescript
func(flags) {
    const exclusiveFlags = [flags.create, flags.update, flags.delete];
    const count = exclusiveFlags.filter(Boolean).length;

    if (count === 0) {
        throw new Error("Must specify one of: --create, --update, --delete");
    }
    if (count > 1) {
        throw new Error("Flags --create, --update, --delete are mutually exclusive");
    }
}
```

### Conditional Parameters

Use TypeScript type narrowing for conditional logic:

```typescript
interface Flags {
    readonly format: "json" | "csv";
    readonly pretty: boolean;
}

func(flags: Flags) {
    if (flags.format === "json" && flags.pretty) {
        // Pretty-print JSON
    }
}
```
