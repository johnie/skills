# Routing and Applications

Organize commands and build executable CLI applications.

## buildRouteMap

Organizes multiple commands or nested route maps into a hierarchical structure.

```typescript
function buildRouteMap<Context>(
    config: RouteMapConfig<Context>
): RouteMap<Context>
```

### RouteMapConfig Interface

```typescript
interface RouteMapConfig<Context> {
    routes: {
        [routeName: string]:
            | Command<any, any, Context>
            | RouteMap<Context>
            | LazyRouteMap<Context>;
    };
    docs?: {
        brief?: string;
        description?: string;
    };
}
```

### Basic Example

```typescript
import { buildRouteMap } from "@stricli/core";

export const dbRoutes = buildRouteMap({
    routes: {
        migrate: migrateCommand,
        seed: seedCommand,
        reset: resetCommand,
        backup: backupCommand
    },
    docs: {
        brief: "Database operations",
        description: "Manage database migrations, seeding, and backups"
    }
});
```

Usage: `my-cli db migrate`, `my-cli db seed`

### Nested Routes

Route maps can be nested for deep command hierarchies:

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
```

Usage:
- `my-cli project create myapp`
- `my-cli task add "Write docs"`

### Lazy Loading

Improve startup time by loading commands only when needed:

```typescript
const routes = buildRouteMap({
    routes: {
        // Eagerly loaded (imported immediately)
        quick: quickCommand,

        // Lazy loaded (imported only when invoked)
        analyze: {
            lazy: async () => {
                const { analyzeCommand } = await import("./commands/analyze");
                return analyzeCommand;
            },
            brief: "Analyze code complexity"
        },

        bundle: {
            lazy: async () => {
                const { bundleCommand } = await import("./commands/bundle");
                return bundleCommand;
            },
            brief: "Bundle application"
        }
    }
});
```

**Benefits:**
- Faster CLI startup for common commands
- Reduced memory usage
- Ideal for commands with heavy dependencies

**When to use lazy loading:**
- Commands with large dependencies (bundlers, analyzers)
- CLIs with many commands where users typically use only a few
- Commands with expensive initialization

## buildApplication

Wraps a command or route map into an executable application.

```typescript
function buildApplication<Context>(
    config: ApplicationConfig<Context>
): Application<Context>
```

### ApplicationConfig Interface

```typescript
interface ApplicationConfig<Context> {
    name: string;                    // CLI name (used in help text)
    version: string;                 // Version string
    description?: string;            // App description
    command: Command | RouteMap;     // Root command or route map
    versionFlags?: string[];         // Custom version flags (default: ["version"])
    helpFlags?: string[];            // Custom help flags (default: ["help"])
    versionInfo?: {
        currentVersion: string;      // Current version (overrides version)
        upgradeVersion?: string;     // Available version for update notifications
    };
    scanner?: {
        caseStyle?: "allow-kebab-for-camel";  // Allow --my-flag for myFlag
    };
}
```

### Basic Example

```typescript
import { buildApplication } from "@stricli/core";
import { name, version, description } from "../package.json";
import { rootRoutes } from "./routes";

export const app = buildApplication({
    name,
    version,
    description,
    command: rootRoutes
});
```

### Custom Flags

```typescript
export const app = buildApplication({
    name: "my-cli",
    version: "1.0.0",
    command: rootRoutes,
    versionFlags: ["version", "v"],      // Allow both --version and -v
    helpFlags: ["help", "h", "?"]        // Allow --help, -h, and -?
});
```

### Version Info with Upgrades

Display update notifications when a newer version is available:

```typescript
export const app = buildApplication({
    name: "my-cli",
    version: "1.0.0",
    command: rootRoutes,
    versionInfo: {
        currentVersion: "1.0.0",
        upgradeVersion: "2.0.0"    // Shows "Update available: 2.0.0"
    }
});
```

### Scanner Configuration

#### Case Style: Kebab to Camel Conversion

Allow kebab-case flags to map to camelCase parameter names:

```typescript
export const app = buildApplication({
    name: "my-cli",
    version: "1.0.0",
    command: rootRoutes,
    scanner: {
        caseStyle: "allow-kebab-for-camel"
    }
});
```

With this configuration:
- `--dry-run` maps to `dryRun`
- `--api-key` maps to `apiKey`
- `--max-retries` maps to `maxRetries`

**Example:**

```typescript
// Define command with camelCase flags
const command = buildCommand({
    parameters: {
        flags: {
            dryRun: {
                kind: "boolean",
                brief: "Simulate without making changes"
            },
            apiKey: {
                kind: "parsed",
                parse: String,
                brief: "API key"
            }
        }
    },
    func(flags) {
        console.log(flags.dryRun, flags.apiKey);
    }
});

// Users can use kebab-case
// $ my-cli --dry-run --api-key abc123
```

**Note:** This is a scanner-level setting and affects all commands in the application.

## run

Executes an application with provided arguments and context.

```typescript
async function run<Context>(
    app: Application<Context>,
    args: string[],
    context?: Context
): Promise<void>
```

### Parameters

- **app** - Application built with `buildApplication`
- **args** - Array of CLI arguments (typically `process.argv.slice(2)`)
- **context** - Optional context object passed to all commands

### Basic Usage

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2));
```

### With Custom Context

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

const context = {
    config: loadConfig(),
    logger: createLogger(),
    db: await connectDatabase()
};

await run(app, process.argv.slice(2), context);
```

### With Bun

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

// Bun provides process.argv
await run(app, process.argv.slice(2));
```

### Programmatic Usage

You can invoke the CLI programmatically with custom arguments:

```typescript
import { run } from "@stricli/core";
import { app } from "./app";

// Invoke with custom args
await run(app, ["project", "create", "--name", "my-project"]);

// Test different scenarios
await run(app, ["--version"]);
await run(app, ["--help"]);
```

## Multi-Runtime Support

Stricli works with Node.js, Bun, and Deno:

**Node.js:**
```typescript
import { run } from "@stricli/core";
await run(app, process.argv.slice(2));
```

**Bun:**
```typescript
import { run } from "@stricli/core";
await run(app, process.argv.slice(2));
```

**Deno:**
```typescript
import { run } from "@stricli/core";
await run(app, Deno.args);
```

## Built-in Features

### Automatic Help

Stricli generates help text from `docs.brief` and `docs.description`:

```bash
my-cli --help                # Show root help
my-cli command --help        # Show command help
my-cli db --help            # Show route map help
```

### Version Display

```bash
my-cli --version            # Show version
my-cli -v                   # If configured with versionFlags: ["version", "v"]
```

### Error Messages

Stricli provides clear error messages:

```bash
# Unknown command
$ my-cli unknown
Error: Unknown command: unknown

# Unknown flag
$ my-cli --invalid
Error: Unknown flag: --invalid

# Missing required positional
$ my-cli copy file.txt
Error: Missing required argument: <DEST>

# Too many arguments
$ my-cli deploy extra
Error: Unexpected argument: extra
```
