# Context

Pass runtime dependencies and shared services through `CommandContext`.

## `CommandContext`

Stricli's public context model is based on `CommandContext`.

At minimum, it includes a `process` object with writable streams used by Stricli for help text and errors.

```typescript
import type { CommandContext } from "@stricli/core";

interface AppContext extends CommandContext {
    readonly logger: Logger;
    readonly config: AppConfig;
}
```

In Node-compatible runtimes, `{ process }` is the normal base context.

## Accessing Context in Commands

Commands receive runtime context through `this`.

```typescript
import { buildCommand, type CommandContext } from "@stricli/core";

interface AppContext extends CommandContext {
    readonly logger: Logger;
}

export const statusCommand = buildCommand<{}, [], AppContext>({
    docs: {
        brief: "Print status information"
    },
    func(this) {
        this.logger.info("Running status command");
        this.process.stdout.write("ok\n");
    }
});
```

Notes:

- prefer `this.process.stdout.write()` and `this.process.stderr.write()` for output you want to test precisely
- using `console.log()` or global `process` is still possible, but injected context is easier to test

## Running with Custom Context

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

interface AppContext extends CommandContext {
    readonly process: typeof process;
    readonly config: AppConfig;
    readonly logger: Logger;
    readonly db: Database;
}

const context: AppContext = {
    process,
    config: loadConfig(),
    logger: createLogger(),
    db: await connectDatabase()
};

await run(app, process.argv.slice(2), context);
```

## What Belongs in Context

Use context for shared runtime dependencies such as:

- config objects
- loggers
- database clients
- API clients
- authenticated user/session data

Do not use context for:

- normal CLI flags
- positional arguments
- command-local values that should be explicit inputs

## Testing with Context

Stricli is designed to make command testing easier by injecting context rather than requiring global process mutation.

### Test the Whole Application

```typescript
import { run } from "@stricli/core";
import { app } from "../src/app";

const context = buildContextForTest();

await run(app, ["echo", "hello"], context);
expect(context.stdout).toContain("hello");
```

### Test the Implementation Directly

This works best when using the lazy `loader` pattern and testing the exported implementation function.

```typescript
import func from "../src/commands/echo/impl";

const context = buildContextForTest();

await func.call(context, {}, "hello");
expect(context.stdout).toContain("hello");
```

`buildContextForTest()` is application-specific, but the basic shape captures writes into string buffers so assertions can inspect output:

```typescript
function buildContextForTest() {
    let out = "";
    let err = "";
    return {
        process: {
            stdout: { write: (s: string) => { out += s; return true; } },
            stderr: { write: (s: string) => { err += s; return true; } }
        },
        // add your custom context fields here (logger, db, etc.)
        get stdout() { return out; },
        get stderr() { return err; }
    };
}
```

## Error Handling and Exit Codes

Prefer throwing errors from command implementations and letting Stricli format them for CLI output.

```typescript
export const deployCommand = buildCommand({
    docs: {
        brief: "Deploy the current release"
    },
    async func(this) {
        const ok = await deploy();
        if (!ok) {
            throw new Error("Deployment failed");
        }
    }
});
```

If you need custom exit codes, configure them at the application level with `determineExitCode`:

```typescript
export const app = buildApplication(routes, {
    name: "my-cli",
    determineExitCode(exc) {
        if (exc instanceof ValidationError) {
            return 2;
        }
        return 1;
    }
});
```

This is usually preferable to calling `process.exit()` inside command functions, because it keeps commands easier to compose and test.
