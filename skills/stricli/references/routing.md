# Commands, Routing, and Applications

Define commands, group them into route maps, and wrap them in an application.

## Contents

- [`buildCommand`](#buildcommand)
- [`buildRouteMap`](#buildroutemap)
- [`buildApplication`](#buildapplication)
- [`run`](#run)
- [Built-In Help and Version Behavior](#built-in-help-and-version-behavior)
- [Runtime Notes](#runtime-notes)

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
    brief: "Echo text to stdout",
  },
  parameters: {
    flags: {
      count: {
        kind: "parsed",
        parse: numberParser,
        brief: "Repeat count",
        optional: true,
        default: "1",
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Text to print",
          parse: String,
          placeholder: "text",
        },
      ],
    },
  },
  func(this, flags, text) {
    for (let i = 0; i < (flags.count ?? 1); i += 1) {
      this.process.stdout.write(`${text}\n`);
    }
  },
});
```

### Lazy `loader`

Use `loader` when the implementation is heavy or should be code-split: `loader: async () => import("./impl")` in place of `func`. The SKILL.md "Large CLIs" section has the full example. The loaded module can export either a default command implementation or a named implementation returned explicitly from the loader.

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

Aliases are single characters. `-h`, `-H`, and `-v` are taken by the built-in help, helpAll, and version flags (see SKILL.md "Upstream conventions").

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
    list: listCommand,
  },
  docs: {
    brief: "Manage projects",
  },
});
```

### Nested Route Maps

```typescript
const taskRoutes = buildRouteMap({
  routes: {
    add: addTaskCommand,
    done: doneTaskCommand,
  },
  docs: {
    brief: "Manage tasks",
  },
});

export const rootRoutes = buildRouteMap({
  routes: {
    project: projectRoutes,
    task: taskRoutes,
  },
  docs: {
    brief: "Project management CLI",
  },
});
```

### Route Aliases

```typescript
export const routes = buildRouteMap({
  routes: {
    remove: removeCommand,
    list: listCommand,
  },
  aliases: {
    rm: "remove",
    ls: "list",
  },
  docs: {
    brief: "Manage records",
  },
});
```

### `defaultCommand`

Use `defaultCommand` when navigating to a route map should run one specific command instead of printing help.

```typescript
export const routes = buildRouteMap({
  routes: {
    old: oldCommand,
    modern: modernCommand,
  },
  defaultCommand: "old",
  docs: {
    brief: "Migration commands",
  },
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

Current public API takes the root target first, then configuration, then an optional integrations record (1.3.0+):

```typescript
buildApplication(rootCommandOrRouteMap, config, integrations?);
```

Do not use the older object form `buildApplication({ command, name, version })` — it was replaced by the positional-first-argument API shown here. The single-command form is in the SKILL.md quick start; a route-map root looks the same:

```typescript
import { buildApplication, help, version } from "@stricli/core";
import { version as currentVersion } from "../package.json";
import { rootRoutes } from "./routes";

const formatting = {
  useAliasInUsageLine: false,
  onlyRequiredInUsageLine: false,
  caseStyle: "convert-camel-to-kebab",
} as const;

export const app = buildApplication(
  rootRoutes,
  {
    name: "my-cli",
    scanner: {
      caseStyle: "allow-kebab-for-camel",
    },
  },
  {
    help: help({
      brief: "Print help information and exit",
      defaultForRouteMap: true,
      formatting,
    }),
    helpAll: help({
      brief:
        "Print help information (including hidden commands/flags) and exit",
      alias: "H",
      hidden: true,
      includeHidden: true,
      formatting,
    }),
    version: version({
      brief: "Print version information and exit",
      info: { currentVersion },
    }),
  }
);
```

On 1.2.x there is no third argument; enable `--version` with `versionInfo: { currentVersion }` in the config instead. That key still works on 1.3.0 but is `@deprecated` — see [integrations.md](integrations.md).

### Useful Application Config

- `name` - required CLI name
- `versionInfo` - enables `--version` on 1.2.x; deprecated on 1.3.0+ in favour of the `version` integration
- `scanner` - input scanning config such as `caseStyle`
- `documentation` - help text formatting config; deprecated on 1.3.0+ in favour of `help({ formatting })`
- `completion` - completion proposal config
- `localization` - localized text config (rarely used; consult upstream docs if needed)
- `determineExitCode` - custom error-to-exit-code mapping

## `run`

`run(app, inputs, context)` executes an already-built application — the SKILL.md quick start shows the entry point. `inputs` should already be tokenized (`process.argv.slice(2)`), and in Node-compatible environments `{ process }` is the normal starting context.

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
  logger: createLogger(),
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

`--help`, `--helpAll`, and `--version` are integrations on 1.3.0+ (see [integrations.md](integrations.md)); on 1.2.x they are built in, with `--version` present only when `versionInfo` is configured.

## Runtime Notes

- Official quick start and generator are Node/npm oriented
- `pnpm` and `bun` work fine for package installation and script execution in many setups
- Mirror the user's package manager in examples; upstream examples use npm
