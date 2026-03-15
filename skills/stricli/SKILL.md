---
name: stricli
description: Build type-safe CLI applications with Stricli. Use when creating TypeScript CLIs with typed flags/positional args, multi-command routing, or automatic help generation. Stricli catches parameter errors at compile time. Use this whenever the user mentions CLI frameworks, command-line tools, argument parsing, or typed commands in TypeScript.
---

# Stricli CLI Framework

Stricli is Bloomberg's type-safe CLI framework for TypeScript. It focuses on strongly typed flags and positional arguments, explicit command routing, automatic help generation, and isolated command context.

Prefer current upstream APIs and terminology:

- `buildCommand({ func | loader, parameters, docs })`
- `buildRouteMap({ routes, docs, aliases?, defaultCommand? })`
- `buildApplication(rootCommandOrRouteMap, config)`
- `run(app, inputs, context)`
- `CommandContext` for runtime context

## Upstream Orientation

Stricli's official quick start is Node and npm oriented. Follow that by default, but keep install and execution guidance package-manager agnostic when helpful.

### Install Packages

```bash
npm install @stricli/core              # required
npm install @stricli/auto-complete     # optional, bash completion support
# pnpm add / bun add also work
```

### Generate a New App

Prefer the upstream generator when scaffolding from scratch:

```bash
npx @stricli/create-app@latest my-app
# pnpm dlx / bunx also work
```

## Quick Start

Create a minimal single-command CLI.

### 1. Define a Command

```typescript
import { buildCommand } from "@stricli/core";

interface GreetFlags {
    readonly shout?: boolean;
}

export const greetCommand = buildCommand({
    docs: {
        brief: "Print a greeting"
    },
    parameters: {
        flags: {
            shout: {
                kind: "boolean",
                brief: "Uppercase the greeting",
                optional: true
            }
        },
        positional: {
            kind: "tuple",
            parameters: [
                {
                    brief: "Name to greet",
                    parse: String,
                    placeholder: "name"
                }
            ]
        }
    },
    func(this, flags: GreetFlags, name: string) {
        const message = `Hello, ${name}!`;
        this.process.stdout.write(
            `${flags.shout ? message.toUpperCase() : message}\n`
        );
    }
});
```

### 2. Build the Application

```typescript
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { greetCommand } from "./commands/greet";

export const app = buildApplication(greetCommand, {
    name: "my-cli",
    versionInfo: {
        currentVersion: version
    }
});
```

### 3. Run the CLI

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2), { process });
```

## Core Concepts

- `buildCommand()` creates a command from either an inline `func` or a lazy `loader`
- `buildRouteMap()` organizes commands into nested subcommands
- `buildApplication()` wraps a root command or route map with runtime configuration
- `run()` executes the application with already-tokenized CLI input and a runtime context

See [Commands, Routing, and Applications](references/routing.md) for current API details.

## Parameter Types

Stricli supports four flag kinds and two positional modes:

- Flags: `parsed`, `enum`, `boolean`, `counter`
- Positionals: `tuple`, `array`

Variadic behavior is configured with `variadic`, not a separate flag kind.

See [Parameters](references/parameters.md).

## Recommended Workflow

### Single-Command CLI

1. Define a command with `buildCommand`
2. Add typed flags and positional arguments in `parameters`
3. Wrap it with `buildApplication(command, config)`
4. Run with `run(app, process.argv.slice(2), { process })`

### Multi-Command CLI

1. Define commands independently
2. Organize them with `buildRouteMap`
3. Add route aliases or a `defaultCommand` if needed
4. Wrap the root route map with `buildApplication(routes, config)`

### Large CLIs

Prefer the lazy `loader` pattern for heavy commands:

```typescript
import { buildCommand, numberParser } from "@stricli/core";

export const analyzeCommand = buildCommand({
    docs: {
        brief: "Analyze a report"
    },
    parameters: {
        flags: {
            depth: {
                kind: "parsed",
                parse: numberParser,
                brief: "Traversal depth",
                optional: true,
                default: "1"
            }
        }
    },
    loader: async () => import("./impl")
});
```

## Context and Testing

- Stricli command context is based on `CommandContext`
- Command implementations receive runtime context through `this`
- Extend `CommandContext` to inject custom services or shared state
- Test either by calling `run(app, inputs, context)` or by importing the command implementation directly

See [Context](references/context.md) and [Examples](references/examples.md).

## Auto-Complete

`@stricli/auto-complete` currently supports bash. The current public integration is based on:

- the standalone install/uninstall flow via `@stricli/auto-complete`
- built-in `buildInstallCommand()` / `buildUninstallCommand()` commands for your app

See [Auto-Complete](references/auto-complete.md).

## Important Upstream Guidance

- Prefer `strict: true` in `tsconfig.json`; Stricli relies on TypeScript inference
- `--version` is available only when `versionInfo` is configured on the application
- `--helpAll` is built in and reveals hidden commands and flags
- `-h` is reserved for help, `-H` for help-all, and `-v` for version when version info is enabled
- Official upstream docs and generator are Node/npm oriented; mention `pnpm` and `bun` alternatives when useful, but keep `npm` examples first

Only use APIs documented in this skill and its reference files. Stricli is a niche library with a narrow public API surface — do not invent flag kinds, parsers, application config fields, or auto-complete features that are not shown here. If something is not documented, assume it does not exist.

## Reference Documentation

- **[Commands, Routing, and Applications](references/routing.md)** - `buildCommand`, `buildRouteMap`, `buildApplication`, `run`, lazy loaders, route aliases, default commands
- **[Parameters](references/parameters.md)** - current flag and positional parameter patterns
- **[Parsers](references/parsers.md)** - built-in parsers, custom parsers, async parsing
- **[Context](references/context.md)** - `CommandContext`, custom context, testing, exit-code handling
- **[Auto-Complete](references/auto-complete.md)** - bash auto-complete with `@stricli/auto-complete`
- **[Examples](references/examples.md)** - updated examples for common Stricli patterns

## Additional Resources

- [Stricli GitHub](https://github.com/bloomberg/stricli)
- [Official Documentation](https://bloomberg.github.io/stricli/)
- [Core Package](https://www.npmjs.com/package/@stricli/core)
- [Create App](https://www.npmjs.com/package/@stricli/create-app)
