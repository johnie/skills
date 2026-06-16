---
name: cleye
description: Build type-safe TypeScript CLIs with the cleye argv parser. Use when the user is authoring a new cleye CLI, adding or changing typed flags/parameters on an existing `cli()` call, defining subcommands with `command()`, using `cleye/formats` helpers (oneOf/commaList/integer/float/range/url), customizing `--help` output via `help.render`, or wiring `strictFlags`/`booleanFlagNegation`. Skip for generic "best CLI framework?" questions or maintenance of CLIs built on commander/yargs/oclif/minimist.
---

# cleye CLI Tool

cleye is an intuitive argv-parsing tool for Node.js CLIs. It turns a declarative options object into strongly-typed parameters and flags, auto-generates `--help` and `--version` documentation, and supports nested commands. Flag parsing is powered by [`type-flag`](https://github.com/privatenumber/type-flag).

## When to use

- Authoring a new cleye CLI with `cli({ ... })`
- Adding or changing typed flags / positional parameters
- Defining subcommands with `command()` and registering them in `commands`
- Using `cleye/formats` helpers or writing custom type functions for validation
- Customizing help output (`help.render`, `usage`, `examples`)
- Enabling `strictFlags`, `booleanFlagNegation`, or `ignoreArgv`
- Handling parsed output with a callback (`cli(options, callback)` / `command(options, callback)`)

## When NOT to use

- The user has an existing CLI on a different framework (commander, yargs, oclif, minimist) — this skill doesn't migrate, and the APIs don't translate.
- Generic "which CLI framework should I use?" — that's a design conversation, not a cleye question.
- Non-TypeScript CLIs — cleye works in plain JS, but its core value is compile-time type inference of flags and parameters.
- Runtime debugging of an installed CLI (not developing it) — use shell/debugging tooling.

## Core API surface

cleye's API is intentionally small. If something isn't listed here or in the references, assume it doesn't exist — checking the upstream repo is faster than guessing, and invented APIs compile until they don't.

| Entry point | Purpose |
|---|---|
| `cli(options, callback?, argvs?)` | Parse argv from a declarative options object; returns `ParsedArgv` |
| `command(options, callback?)` | Define a subcommand; same options as `cli` plus `name`/`alias` |
| `cleye/formats` | Tree-shakable type-function helpers (`oneOf`, `commaList`, `integer`, `float`, `range`, `url`) |
| `Flags` / `Renderers` / `TypeFlag` | Exported types for flag objects, help renderers, and portable flag declarations |

`cli()` returns a `ParsedArgv`:

```typescript
type ParsedArgv = {
    _: string[] & Parameters;            // positional args, named in camelCase
    flags: { [flagName: string]: InferredType };
    unknownFlags: { [flagName: string]: (string | boolean)[] };
    command?: string;                    // present when commands are registered
    showVersion: () => void;
    showHelp: (options?: HelpOptions) => void;
};
```

## Installation

Upstream docs are npm-first. Stay agnostic to the user's package manager — pnpm and bun work equally well (this repo uses pnpm).

```bash
npm i cleye
# pnpm add cleye / bun add cleye work the same way
```

## Quick start: single-command CLI

```typescript
// greet.ts
import { cli } from "cleye";

const argv = cli({
    name: "greet.js",
    parameters: [
        "<first name>", // required
        "[last name]"   // optional
    ],
    flags: {
        time: {
            type: String,
            description: "Time of day to greet (morning or evening)",
            default: "morning"
        }
    }
});

const name = [argv._.firstName, argv._.lastName].filter(Boolean).join(" ");

if (argv.flags.time === "morning") {
    console.log(`Good morning ${name}!`);
} else {
    console.log(`Good evening ${name}!`);
}
```

Run it:

```sh
$ node greet.js John Doe --time evening
Good evening John Doe!
```

Generated help (`--help` is handled automatically):

```sh
$ node greet.js --help

greet.js

Usage:
  greet.js [flags...] <first name> [last name]

Flags:
  -h, --help                 Show help
      --time <string>        Time of day to greet (morning or evening) (default: "morning")
```

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
    version: "1.2.3",
    commands: [
        command({
            name: "install",
            parameters: ["<package name>"],
            flags: { noSave: Boolean, saveDev: Boolean }
        })
    ]
});

// $ npm install lodash
argv.command;          // => "install"
argv._.packageName;    // => "lodash"
```

## Help & version

- `--help` / `-h` is handled by default; set `help: false` to disable (you can still call `argv.showHelp()`).
- `--version` is handled only when `version` is set. To show a version in help without auto-handling the flag, pass `help.version`.
- Customize the document with `help.render(nodes, renderers) => string`, and supply `usage` / `examples` / `description`.
- Tip: import `name`, `version`, and `description` from `package.json` to avoid drift.

Details in [`references/help.md`](references/help.md).

## Recommended workflow

### Single-command CLI
`cli({ name, parameters, flags })` → read `argv._` / `argv.flags`. Pass a callback as the second argument when you prefer to keep handling co-located, and return a Promise from it to `await cli(...)`.

### Multi-command CLI
Define each command with `command()` (ideally one per file with its own callback), register them in `commands`, then branch on `argv.command` if you handle output centrally. See [`references/commands.md`](references/commands.md).

## Conventions worth keeping

- Define flag keys in **camelCase**; cleye automatically parses the kebab-case equivalent (`--saveDev` ⇄ `--save-dev`).
- Use `strict: true` in `tsconfig.json` — cleye's flag/parameter inference is the whole point, and loose mode weakens it.
- Type functions **throw** on invalid input; never return `Error` values.
- Reserve `-h`/`--help` and `--version`; cleye handles them unless told otherwise.
- Enable `strictFlags` to reject unknown flags (with did-you-mean suggestions); otherwise they land in `argv.unknownFlags`.
- Commands inherit `strictFlags` and `booleanFlagNegation` from the parent `cli()` but can override them.

## References

- [`parameters.md`](references/parameters.md) — positional args: required/optional/spread, ordering, `argv._`, end-of-flags `--`
- [`flags.md`](references/flags.md) — flag type functions, arrays, descriptors, delimiters, boolean negation/inversion, strict flags, unknown flags
- [`formats.md`](references/formats.md) — `cleye/formats` helpers and custom type functions
- [`commands.md`](references/commands.md) — `command()`, registration, type narrowing, callbacks, aliases, option inheritance
- [`help.md`](references/help.md) — auto docs, `help` options, `render` customization, responsive tables
- [`examples.md`](references/examples.md) — composite end-to-end patterns (multi-command, async, validation, `ignoreArgv`, manual `showHelp`)

## External

- [cleye GitHub](https://github.com/privatenumber/cleye)
- [`cleye` on npm](https://www.npmjs.com/package/cleye)
- [`type-flag`](https://github.com/privatenumber/type-flag) — underlying flag parser
