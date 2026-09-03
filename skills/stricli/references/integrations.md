# Integrations and Lifecycle Hooks

Added in `@stricli/core` **1.3.0**. Integrations are the extension point for application-wide behaviour: lifecycle hooks, and application-level flags that run before any command does. `--help`, `--helpAll`, and `--version` were reimplemented on top of this API, so they are now integrations rather than hardwired behaviour.

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

Integrations are the **third positional argument** of `buildApplication`, not a key inside the config object:

```typescript
buildApplication(root, config, integrations?: Readonly<Record<string, StricliIntegration<CONTEXT>>>);
```

```typescript
import { buildApplication } from "@stricli/core";

export const app = buildApplication(
  root,
  { name: "my-cli" },
  { telemetry: telemetryIntegration }
);
```

Omit the third argument and Stricli gathers three defaults — `help` (alias `h`), `helpAll` (alias `H`, hidden, `includeHidden: true`), and `version` (alias `v`, only when `versionInfo` is set). **Pass any record, even an empty one, and you take over the whole set** — the defaults are no longer gathered, and the example above silently loses `--help`, `--helpAll`, and `--version`.

Re-register all three whenever you add an integration of your own. Both factories require `brief` and `help` requires a complete `formatting` object:

```typescript
import { buildApplication, help, version } from "@stricli/core";
import { version as currentVersion } from "../package.json";

const formatting = {
  useAliasInUsageLine: false,
  onlyRequiredInUsageLine: false,
  caseStyle: "original",
} as const;

export const app = buildApplication(
  root,
  { name: "my-cli" },
  {
    help: help({
      brief: "Print help information and exit",
      alias: "h",
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
    telemetry: telemetryIntegration,
  }
);
```

`defaultForRouteMap: true` on `help` is what keeps `my-cli some-group` printing the group's help instead of erroring. This is the single most likely way to break a working CLI while adopting 1.3.0.

`config.versionInfo` and `config.documentation.*` are `@deprecated` on 1.3.0 in favour of `version({ info })` and `help({ formatting })`. They still work — and are the only option on 1.2.x — but on 1.3.0+ register `version` yourself rather than relying on the deprecated config key.

`StricliIntegration<CONTEXT>` is invariant in `CONTEXT`, and `help()`/`version()` infer `CommandContext` on their own. When the root command uses a custom context, pass the type argument once — `buildApplication<LocalContext>(root, config, { … })` — so every integration in the record resolves to the same context; otherwise the call fails overload resolution with a confusing "`Command<LocalContext>` is not assignable to `RouteMap<CommandContext>`" error.

## `StricliIntegration` shape

```typescript
type StricliIntegration<CONTEXT extends CommandContext> = {
  // Runs at build time. Throw to reject an incompatible application config.
  // The integration's name is added to the error for you.
  readonly validate?: (
    root: RoutingTarget<CONTEXT>,
    config: ApplicationConfiguration
  ) => void;
  readonly hooks?: LifecycleHooks<CONTEXT>;
  // `name` comes from the record key, so it is omitted here.
  readonly flag?: Omit<ApplicationFlag<CONTEXT>, "name">;
};
```

All three fields are optional — an integration can be hooks-only, flag-only, or validation-only.

## Lifecycle hooks

Four hooks, two application-level and two command-level:

| Hook | `this` | Fires |
| --- | --- | --- |
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

A flag on an integration runs during route scanning, before the target command executes — which is how `--help` short-circuits. Application flags are always boolean switches, so there is no `kind` field; `brief` and `run` are the only required members:

```typescript
const dryRun: StricliIntegration<LocalContext> = {
  flag: {
    brief: "Print the plan without executing",
    global: true, // otherwise the flag only exists on the root target
    run(app, args) {
      // `this` is the ApplicationContext, not your CONTEXT
    },
  },
};
```

Optional members: `aliases` (single characters), `hidden`, `complete` (include in completion proposals), `global`, and `defaultForRouteMap`.

`defaultForRouteMap: true` makes the flag handle the case where inputs resolve to a route map rather than a command. That is how `--help` preserves the pre-1.3.0 behaviour of printing route-map help. At most one integration may set it; more than one throws at build time.

## Customizing `help` and `version`

Both factories take a configuration object and return a `StricliIntegration`. `help` requires `brief` and a full `FormattingConfiguration` — all three members, no partial objects:

```typescript
help({
  brief: "Print help information and exit",
  alias: "h", // single-char alias, or `false` to disable it
  includeHidden: false, // `true` is the `--helpAll` behaviour
  formatting: {
    useAliasInUsageLine: false,
    onlyRequiredInUsageLine: false,
    caseStyle: "convert-camel-to-kebab",
  },
});
```

`version` requires `brief` and `info`; `info` is either `{ currentVersion }` or `{ getCurrentVersion }`, optionally with `getLatestVersion` and `upgradeCommand`. When `getLatestVersion` is set, the integration also registers a hook (default `app:start`, override with `hook`) that warns on stderr when the current version is stale:

```typescript
version({
  brief: "Print version information and exit",
  alias: "v",
  info: {
    currentVersion,
    getLatestVersion: async () => fetchLatestFromRegistry(),
    upgradeCommand: "npm i -g my-cli",
  },
  hook: "app:end",
});
```

Typed as `HelpIntegrationConfiguration` and `VersionIntegrationConfiguration`. `help` validates case-style compatibility at build time and throws if the scanner reads names as `original` while display converts camel to kebab — a genuine misconfiguration that used to fail at runtime.

Upstream `main` adds a `complete` integration (a hidden `--complete` flag that proposes completions for the inputs after it) and deprecates the exported `proposeCompletions` function in its favour — unreleased as of 1.3.0, so don't reach for it until a newer version ships.

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
