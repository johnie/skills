# cleye Examples

Composite patterns that combine the building blocks covered in the other references ([parameters](parameters.md), [flags](flags.md), [formats](formats.md), [commands](commands.md), [help](help.md)).

## Multi-command CLI (npm-style)

```typescript
import { cli, command } from "cleye";

const argv = cli({
    name: "pm",
    version: "1.2.3",
    commands: [
        command({
            name: "install",
            alias: "i",
            parameters: ["<package name>"],
            flags: {
                saveDev: Boolean,
                noSave: Boolean
            }
        }),
        command({
            name: "run",
            parameters: ["<script>", "--", "[arguments...]"]
        })
    ]
});

switch (argv.command) {
    case "install":
        console.log(`Installing ${argv._.packageName} (dev=${!!argv.flags.saveDev})`);
        break;
    case "run":
        console.log(`Running ${argv._.script} with`, argv._.arguments);
        break;
    default:
        argv.showHelp(); // no command matched
}

// $ pm i lodash --save-dev
// $ pm run build -- --watch
```

## Per-file commands with callbacks

Keep each command and its handling in its own file; the callback fires when that command is invoked.

_commands/build.ts_

```typescript
import { command } from "cleye";
import { oneOf } from "cleye/formats";

export const buildCommand = command(
    {
        name: "build",
        flags: {
            target: { type: oneOf("node", "browser"), default: "node" },
            minify: Boolean
        }
    },
    (argv) => {
        console.log(`Building for ${argv.flags.target}, minify=${!!argv.flags.minify}`);
    }
);
```

_cli.ts_

```typescript
import { cli } from "cleye";
import { buildCommand } from "./commands/build.js";

cli({
    name: "bundler",
    commands: [buildCommand]
});
```

## Async workflows with `await cli(...)`

When a callback returns a Promise, `cli()` returns a Promise too:

```typescript
import { cli } from "cleye";

await cli(
    {
        name: "deploy",
        parameters: ["<env>"],
        flags: { dryRun: Boolean }
    },
    async (argv) => {
        if (argv.flags.dryRun) {
            console.log(`Would deploy to ${argv._.env}`);
            return;
        }
        await deploy(argv._.env);
        console.log(`Deployed to ${argv._.env}`);
    }
);
```

## Validation with custom types and `cleye/formats`

```typescript
import { cli } from "cleye";
import { integer, range, url } from "cleye/formats";

const argv = cli({
    name: "serve",
    flags: {
        port: { type: range(1024, 65_535), default: 8080 },
        workers: { type: integer(), default: 1 },
        origin: { type: url(), description: "Allowed CORS origin" }
    }
});

// $ serve --port 3000 --workers 4 --origin https://example.com
argv.flags.port;    // number in [1024, 65535]
argv.flags.workers; // integer
argv.flags.origin;  // URL | undefined
```

Invalid input is reported automatically because the type functions throw:

```sh
$ serve --port 80
# Error from range(): out of [1024, 65535]
```

## Forwarding unknown flags with `ignoreArgv`

Pass a subset of argv straight through to a wrapped tool without cleye trying to parse it:

```typescript
import { cli } from "cleye";

const argv = cli({
    name: "wrap",
    parameters: ["<tool>"],
    flags: { verbose: Boolean },
    // Ignore everything after the tool name so it can be forwarded verbatim
    ignoreArgv(type) {
        return type === "unknown-flag" || type === "argument";
    }
});

// Inspect what cleye chose to ignore vs. parse
argv.flags.verbose;
argv.unknownFlags;
```

## Manual help and version

Disable auto-handling and print on your own terms:

```typescript
import { cli } from "cleye";

const argv = cli({
    name: "tool",
    version: "0.1.0",
    help: false,
    flags: { info: Boolean }
});

if (argv.flags.info) {
    argv.showVersion();
    argv.showHelp();
}
```
