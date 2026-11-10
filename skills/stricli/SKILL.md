---
name: stricli
description: Build type-safe TypeScript CLIs with Bloomberg's Stricli framework. Use when the project already depends on `@stricli/core` or the user names Stricli. Covers authoring a new CLI, changing typed flags, positionals, and parsers, wiring subcommand routing via `buildRouteMap`, testing via `run(app, argv, context)`, and configuring bash auto-complete via `@stricli/auto-complete`. For the `cleye` argv parser use the cleye skill instead; skip for commander/yargs/oclif/minimist and for generic "which CLI framework should I use?" questions.
when_to_use: "Also applies to adding commands, integrations, or lifecycle hooks to an existing Stricli app. Skip for migrating a CLI from another framework (the APIs don't translate), for non-TypeScript CLIs, and for runtime debugging of an installed CLI rather than developing it."
allowed-tools:
  - Bash(npx @stricli/create-app*)
  - Bash(npm install @stricli/*)
  - Bash(pnpm add @stricli/*)
  - Bash(tsc *)
  - Bash(pnpm exec tsc *)
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Stricli CLI Framework

Use this skill to build or change Stricli CLIs in TypeScript. Check the installed `@stricli/core` version first, because the integrations API depends on it.

Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

## Core API surface

The table and the references cover the public API this skill relies on. They are not exhaustive. Before using an API that is not listed here, verify it in the upstream repo or docs.

| Entry point | Purpose |
| --- | --- |
| `buildCommand({ func \| loader, parameters, docs })` | Define a single command |
| `buildRouteMap({ routes, docs, aliases?, defaultCommand? })` | Compose subcommands |
| `buildApplication(rootCommandOrRouteMap, config, integrations?)` | Wrap with app-level config (name, scanner, …); third argument registers integrations (1.3.0+) |
| `run(app, inputs, context)` | Execute the app against tokenized input + a runtime context |
| `CommandContext` | The shape that runtime context extends |
| `help(config)` / `version(config)` | Built-in integrations for `--help` / `--version` (1.3.0+) |

## Version awareness

Check the installed `@stricli/core` before using version-gated API.

- **1.3.0** added the `integrations` argument, lifecycle hooks, and the exported `help`/`version` factories.
- **1.2.5** added `withNegated` on boolean flags and defaults on variadic flags.

The rest of this skill applies across the 1.x line. Details in [`references/integrations.md`](references/integrations.md).

## Installation

Use the user's package manager. Upstream docs are npm-first; pnpm and bun work the same way.

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

For hand-written apps, follow the quick start below.

## Quick start: single-command CLI

### 1. Define the command

```typescript
import { buildCommand, type CommandContext } from "@stricli/core";

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
        optional: true,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "Name to greet", parse: String, placeholder: "name" },
      ],
    },
  },
  func(this: CommandContext, flags: GreetFlags, name: string) {
    const message = `Hello, ${name}!`;
    this.process.stdout.write(
      `${flags.shout ? message.toUpperCase() : message}\n`
    );
  },
});
```

### 2. Build the application

On 1.3.0+, passing a third argument (integrations) to `buildApplication` replaces every default. Re-register `help`, `helpAll`, and `version`, or the CLI loses those flags. The full setup, including `--version` and custom integrations, is in [`references/integrations.md`](references/integrations.md#the-gotcha-passing-integrations-replaces-the-defaults).

```typescript
import { buildApplication } from "@stricli/core";

import { greetCommand } from "./commands/greet";

export const app = buildApplication(greetCommand, { name: "my-cli" });
```

On 1.2.x, enable `--version` with the config key `versionInfo: { currentVersion }`. That key is `@deprecated` on 1.3.0 but still works.

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

Define each command independently with `buildCommand`. Compose them with `buildRouteMap`. Add `aliases` when users need short names for subcommands. Set `defaultCommand` when a route map should run one command when no subcommand is given. See [`references/routing.md`](references/routing.md).

### Large CLIs: prefer the `loader` pattern

Use inline `func` for a short handler with cheap imports. Use `loader` when a command's implementation or its imports are expensive to load (heavy transitive deps, slow module-level work), so unrelated commands start fast. Example in [`references/routing.md`](references/routing.md#lazy-loader).

## Context and testing

- Runtime context extends `CommandContext`. Inject logger / clients / clocks there, not as module-level singletons, so tests can swap them.
- Command handlers receive context through `this`.
- Test either end-to-end via `run(app, inputs, ctx)` with a fake context, or import the command's implementation directly for pure unit tests.

See [`references/context.md`](references/context.md) and [`references/examples.md`](references/examples.md) (including `Testing Error Paths` for parser/missing-arg/enum-error tests).

## Auto-complete

`@stricli/auto-complete` supports bash only. Integrate via the standalone install/uninstall flow plus `buildInstallCommand()` / `buildUninstallCommand()` added to your app. Details in [`references/auto-complete.md`](references/auto-complete.md).

## Upstream conventions worth keeping

- `strict: true` in `tsconfig.json`. Stricli relies on type inference for flags and positionals, and loose mode weakens it.
- `--version` appears only when a `version` integration is registered (1.3.0+) or the legacy `versionInfo` config key is set (1.2.x; deprecated on 1.3.0).
- `--helpAll` is built-in and surfaces hidden commands and flags.
- Reserved short flags: `-h` (help), `-H` (helpAll), `-v` (version, when enabled).

## References

- [`routing.md`](references/routing.md): `buildCommand`, `buildRouteMap`, `buildApplication`, `run`, lazy loaders, aliases, default commands
- [`parameters.md`](references/parameters.md): flag kinds and positional modes
- [`parsers.md`](references/parsers.md): built-in / custom / async parsers
- [`context.md`](references/context.md): `CommandContext`, custom context, testing, exit codes
- [`integrations.md`](references/integrations.md): integrations, lifecycle hooks, application flags, customizing `help`/`version` (1.3.0+)
- [`auto-complete.md`](references/auto-complete.md): bash auto-complete integration
- [`examples.md`](references/examples.md): composite patterns, end-to-end apps, **testing error paths**

## External

- [Stricli GitHub](https://github.com/bloomberg/stricli)
- [Official documentation](https://bloomberg.github.io/stricli/)
- [`@stricli/core` on npm](https://www.npmjs.com/package/@stricli/core)
- [`@stricli/create-app` on npm](https://www.npmjs.com/package/@stricli/create-app)
