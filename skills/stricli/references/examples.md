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

## Testing Error Paths

Stricli prints parameter errors to `stderr` and sets a non-zero exit code via the process context. Real users hit these paths often (forgotten flags, typos in enum values, parsers that throw on bad input) — your tests should cover them too, because the error message is the user's first contact with your CLI.

### Missing required positional

```typescript
it("errors when the target env is missing", async () => {
    const ctx = buildContextForTest();
    await run(app, ["--dryRun"], ctx);
    expect(ctx.stderr).toMatch(/env/i); // Stricli names the missing positional
    // exit code is surfaced via process.exitCode on the context's process
});
```

### Invalid enum value

```typescript
// flag: region: { kind: "enum", values: ["us", "eu"] as const }
it("rejects an unknown region", async () => {
    const ctx = buildContextForTest();
    await run(app, ["--region", "apac", "staging"], ctx);
    expect(ctx.stderr).toMatch(/region/);
    expect(ctx.stderr).toMatch(/us|eu/);
});
```

### Parser that throws

Custom parsers should throw a descriptive `Error`; Stricli surfaces the message to the user. Verify both the failure and the message.

```typescript
const positiveIntParser = (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`expected a positive integer, got "${raw}"`);
    }
    return n;
};

it("reports a helpful error from a custom parser", async () => {
    const ctx = buildContextForTest();
    await run(app, ["--retries", "-1", "staging"], ctx);
    expect(ctx.stderr).toContain("positive integer");
});
```

### Help / version are not errors

`-h`, `--help`, `--helpAll`, and `-v`/`--version` (when `versionInfo` is configured) write to `stdout` and exit with code 0. If your tests assert error-on-any-stderr-output, carve these out.

