# Integrations and Lifecycle Hooks

Added in `@stricli/core` **1.3.0**. Integrations are the extension point for application-wide behaviour: lifecycle hooks, and application-level flags that run before any command does. `--help` and `--version` were reimplemented on top of this API, so they are now integrations rather than hardwired behaviour.

Check the installed version before using anything here — on 1.2.x none of these exports exist.

## Contents

- [The gotcha: passing `integrations` replaces the defaults](#the-gotcha-passing-integrations-replaces-the-defaults)
- [`StricliIntegration` shape](#stricliintegration-shape)
- [Lifecycle hooks](#lifecycle-hooks)
- [Application flags](#application-flags)
- [Customizing `help` and `version`](#customizing-help-and-version)
- [Error handling](#error-handling)
- [When not to reach for an integration](#when-not-to-reach-for-an-integration)

## The gotcha: passing `integrations` replaces the defaults

`buildApplication` accepts an `integrations` record keyed by name:

```typescript
import { buildApplication, help, version } from "@stricli/core";

export const app = buildApplication(root, {
    name: "my-cli",
    versionInfo: { currentVersion: "1.2.3" },
    integrations: {
        telemetry: telemetryIntegration,
    },
});
```

Omit `integrations` entirely and Stricli gathers the defaults, so `--help` and `--version` keep working exactly as before. **Provide the key and you take over the whole set** — the defaults are no longer gathered, and the above example silently loses `--help` and `--version`.

Register them explicitly whenever you add an integration of your own:

```typescript
integrations: {
    help: help({ formatting: { caseStyle: "convert-camel-to-kebab" } }),
    version: version({}),
    telemetry: telemetryIntegration,
}
```

This is the single most likely way to break a working CLI while adopting 1.3.0.

## `StricliIntegration` shape

```typescript
type StricliIntegration<CONTEXT extends CommandContext> = {
    // Runs at build time. Throw to reject an incompatible application config.
    // The integration's name is added to the error for you.
    readonly validate?: (root, config) => void;
    readonly hooks?: LifecycleHooks<CONTEXT>;
    // `name` comes from the record key, so it is omitted here.
    readonly flag?: Omit<ApplicationFlag<CONTEXT>, "name">;
};
```

All three fields are optional — an integration can be hooks-only, flag-only, or validation-only.

## Lifecycle hooks

Four hooks, two application-level and two command-level:

| Hook | `this` | Fires |
|---|---|---|
| `app:start` | `CommandContext` | Application starts, before any command runs |
| `app:end` | `CommandContext` | Just before the application ends; args include `exitCode` |
| `command:start` | your `CONTEXT` | A command is about to execute |
| `command:end` | your `CONTEXT` | After the command; args include `exitCode` |

```typescript
import type { StricliIntegration } from "@stricli/core";

const timing: StricliIntegration<LocalContext> = {
    hooks: {
        "app:start"() {
            performance.mark("cli-start");
        },
        "app:end"({ exitCode }) {
            performance.mark("cli-end");
            this.process.stderr.write(
                `exit ${exitCode} after ${performance.measure("cli", "cli-start", "cli-end").duration}ms\n`
            );
        },
    },
};
```

The distinction that matters: **`command:*` hooks don't fire when no command runs.** `my-cli --help` and `my-cli` resolving to a route map both skip them. Put "always runs" work such as telemetry flushing or teardown in `app:end`, not `command:end`, or it will silently not run for help invocations.

Command hooks receive your `CONTEXT` on `this`, so they can reach the same injected logger and clients as your command handlers. Application hooks only get the base `CommandContext`.

## Application flags

A flag on an integration runs during route scanning, before the target command executes — which is how `--help` short-circuits:

```typescript
const dryRun: StricliIntegration<LocalContext> = {
    flag: {
        brief: "Print the plan without executing",
        kind: "boolean",
        run(app, args) {
            // `this` is the ApplicationContext, not your CONTEXT
        },
    },
};
```

`defaultForRouteMap: true` makes the flag handle the case where inputs resolve to a route map rather than a command. That is how `--help` preserves the pre-1.3.0 behaviour of printing route-map help. At most one integration may set it; more than one throws at build time.

## Customizing `help` and `version`

Both factories take a configuration object and return a `StricliIntegration`:

```typescript
help({
    alias: "h",          // single-char alias, or `false` to disable it
    includeHidden: false, // the `--helpAll` behaviour
    formatting: { caseStyle: "convert-camel-to-kebab" },
})
```

Typed as `HelpIntegrationConfiguration` and `VersionIntegrationConfiguration`. `help` validates case-style compatibility at build time and throws if the scanner reads names as `original` while display converts camel to kebab — a genuine misconfiguration that used to fail at runtime.

## Error handling

A hook that throws does not crash the process. Stricli catches it, writes a message naming the integration and the hook, and returns `ExitCode.IntegrationError`. Useful in practice: a broken telemetry integration degrades the CLI's exit code rather than the user's command. Don't rely on a throw inside a hook to abort a command — use `validate` for build-time rejection, or a flag's `run` for runtime short-circuiting.

## When not to reach for an integration

- Per-command setup belongs in the command's `func`/`loader`, or in the context factory. Integrations are application-wide.
- Injecting a logger or client is a `CommandContext` concern — see [context.md](context.md).
- Shared flags across a few sibling commands are better expressed as a reusable flag object than as an application flag, which applies everywhere.

## See also

- [routing.md](routing.md) — `buildApplication` and the rest of its configuration
- [context.md](context.md) — `CommandContext` and dependency injection
- [parameters.md](parameters.md) — ordinary command flags
