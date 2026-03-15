# Stricli Examples

Patterns that complement the reference files. For parsers, context, routing, and auto-complete, see the dedicated reference files — this page covers composite scenarios and patterns not shown elsewhere.

## Variadic Flags

Variadic flags collect multiple values into an array. Use `variadic: true` for repeated flags or a separator string like `variadic: ","` for comma-delimited input.

```typescript
import { buildCommand } from "@stricli/core";

interface Flags {
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
}

export const buildFilesCommand = buildCommand({
    docs: {
        brief: "Build with include and exclude filters"
    },
    parameters: {
        flags: {
            include: {
                kind: "parsed",
                parse: String,
                brief: "Path(s) to include",
                optional: true,
                variadic: true
            },
            exclude: {
                kind: "parsed",
                parse: String,
                brief: "Glob(s) to exclude",
                optional: true,
                variadic: ","
            }
        }
    },
    func(this, flags: Flags) {
        this.process.stdout.write(
            JSON.stringify(
                {
                    include: flags.include ?? [],
                    exclude: flags.exclude ?? []
                },
                null,
                2
            ) + "\n"
        );
    }
});
```

Usage:

```bash
my-cli --include src --include test --exclude "*.spec.ts,*.test.ts"
```

## Multi-Command Application with Aliases

Combines `buildRouteMap` aliases, scanner case style, and version info into a realistic application entry point.

```typescript
import { buildApplication, buildRouteMap } from "@stricli/core";
import { version } from "../package.json";
import { createCommand } from "./commands/create";
import { listCommand } from "./commands/list";
import { removeCommand } from "./commands/remove";

const projectRoutes = buildRouteMap({
    routes: {
        create: createCommand,
        list: listCommand,
        remove: removeCommand
    },
    aliases: {
        ls: "list",
        rm: "remove"
    },
    docs: {
        brief: "Manage projects"
    }
});

export const app = buildApplication(projectRoutes, {
    name: "pm",
    versionInfo: {
        currentVersion: version
    },
    scanner: {
        caseStyle: "allow-kebab-for-camel"
    }
});
```

Usage:

```bash
pm create my-app
pm ls
pm rm my-app
pm --version
```

## End-to-End: Command with Custom Context and Testing

Shows the full lifecycle — command definition, application wiring, context setup, and tests — in one place. Individual pieces are covered in more detail in [Context](context.md) and [Commands, Routing, and Applications](routing.md).

### Command

```typescript
// src/commands/deploy.ts
import { buildCommand, type CommandContext } from "@stricli/core";

interface DeployContext extends CommandContext {
    readonly logger: Logger;
    readonly deployer: Deployer;
}

interface DeployFlags {
    readonly dryRun?: boolean;
}

export const deployCommand = buildCommand<DeployFlags, [env: string], DeployContext>({
    docs: {
        brief: "Deploy to an environment"
    },
    parameters: {
        flags: {
            dryRun: {
                kind: "boolean",
                brief: "Preview without applying",
                optional: true
            }
        },
        positional: {
            kind: "tuple",
            parameters: [
                {
                    brief: "Target environment",
                    parse: String,
                    placeholder: "env"
                }
            ]
        }
    },
    async func(this, flags, env) {
        this.logger.info(`Deploying to ${env}`);
        if (!flags.dryRun) {
            await this.deployer.deploy(env);
        }
        this.process.stdout.write(`Done (dry=${!!flags.dryRun})\n`);
    }
});
```

### Application

```typescript
// src/app.ts
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { deployCommand } from "./commands/deploy";

export const app = buildApplication(deployCommand, {
    name: "deploy-cli",
    versionInfo: { currentVersion: version }
});
```

### Entry point

```typescript
// src/index.ts
import { run } from "@stricli/core";
import { app } from "./app";

await run(app, process.argv.slice(2), {
    process,
    logger: createLogger(),
    deployer: createDeployer()
});
```

### Test

```typescript
import { run } from "@stricli/core";
import { app } from "../src/app";

function buildContextForTest() {
    let out = "";
    let err = "";
    return {
        process: {
            stdout: { write: (s: string) => { out += s; return true; } },
            stderr: { write: (s: string) => { err += s; return true; } }
        },
        logger: { info: () => {} },
        deployer: { deploy: async () => {} },
        get stdout() { return out; },
        get stderr() { return err; }
    };
}

it("deploys in dry-run mode", async () => {
    const ctx = buildContextForTest();
    await run(app, ["--dryRun", "staging"], ctx);
    expect(ctx.stdout).toContain("dry=true");
});
```
