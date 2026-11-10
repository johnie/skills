---
name: cleye
description: Build type-safe TypeScript CLIs with the cleye argv parser. Use when the project already depends on `cleye` or the user names cleye. Covers authoring a `cli()` call, adding typed flags/parameters, defining subcommands with `command()`, handling parsed output in a callback, using `cleye/formats` helpers (oneOf/commaList/integer/float/range/url), customizing `--help` via `help.render`, and wiring `strictFlags`/`booleanFlagNegation`. For Bloomberg's Stricli framework use the stricli skill instead; skip for commander/yargs/oclif/minimist and for generic "which CLI framework should I use?" questions.
when_to_use: Also applies to cleye 3.x beta projects (read the v3 migration reference first). Skip for migrating an existing commander, yargs, oclif, or minimist CLI (the APIs don't translate), for plain JavaScript CLIs where compile-time type inference is not wanted, and for runtime debugging of an installed CLI rather than developing it.
allowed-tools:
  - Bash(npm install cleye)
  - Bash(npm i cleye)
  - Bash(pnpm add cleye)
  - Bash(tsc *)
  - Bash(pnpm exec tsc *)
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# cleye CLI Tool

Build cleye CLIs against the version installed in the project. This skill covers the **2.x** line (`cleye@latest`). If the project is on the 3.x beta (`3.0.0-beta.1`, `beta` dist-tag, `npm i cleye@beta`), read [`references/v3-migration.md`](references/v3-migration.md) before using the shapes below. That release has breaking changes.

cleye is an argv-parsing tool for Node.js CLIs. It turns a declarative options object into strongly-typed parameters and flags, generates `--help` and `--version` documentation, and supports nested commands. Flag parsing uses [`type-flag`](https://github.com/privatenumber/type-flag).

## Core API surface

Check the installed version before using newer options:

- `cleye/formats` needs ≥2.6.
- `booleanFlagNegation` needs ≥2.3.

If an API is not listed here or in the references, check the upstream docs before using it.

| Entry point | Purpose |
| --- | --- |
| `cli(options, callback?, argvs?)` | Parse argv from a declarative options object; returns `ParsedArgv` |
| `command(options, callback?)` | Define a subcommand; same options as `cli` plus `name`/`alias` |
| `cleye/formats` | Tree-shakable type-function helpers (`oneOf`, `commaList`, `integer`, `float`, `range`, `url`) |
| `Flags` / `Renderers` / `TypeFlag` | Exported types for flag objects, help renderers, and portable flag declarations |

`cli()` returns a `ParsedArgv`:

```typescript
type ParsedArgv = {
  _: string[] & Parameters; // positional args, named in camelCase
  flags: { [flagName: string]: InferredType };
  unknownFlags: { [flagName: string]: (string | boolean)[] };
  command?: string; // present when commands are registered
  showVersion: () => void;
  showHelp: (options?: HelpOptions) => void;
};
```

## Installation

Use the project's package manager.

```bash
npm i cleye
# pnpm add cleye / bun add cleye work the same way
```

For a complete single-command example with run output and generated help, see [`references/examples.md`](references/examples.md#single-command-cli-basic).

To keep handling co-located, pass a callback as the second argument to `cli()`. Return a Promise from the callback to `await cli(...)`.

## Parameter & flag model

- **Parameters** (positionals) use string-format markers: `<required>`, `[optional]`, `<spread...>` / `[spread...]`. Required must precede optional; spread must be last. Access in camelCase on `argv._`. Full details in [`references/parameters.md`](references/parameters.md).
- **Flags** map a camelCase key to a type function (`String`, `Number`, `Boolean`, custom) or a descriptor object (`type`, `alias`, `default`, `description`, `placeholder`). Wrap the type in an array (`[Number]`) to accept multiple values. Full details in [`references/flags.md`](references/flags.md).
- **Validation** is done with type functions that throw on bad input. Use the ready-made helpers in [`references/formats.md`](references/formats.md) (`cleye/formats`) or write your own.

## Commands

Define subcommands with `command()` and register them in the `commands` array of `cli()`. The active command is reported on `argv.command`, which narrows the parsed types. For larger CLIs, give each command its own file and handle its output in a callback. See [`references/commands.md`](references/commands.md).

```typescript
import { cli, command } from "cleye";

const argv = cli({
  name: "npm",
  commands: [
    command({
      name: "install",
      parameters: ["<package name>"],
      flags: { saveDev: Boolean },
    }),
  ],
});
// $ npm install lodash  →  argv.command === "install", argv._.packageName === "lodash"
```

## Help & version

`--help`/`-h` is automatic. Disable it with `help: false`, and print it manually with `argv.showHelp()`. `--version` is automatic only when `version` is set. To customize the document, use `help.render(nodes, renderers)` plus `usage`/`examples`/`description`. Details in [`references/help.md`](references/help.md).

## Conventions worth keeping

- Define flag keys in **camelCase**; cleye automatically parses the kebab-case equivalent (`--saveDev` ⇄ `--save-dev`).
- Use `strict: true` in `tsconfig.json`. Loose mode weakens cleye's flag/parameter inference.
- Type functions **throw** on invalid input; never return `Error` values.
- Reserve `-h`/`--help` and `--version`; cleye handles them unless told otherwise.
- Enable `strictFlags` to reject unknown flags (with did-you-mean suggestions); otherwise they land in `argv.unknownFlags`.
- Commands inherit `strictFlags` and `booleanFlagNegation` from the parent `cli()` but can override them.

## References

- [`parameters.md`](references/parameters.md): positional args (required/optional/spread, ordering, `argv._`, end-of-flags `--`)
- [`flags.md`](references/flags.md): flag type functions, arrays, descriptors, delimiters, boolean negation/inversion, strict flags, unknown flags
- [`formats.md`](references/formats.md): `cleye/formats` helpers and custom type functions
- [`commands.md`](references/commands.md): `command()`, registration, type narrowing, callbacks, aliases, option inheritance
- [`help.md`](references/help.md): auto docs, `help` options, `render` customization, responsive tables
- [`examples.md`](references/examples.md): end-to-end patterns (single-command, multi-command, async, validation, `ignoreArgv`, manual `showHelp`)
- [`v3-migration.md`](references/v3-migration.md): 3.x beta breaking changes (`commands` record, callback/return changes, PascalCase formats, atom-based help, `group()`, `strictCommands`, `CleyeExit`)

## External

- [cleye GitHub](https://github.com/privatenumber/cleye)
- [`cleye` on npm](https://www.npmjs.com/package/cleye)
- [`type-flag`](https://github.com/privatenumber/type-flag): underlying flag parser
