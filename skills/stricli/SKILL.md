---
name: stricli
description: Build type-safe TypeScript CLIs with Bloomberg's Stricli framework. Use when the user is authoring a new CLI with Stricli, adding or changing typed flags/positionals/parsers on an existing Stricli command, wiring subcommand routing via `buildRouteMap`, or configuring bash auto-complete via `@stricli/auto-complete`. Skip for generic "best CLI framework?" questions or maintenance of CLIs built on commander/yargs/oclif/minimist.
---

# Stricli CLI Framework

Stricli is Bloomberg's type-safe CLI framework for TypeScript. Strongly-typed flags and positional arguments, explicit command routing, automatic help generation, and an isolated `CommandContext` per run.

## When to use

- Scaffolding a new Stricli CLI (`npx @stricli/create-app` or by hand)
- Adding a command to an existing Stricli CLI
- Changing flag/positional definitions, parsers, or variadic behavior
- Introducing or restructuring `buildRouteMap` for subcommands
- Setting up bash auto-complete via `@stricli/auto-complete`
- Testing a Stricli command via `run(app, argv, context)`

## When NOT to use

- The user has an existing CLI on a different framework (commander, yargs, oclif, minimist) — this skill doesn't migrate, and the APIs don't translate.
- Generic "which CLI framework should I use?" — that's a design conversation, not a Stricli question.
- Non-TypeScript CLIs — Stricli's core value is its compile-time type safety.
- Runtime debugging of an installed CLI (not developing it) — use shell/debugging tooling.

## Core API surface

Stricli's public API is intentionally narrow. If something isn't listed here or in the references, assume it doesn't exist — checking the upstream repo is faster than guessing, and invented APIs compile until they don't.

| Entry point | Purpose |
|---|---|
| `buildCommand({ func \| loader, parameters, docs })` | Define a single command |
| `buildRouteMap({ routes, docs, aliases?, defaultCommand? })` | Compose subcommands |
| `buildApplication(rootCommandOrRouteMap, config)` | Wrap with app-level config (name, version, scanner) |
| `run(app, inputs, context)` | Execute the app against tokenized input + a runtime context |
| `CommandContext` | The shape that runtime context extends |

## Installation

Upstream docs assume Node + npm. Stay agnostic to the user's package manager — pnpm and bun work equally well.

```bash
npm install @stricli/core              # required
npm install @stricli/auto-complete     # optional, bash completion
# pnpm add / bun add work the same way
```

## Scaffolding a new app

```bash
npx @stricli/create-app@latest my-app
# pnpm dlx / bunx work the same way
```

The generator produces the reference directory layout. For hand-written apps, follow the quick start below.

## Quick start: single-command CLI

### 1. Define the command

```typescript
import { buildCommand } from "@stricli/core";

interface GreetFlags {
    readonly shout?: boolean;
}

export const greetCommand = buildCommand({
    docs: { brief: "Print a greeting" },
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
                { brief: "Name to greet", parse: String, placeholder: "name" }
            ]
        }
    },
    func(this, flags: GreetFlags, name: string) {
        const message = `Hello, ${name}!`;
        this.process.stdout.write(`${flags.shout ? message.toUpperCase() : message}\n`);
    }
});
```

### 2. Build the application

```typescript
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { greetCommand } from "./commands/greet";

export const app = buildApplication(greetCommand, {
    name: "my-cli",
    versionInfo: { currentVersion: version }
});
```

### 3. Run it

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2), { process });
```

## Parameter model

- **Flag kinds**: `parsed`, `enum`, `boolean`, `counter`. Everything else is expressed via `parse` / `variadic` on a `parsed` flag, not a new kind.
- **Positional modes**: `tuple` (fixed-shape, typed per-position) or `array` (variadic homogeneous).
- **Variadic**: set `variadic: true` for repeated occurrences, or `variadic: ","` (or any separator) for delimited input. It's a property, not a kind.

Full details in [`references/parameters.md`](references/parameters.md). Parser specifics (built-ins, custom, async) in [`references/parsers.md`](references/parsers.md).

## Recommended workflow

### Single-command CLI
`buildCommand` → `buildApplication(command, config)` → `run(app, argv, context)`.

### Multi-command CLI
Define commands independently, compose with `buildRouteMap`, add `aliases` / `defaultCommand` where UX benefits. See [`references/routing.md`](references/routing.md).

### Large CLIs — prefer the `loader` pattern

For commands whose implementation is expensive to import (heavy transitive deps, slow module-level work), use `loader` instead of inline `func`. Stricli resolves the loader only when that command is actually invoked, keeping startup fast.

```typescript
import { buildCommand, numberParser } from "@stricli/core";

export const analyzeCommand = buildCommand({
    docs: { brief: "Analyze a report" },
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

Rule of thumb: `func` for a few-line handler you don't mind parsing at app start; `loader` when the implementation (or its imports) would dominate cold start for unrelated commands. See [`references/routing.md`](references/routing.md).

## Context and testing

- Runtime context extends `CommandContext`. Inject logger / clients / clocks there — not module-level singletons — so tests can swap them.
- Command handlers receive context through `this`.
- Test either end-to-end via `run(app, inputs, ctx)` with a fake context, or import the command's implementation directly for pure unit tests.

See [`references/context.md`](references/context.md) and [`references/examples.md`](references/examples.md) (including `Testing Error Paths` for parser/missing-arg/enum-error tests).

## Auto-complete

`@stricli/auto-complete` supports bash only. Integrate via the standalone install/uninstall flow plus `buildInstallCommand()` / `buildUninstallCommand()` added to your app. Details in [`references/auto-complete.md`](references/auto-complete.md).

## Upstream conventions worth keeping

- `strict: true` in `tsconfig.json`. Stricli leans on inference — loose mode loses the whole value proposition.
- `--version` appears only when `versionInfo` is configured on the application.
- `--helpAll` is built-in and surfaces hidden commands and flags.
- Reserved short flags: `-h` (help), `-H` (helpAll), `-v` (version, when enabled).
- Upstream docs are npm-first; show `pnpm` / `bun` equivalents when the user uses them.

## References

- [`routing.md`](references/routing.md) — `buildCommand`, `buildRouteMap`, `buildApplication`, `run`, lazy loaders, aliases, default commands
- [`parameters.md`](references/parameters.md) — flag kinds and positional modes
- [`parsers.md`](references/parsers.md) — built-in / custom / async parsers
- [`context.md`](references/context.md) — `CommandContext`, custom context, testing, exit codes
- [`auto-complete.md`](references/auto-complete.md) — bash auto-complete integration
- [`examples.md`](references/examples.md) — composite patterns, end-to-end apps, **testing error paths**

## External

- [Stricli GitHub](https://github.com/bloomberg/stricli)
- [Official documentation](https://bloomberg.github.io/stricli/)
- [`@stricli/core` on npm](https://www.npmjs.com/package/@stricli/core)
- [`@stricli/create-app` on npm](https://www.npmjs.com/package/@stricli/create-app)
