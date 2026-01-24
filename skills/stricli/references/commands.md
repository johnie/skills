# Commands

Command definitions and execution functions.

## buildCommand

Creates a command with typed parameters and execution logic.

```typescript
function buildCommand<
    Flags extends CommandFlagsBase,
    Positional extends CommandPositionalBase,
    Context
>(config: CommandConfig<Flags, Positional, Context>): Command<Flags, Positional, Context>
```

### CommandConfig Interface

```typescript
interface CommandConfig<Flags, Positional, Context> {
    // Documentation
    docs: {
        brief: string;              // Short one-line description
        description?: string;        // Detailed multi-line description
        hideFromHelp?: boolean;     // Hide from help output
    };

    // Parameters (optional)
    parameters?: {
        flags?: FlagParametersConfig<Flags>;
        positional?: PositionalParametersConfig<Positional>;
        aliases?: Record<string, string>;  // Short aliases: { v: "verbose" }
    };

    // Execution function
    func(
        this: LocalContext,
        flags: Flags,
        positional: Positional,
        context: Context
    ): void | Promise<void>;
}
```

## func Signature

The command execution function receives three parameters:

- **flags** - Typed object containing all flag values
- **positional** - Typed positional arguments (tuple or array)
- **context** - Custom context object passed from `run()`
- **this** - LocalContext with stdio streams (stdin, stdout, stderr, console)

```typescript
func(flags, positional, context) {
    // Access flags
    console.log(flags.verbose);

    // Access positional args
    console.log(positional[0]);

    // Access context
    context.logger.info("Running command");

    // Access this context for stdio
    this.console.log("Standard output");
    this.console.error("Error output");
}
```

## Example

```typescript
import { buildCommand } from "@stricli/core";

export interface DeployFlags {
    readonly env: "dev" | "staging" | "prod";
    readonly dryRun: boolean;
}

export const deploy = buildCommand({
    docs: {
        brief: "Deploy application",
        description: "Deploys the application to the specified environment"
    },
    parameters: {
        flags: {
            env: {
                kind: "enum",
                values: ["dev", "staging", "prod"],
                brief: "Target environment",
                default: "dev"
            },
            dryRun: {
                kind: "boolean",
                brief: "Simulate deployment without making changes",
                default: false
            }
        },
        aliases: {
            e: "env",
            d: "dryRun"
        }
    },
    async func(flags) {
        console.log(`Deploying to ${flags.env}...`);
        if (flags.dryRun) {
            console.log("(dry run mode)");
        }
        // Deployment logic
    }
});
```

## Aliases

Define short aliases for flag names in the `aliases` field:

```typescript
parameters: {
    flags: {
        verbose: {
            kind: "boolean",
            brief: "Verbose output"
        },
        output: {
            kind: "parsed",
            parse: String,
            brief: "Output file"
        }
    },
    aliases: {
        v: "verbose",
        o: "output"
    }
}
```

Usage: `-v` maps to `--verbose`, `-o` maps to `--output`

## Type Safety

Stricli provides full type safety for parameters:

```typescript
interface MyFlags {
    readonly verbose: boolean;
    readonly count: number;
    readonly format: "json" | "yaml";
}

const command = buildCommand<MyFlags, never>({
    parameters: {
        flags: {
            verbose: { kind: "boolean", brief: "Verbose" },
            count: { kind: "counter", brief: "Count" },
            format: {
                kind: "enum",
                values: ["json", "yaml"],
                brief: "Format"
            }
        }
    },
    func(flags: MyFlags) {
        // flags is fully typed
        flags.verbose;  // boolean
        flags.count;    // number
        flags.format;   // "json" | "yaml"
    }
});
```
