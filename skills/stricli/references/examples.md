# Stricli Examples

Patterns that complement the reference files. For parsers, context, routing, and auto-complete, see the dedicated reference files — this page covers composite scenarios and patterns not shown elsewhere. Variadic flags (`variadic: true` / `variadic: ","`) are covered in [parameters.md — Variadic](parameters.md#variadic).

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
    remove: removeCommand,
  },
  aliases: {
    ls: "list",
    rm: "remove",
  },
  docs: {
    brief: "Manage projects",
  },
});

export const app = buildApplication(projectRoutes, {
  name: "pm",
  versionInfo: {
    currentVersion: version,
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
});
```

`versionInfo` is the 1.2.x form. On 1.3.0+ it is deprecated: pass `help`/`helpAll`/`version` integrations as the third argument instead — see [integrations.md](integrations.md).

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

export const deployCommand = buildCommand<
  DeployFlags,
  [env: string],
  DeployContext
>({
  docs: {
    brief: "Deploy to an environment",
  },
  parameters: {
    flags: {
      dryRun: {
        kind: "boolean",
        brief: "Preview without applying",
        optional: true,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Target environment",
          parse: String,
          placeholder: "env",
        },
      ],
    },
  },
  async func(this, flags, env) {
    this.logger.info(`Deploying to ${env}`);
    if (!flags.dryRun) {
      await this.deployer.deploy(env);
    }
    this.process.stdout.write(`Done (dry=${!!flags.dryRun})\n`);
  },
});
```

### Application

```typescript
// src/app.ts
import { buildApplication } from "@stricli/core";
import { version } from "../package.json";
import { deployCommand } from "./commands/deploy";

// 1.2.x form; on 1.3.0+ pass help/helpAll/version integrations as the third argument (integrations.md)
export const app = buildApplication(deployCommand, {
  name: "deploy-cli",
  versionInfo: { currentVersion: version },
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
  deployer: createDeployer(),
});
```

### Test

Uses the `buildContextForTest()` helper from [context.md — Testing with Context](context.md#testing-with-context), extended with the `logger` and `deployer` fields this command needs:

```typescript
import { run } from "@stricli/core";
import { app } from "../src/app";

it("deploys in dry-run mode", async () => {
  // Object.assign keeps the helper's stdout/stderr getters live; a spread would snapshot them
  const ctx = Object.assign(buildContextForTest(), {
    logger: { info: () => {} },
    deployer: { deploy: async () => {} },
  });
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

`-h`, `--help`, `--helpAll`, and `-v`/`--version` (when version info is configured) write to `stdout` and exit with code 0. If your tests assert error-on-any-stderr-output, carve these out.
