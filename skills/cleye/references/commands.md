# Commands

Commands let you organize multiple "scripts" under a single CLI — like `npm install` and `npm run` living inside `npm`. A command is defined with `command()` and registered in the `commands` array of `cli()`.

## Defining and registering commands

`command(options, callback?)` takes the same options as `cli()` plus a required `name`. Pass created commands into `cli`'s `commands` array:

```typescript
import { cli, command } from "cleye";

const argv = cli({
    name: "npm",
    version: "1.2.3",
    commands: [
        command({
            name: "install",
            parameters: ["<package name>"],
            flags: {
                noSave: Boolean,
                saveDev: Boolean
            }
        })
    ]
});

// $ npm install lodash
argv.command;       // => "install"  (string)
argv._.packageName; // => "lodash"   (string)
```

## Type narrowing on `argv.command`

When commands are registered, `argv.command` holds the invoked command name (or `undefined` when none matched). Branching on it narrows `argv._` and `argv.flags` to that command's shape:

```typescript
if (argv.command === "install") {
    argv._.packageName; // typed for the install command
    argv.flags.saveDev; // boolean | undefined
}
```

## `command` options

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Required name used to invoke the command. |
| `alias` | `string \| string[]` | Alias(es) to invoke the command. Shown in an "Aliases:" help section. |
| `parameters` | `string[]` | Positional parameters. Same format as [`parameters.md`](parameters.md). |
| `flags` | `Flags` | Flags for the command. Same as [`flags.md`](flags.md). |
| `help` | `false \| HelpOptions` | Help options. Same as [`help.md`](help.md). |
| `ignoreArgv` | `IgnoreArgvCallback` | Skip specific argv tokens from parsing. |
| `strictFlags` | `boolean` | Reject unknown flags. Inherits from parent CLI if unspecified. |
| `booleanFlagNegation` | `boolean` | Enable `--no-<flag>`. Inherits from parent CLI if unspecified. |

## Option inheritance

Commands inherit `strictFlags` and `booleanFlagNegation` from the parent `cli()`, but can override them per command:

```typescript
command({
    name: "build",
    strictFlags: false // disable for this command even if the CLI enables it
});
```

## Command callbacks (one command per file)

For CLIs with many commands, keep each command — and its output handling — in its own file by passing a callback as the second argument to `command()`. (The `cli()` function accepts a callback too, invoked when no command matches.)

_install-command.ts_

```typescript
import { command } from "cleye";

export const installCommand = command(
    {
        name: "install",
        parameters: ["<package name>"],
        flags: {
            noSave: Boolean,
            saveDev: Boolean
        }
    },
    (argv) => {
        // $ npm install lodash
        argv._.packageName; // => "lodash"
    }
);
```

_npm.ts_ (entry file)

```typescript
import { cli } from "cleye";
import { installCommand } from "./install-command.js";

cli({
    name: "npm",
    commands: [installCommand]
});
```

If a callback returns a Promise, the `cli()` return value becomes a Promise too, so you can `await cli(...)` for async workflows. See [`examples.md`](examples.md).
