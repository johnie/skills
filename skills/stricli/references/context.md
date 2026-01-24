# Context

Pass shared state and dependencies to commands.

## Custom Context

Context allows you to share configuration, services, and dependencies across all commands in your CLI.

### Define Context Interface

```typescript
interface AppContext {
    readonly config: AppConfig;
    readonly logger: Logger;
    readonly db: Database;
}
```

### Type Commands with Context

```typescript
import { buildCommand } from "@stricli/core";
import type { AppContext } from "./context";

export const createUser = buildCommand<
    CreateUserFlags,
    [username: string],
    AppContext
>({
    docs: {
        brief: "Create a new user"
    },
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [
                { brief: "Username", parse: String }
            ]
        }
    },
    async func(flags, [username], context) {
        // Access context properties
        context.logger.info(`Creating user: ${username}`);
        await context.db.users.create({ username });
        context.logger.info("User created successfully");
    }
});
```

### Initialize and Run

```typescript
import { run } from "@stricli/core";
import { app } from "./app";
import { createLogger } from "./logger";
import { connectDatabase } from "./db";
import { loadConfig } from "./config";

// Initialize context
const context: AppContext = {
    config: loadConfig(),
    logger: createLogger(),
    db: await connectDatabase()
};

// Run application with context
await run(app, process.argv.slice(2), context);
```

### Context Best Practices

**Use context for:**
- Configuration objects
- Logging services
- Database connections
- HTTP clients
- Shared state across commands

**Don't use context for:**
- Flag values (use parameters instead)
- Command-specific data
- Values that should be passed via CLI arguments

## LocalContext

Commands can access `this` context for stdio operations.

```typescript
interface LocalContext {
    readonly stdin: NodeJS.ReadableStream;
    readonly stdout: NodeJS.WritableStream;
    readonly stderr: NodeJS.WritableStream;
    readonly console: Console;
}
```

### Accessing LocalContext

```typescript
import { buildCommand } from "@stricli/core";

export const command = buildCommand({
    docs: {
        brief: "Example command"
    },
    func() {
        // Access stdio via this
        this.console.log("Standard output");
        this.console.error("Error output");

        // Direct stream access
        this.stdout.write("Direct write\n");
        this.stderr.write("Error write\n");

        // Read from stdin
        this.stdin.on("data", (chunk) => {
            console.log("Received:", chunk.toString());
        });
    }
});
```

### Testing with LocalContext

LocalContext is especially useful for testing, where you can mock stdio:

```typescript
import { test, expect } from "bun:test";
import { greet } from "./commands/greet";

test("greet outputs to console", () => {
    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg),
        error: (msg: string) => output.push(`ERROR: ${msg}`)
    };

    // Call command with mocked LocalContext
    greet.func.call(
        { console: mockConsole },
        { name: "World", shout: false },
        undefined,
        undefined
    );

    expect(output).toEqual(["Hello, World!"]);
});
```

## Exit Codes

Use proper exit codes to indicate command success or failure.

### Exit Code Constants

```typescript
import { ExitCode } from "@stricli/core";

ExitCode.Success = 0          // Command succeeded
ExitCode.CommandRunError = 1  // Error during command execution
ExitCode.InternalError = -1   // Internal framework error
ExitCode.CommandLoadError = -2  // Error loading command
ExitCode.ContextLoadError = -3  // Error loading context
ExitCode.InvalidArgument = -4   // Invalid argument provided
ExitCode.UnknownCommand = -5    // Unknown command specified
```

### Using Exit Codes

```typescript
import { buildCommand, ExitCode } from "@stricli/core";

export const deploy = buildCommand({
    docs: {
        brief: "Deploy application"
    },
    async func(flags) {
        try {
            // Deployment logic
            await deployApp(flags.env);

            console.log("✓ Deployment successful");
            process.exit(ExitCode.Success);
        } catch (error) {
            console.error(`Deployment failed: ${error.message}`);
            process.exit(ExitCode.CommandRunError);
        }
    }
});
```

### Exit Code Best Practices

**Use `ExitCode.Success` (0) for:**
- Successful command execution
- Expected outcomes
- No errors occurred

**Use `ExitCode.CommandRunError` (1) for:**
- Errors during command execution
- Business logic failures
- External service failures
- File operation errors

**Use `ExitCode.InvalidArgument` (-4) for:**
- Invalid parameter values
- Failed validation
- Missing required parameters

**Example with validation:**

```typescript
import { buildCommand, ExitCode } from "@stricli/core";

export const backup = buildCommand({
    docs: {
        brief: "Create a backup"
    },
    parameters: {
        flags: {
            path: {
                kind: "parsed",
                parse: String,
                brief: "Backup directory path"
            }
        }
    },
    async func(flags) {
        // Validate required parameter
        if (!flags.path) {
            console.error("Error: --path is required");
            process.exit(ExitCode.InvalidArgument);
        }

        try {
            // Create backup
            await createBackup(flags.path);
            console.log("✓ Backup created");
            process.exit(ExitCode.Success);
        } catch (error) {
            console.error(`Backup failed: ${error.message}`);
            process.exit(ExitCode.CommandRunError);
        }
    }
});
```

### Implicit Exit Handling

If you don't explicitly call `process.exit()`, Stricli will:
- Return `ExitCode.Success` (0) if the command completes without throwing
- Return `ExitCode.CommandRunError` (1) if the command throws an error

```typescript
export const simple = buildCommand({
    docs: {
        brief: "Simple command"
    },
    func(flags) {
        console.log("Running command");
        // Implicitly exits with ExitCode.Success
    }
});

export const failing = buildCommand({
    docs: {
        brief: "Failing command"
    },
    func(flags) {
        throw new Error("Something went wrong");
        // Implicitly exits with ExitCode.CommandRunError
    }
});
```

## Combining Context Patterns

You can use both custom context and LocalContext together:

```typescript
interface AppContext {
    readonly db: Database;
    readonly logger: Logger;
}

export const query = buildCommand<QueryFlags, never, AppContext>({
    docs: {
        brief: "Query database"
    },
    async func(flags, _positional, context) {
        // Access custom context
        context.logger.info("Running query...");

        const results = await context.db.query(flags.sql);

        // Access LocalContext via this
        this.console.log(JSON.stringify(results, null, 2));

        // Exit with success
        process.exit(ExitCode.Success);
    }
});
```
