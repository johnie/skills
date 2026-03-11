---
name: stricli
description: Build type-safe CLI applications with Stricli. Use when creating TypeScript CLIs with typed flags/positional args, multi-command routing, or automatic help generation. Stricli catches parameter errors at compile time. Use this whenever the user mentions CLI frameworks, command-line tools, argument parsing, or typed commands in TypeScript.
---

# Stricli CLI Framework

Stricli is Bloomberg's type-safe CLI framework for TypeScript. It provides compile-time type checking for command parameters, automatic help generation, and flexible command routing.

**Multi-Runtime Support:** Works with Node.js, Bun, and Deno.

## Quick Start

Create a minimal single-command CLI:

### 1. Installation

```bash
npm install @stricli/core
```

Optional packages:
```bash
npm install @stricli/auto-complete  # Shell completion support
```

### 2. Project Structure

```text
my-cli/
├── src/
│   ├── commands/
│   │   └── greet.ts      # Command implementation
│   ├── app.ts            # Application entry point
│   └── index.ts          # CLI runner
├── package.json
└── tsconfig.json
```

### 3. Define a Command (src/commands/greet.ts)

```typescript
import { buildCommand } from "@stricli/core";

export interface GreetFlags {
    readonly name: string;
    readonly shout: boolean;
}

export const greet = buildCommand({
    docs: {
        brief: "Greet a user",
        description: "Prints a greeting message to the console"
    },
    parameters: {
        flags: {
            name: {
                kind: "parsed",
                brief: "Name to greet",
                parse: String,
                default: "World"
            },
            shout: {
                kind: "boolean",
                brief: "Use uppercase",
                default: false
            }
        }
    },
    func(flags: GreetFlags) {
        const message = "Hello, " + flags.name + "!";
        console.log(flags.shout ? message.toUpperCase() : message);
    }
});
```

### 4. Build Application (src/app.ts)

```typescript
import { buildApplication } from "@stricli/core";
import { name, version, description } from "../package.json";
import { greet } from "./commands/greet";

export const app = buildApplication({
    name,
    version,
    description,
    command: greet
});
```

### 5. Run CLI (src/index.ts)

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2));
```

### 6. Configure package.json

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-cli": "./src/index.ts"
  },
  "scripts": {
    "start": "npx tsx src/index.ts"
  }
}
```

**Note:** With Bun, you can run TypeScript directly. With Node.js, use `tsx` or compile with `tsc` first.

## Core Concepts

- `buildCommand(config)` — creates a command with typed parameters and a `func` handler
- `buildRouteMap(config)` — organizes commands/sub-routes into a hierarchy
- `buildApplication(config)` — wraps a command or route map into an executable app (name, version, description)
- `run(app, args, context?)` — executes the application with CLI arguments

See [Commands, Routing, and Applications](./references/routing.md) for full API details and interfaces.

## Parameter Types

Stricli supports five flag kinds (`boolean`, `counter`, `enum`, `parsed`, `variadic`) and two positional kinds (`tuple` for fixed args, `array` for variable-length). All flags support `brief`, `description?`, `default?`, and `hidden?`.

See [Parameters](./references/parameters.md) for full interface definitions, examples, and advanced patterns.

## Workflow

### Building a Single-Command CLI

1. **Define command** - Create command file with `buildCommand`
2. **Implement function** - Add business logic in `func` property
3. **Build application** - Wrap command with `buildApplication`
4. **Run** - Execute with `run(app, args)`

### Building a Multi-Command CLI

1. **Define commands** - Create multiple command files
2. **Create route map** - Organize commands with `buildRouteMap`
3. **Build application** - Pass route map to `buildApplication`
4. **Run** - Execute with command routing: `my-cli create ...`

### Adding Custom Parsers

```typescript
const urlParser = (input: string): URL => {
    try {
        return new URL(input);
    } catch (error) {
        throw new Error(`Invalid URL: ${input}`);
    }
};

flags: {
    endpoint: {
        kind: "parsed",
        parse: urlParser,
        brief: "API endpoint URL"
    }
}
```

### Using Custom Context

Pass shared state/dependencies to all commands:

```typescript
interface AppContext {
    readonly config: Config;
    readonly logger: Logger;
}

// In func
func(flags, positional, context: AppContext) {
    context.logger.info("Running command...");
}

// When running
await run(app, args, { config, logger });
```

## Multi-Command Structure

### Nested Routes

```typescript
const projectRoutes = buildRouteMap({
    routes: {
        create: createProjectCommand,
        delete: deleteProjectCommand,
        list: listProjectsCommand
    },
    docs: { brief: "Manage projects" }
});

const taskRoutes = buildRouteMap({
    routes: {
        add: addTaskCommand,
        complete: completeTaskCommand
    },
    docs: { brief: "Manage tasks" }
});

const rootRoutes = buildRouteMap({
    routes: {
        project: projectRoutes,
        task: taskRoutes
    }
});

const app = buildApplication({
    name: "pm",
    version: "1.0.0",
    command: rootRoutes
});
```

Usage:
- `pm project create myapp`
- `pm project list`
- `pm task add "Write docs"`

### Lazy Loading

For large CLIs, use lazy loading to improve startup time:

```typescript
const routes = buildRouteMap({
    routes: {
        heavy: {
            lazy: async () => {
                const mod = await import("./commands/heavy");
                return mod.heavyCommand;
            },
            brief: "Heavy operation"
        }
    }
});
```

## Built-in Features

Stricli auto-generates `--help` (from `docs.brief`/`docs.description`) and `--version` for all commands and route maps.

## Testing Commands

Commands are pure functions - easy to test:

```typescript
// Use your preferred test runner (vitest, bun:test, jest, etc.)
import { test, expect } from "vitest";
import { greet } from "./commands/greet";

test("greet with default name", () => {
    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg)
    };

    greet.func.call(
        { console: mockConsole },
        { name: "World", shout: false },
        undefined,
        undefined
    );

    expect(output[0]).toBe("Hello, World!");
});
```

## Reference Documentation

For detailed API documentation and complete examples, see:

- **[Commands, Routing, and Applications](./references/routing.md)** - buildCommand, buildRouteMap, buildApplication, run, func signature, aliases, lazy loading, scanner config
- **[Parameters](./references/parameters.md)** - Flag types (boolean, counter, enum, parsed, variadic) and positional types (tuple, array)
- **[Parsers](./references/parsers.md)** - Built-in parsers, custom parsers, error handling
- **[Context](./references/context.md)** - Custom context, LocalContext, exit codes
- **[Auto-Complete](./references/auto-complete.md)** - Shell completion with @stricli/auto-complete
- **[Examples](./references/examples.md)** - Complete working examples including custom parsers, variadic flags, lazy loading, and testing

## Additional Resources

- [Stricli GitHub](https://github.com/bloomberg/stricli)
- [Official Documentation](https://bloomberg.github.io/stricli/)
- [NPM Package](https://www.npmjs.com/package/@stricli/core)
