# Commands, Routing, and Applications

Define commands, group them into route maps, and wrap them in an application.

## `buildCommand`

`buildCommand()` creates a command from either:

- `func` - inline implementation
- `loader` - lazy async loader for the implementation

Both forms require `docs`, and usually `parameters`.

### Inline `func`

```typescript
import { buildCommand, numberParser, type CommandContext } from "@stricli/core";

interface Flags {
    readonly count?: number;
}

export const echoCommand = buildCommand<Flags, [text: string], CommandContext>({
    docs: {
        brief: "Echo text to stdout"
    },
    parameters: {
        flags: {
            count: {
                kind: "parsed",
                parse: numberParser,
                brief: "Repeat count",
                optional: true,
                default: "1"
            }
        },
        positional: {
            kind: "tuple",
            parameters: [
                {
                    brief: "Text to print",
                    parse: String,
                    placeholder: "text"
                }
            ]
        }
    },
    func(this, flags, text) {
        for (let i = 0; i < (flags.count ?? 1); i += 1) {
            this.process.stdout.write(`${text}\n`);
        }
    }
});
```

### Lazy `loader`

Use `loader` when the implementation is heavy or should be code-split.

```typescript
import { buildCommand } from "@stricli/core";

export const analyzeCommand = buildCommand({
    docs: {
        brief: "Analyze a large project"
    },
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [
                {
                    brief: "Project path",
                    parse: String,
                    placeholder: "path"
                }
            ]
        }
    },
    loader: async () => import("./impl")
});
```

The loaded module can export either:

- a default command implementation
- a named implementation returned explicitly from the loader

### Command Documentation

Current command docs use:

- `brief` - required short description
- `fullDescription` - optional multi-line help text shown on command help
- `customUsage` - optional replacement or extension for usage lines

```typescript
docs: {
    brief: "Deploy an app",
    fullDescription: [
        "Deploys the selected application.",
        "Use --dryRun to preview changes before execution."
    ].join("\n"),
    customUsage: [
        "--env prod app-name",
        {
            input: "--env staging app-name --dryRun",
            brief: "Validate deployment without applying changes"
        }
    ]
}
```

### Flag Aliases

Flag aliases live under `parameters.aliases`.

```typescript
parameters: {
    flags: {
        verbose: {
            kind: "boolean",
            brief: "Verbose output",
            optional: true
        }
    },
    aliases: {
        V: "verbose"
    }
}
```

Notes:

- aliases are single characters
- `-h` is reserved for help
- `-H` is reserved for help-all
- `-v` is reserved for version when `versionInfo` is configured

## `buildRouteMap`

`buildRouteMap()` groups commands and nested route maps.

Route maps currently accept:

- `routes` - required mapping of route names to commands or route maps
- `docs` - required route-map documentation
- `aliases` - optional route aliases
- `defaultCommand` - optional fallback command route

### Basic Example

```typescript
import { buildRouteMap } from "@stricli/core";
import { createCommand } from "./create";
import { listCommand } from "./list";

export const projectRoutes = buildRouteMap({
    routes: {
        create: createCommand,
        list: listCommand
    },
    docs: {
        brief: "Manage projects"
    }
});
```

### Nested Route Maps

```typescript
const taskRoutes = buildRouteMap({
    routes: {
        add: addTaskCommand,
        done: doneTaskCommand
    },
    docs: {
        brief: "Manage tasks"
    }
});

export const rootRoutes = buildRouteMap({
    routes: {
        project: projectRoutes,
        task: taskRoutes
    },
    docs: {
        brief: "Project management CLI"
    }
});
```

### Route Aliases

```typescript
export const routes = buildRouteMap({
    routes: {
        remove: removeCommand,
        list: listCommand
    },
    aliases: {
        rm: "remove",
        ls: "list"
    },
    docs: {
        brief: "Manage records"
    }
});
```

### `defaultCommand`

Use `defaultCommand` when navigating to a route map should run one specific command instead of printing help.

```typescript
export const routes = buildRouteMap({
    routes: {
        old: oldCommand,
        modern: modernCommand
    },
    defaultCommand: "old",
    docs: {
        brief: "Migration commands"
    }
});
```

### Route-Map Documentation

Current route-map docs support:

- `brief` - required
- `fullDescription` - optional multi-line help text
- `hideRoute` - optional per-route hiding from normal help output

```typescript
docs: {
    brief: "Application commands",
    fullDescription: "Additional details about the command tree.",
    hideRoute: {
        install: true,
        uninstall: true
    }
}
```

## `buildApplication`

Current public API takes the root target first, then configuration:

```typescript
buildApplication(rootCommandOrRouteMap, config)
```

Do not use the older object form `buildApplication({ command, name, version })` — it was replaced by the positional-first-argument API shown here.

### Single Command

```typescript
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { echoCommand } from "./commands/echo";

export const app = buildApplication(echoCommand, {
    name: "my-cli",
    versionInfo: {
        currentVersion: version
    }
});
```

### Route Map

```typescript
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { rootRoutes } from "./routes";

export const app = buildApplication(rootRoutes, {
    name: "my-cli",
    versionInfo: {
        currentVersion: version
    },
    scanner: {
        caseStyle: "allow-kebab-for-camel"
    }
});
```

### Useful Application Config

- `name` - required CLI name
- `versionInfo` - enables `--version` and version awareness
- `scanner` - input scanning config such as `caseStyle`
- `documentation` - help text formatting config
- `completion` - completion proposal config
- `localization` - localized text config (rarely used; consult upstream docs if needed)
- `determineExitCode` - custom error-to-exit-code mapping

## `run`

`run()` executes an already-built application:

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2), { process });
```

Important details:

- `inputs` should already be tokenized, like `process.argv.slice(2)`
- current public API expects a runtime context object
- in Node-compatible environments, `{ process }` is the normal starting point

### With Custom Context

```typescript
interface AppContext extends CommandContext {
    readonly process: typeof process;
    readonly config: AppConfig;
    readonly logger: Logger;
}

const context: AppContext = {
    process,
    config: loadConfig(),
    logger: createLogger()
};

await run(app, process.argv.slice(2), context);
```

### Programmatic Testing

```typescript
await run(app, ["project", "create", "demo"], testContext);
await run(app, ["--help"], testContext);
await run(app, ["--version"], testContext);
```

## Built-In Help and Version Behavior

- `--help` is built in
- `--helpAll` is built in and reveals hidden flags and routes
- `--version` is built in only when `versionInfo` is configured

## Runtime Notes

- Official quick start and generator are Node/npm oriented
- `pnpm` and `bun` work fine for package installation and script execution in many setups
- Keep package-manager examples flexible, but default to `npm` when following upstream guidance
