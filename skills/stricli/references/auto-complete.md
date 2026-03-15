# Shell Auto-Complete

Add shell auto-complete support with `@stricli/auto-complete`.

## Current Support

Upstream Stricli currently supports:

- `bash`

Do not claim built-in `zsh` or `fish` support unless upstream docs change.

## Install the Package

```bash
npm install @stricli/auto-complete
# pnpm add / bun add also work
```

## Standalone Install / Uninstall Flow

The official management command is package-based and usually invoked with `npx`.

### Install

```bash
npx @stricli/auto-complete@latest install --shell bash my-cli __my_cli_bash_complete
# pnpm dlx / bunx also work
```

### Uninstall

```bash
npx @stricli/auto-complete@latest uninstall --shell bash my-cli
# pnpm dlx / bunx also work
```

The install command wires a target command (`my-cli`) to a bash completion command (`__my_cli_bash_complete`).

## Built-In Commands in Your App

`@stricli/auto-complete` exposes:

- `buildInstallCommand(targetCommand, commands)`
- `buildUninstallCommand(targetCommand, shells)`

Use them to add hidden install/uninstall commands to your own CLI.

```typescript
import { buildApplication, buildRouteMap } from "@stricli/core";
import {
    buildInstallCommand,
    buildUninstallCommand
} from "@stricli/auto-complete";
import { version } from "../package.json";
import { statusCommand } from "./commands/status";

const routes = buildRouteMap({
    routes: {
        status: statusCommand,
        install: buildInstallCommand("my-cli", {
            bash: "__my_cli_bash_complete"
        }),
        uninstall: buildUninstallCommand("my-cli", {
            bash: true
        })
    },
    docs: {
        brief: "Example CLI",
        hideRoute: {
            install: true,
            uninstall: true
        }
    }
});

export const app = buildApplication(routes, {
    name: "my-cli",
    versionInfo: {
        currentVersion: version
    }
});
```

This mirrors the current upstream guidance and generated app structure.

## Package Layout Pattern

The upstream generator typically creates:

- one main CLI binary
- one bash-completion helper binary
- a postinstall hook that runs the completion installer

Representative pattern:

```json
{
  "bin": {
    "my-cli": "dist/cli.js",
    "__my_cli_bash_complete": "dist/bash-complete.js"
  },
  "scripts": {
    "postinstall": "npx @stricli/auto-complete@latest install --shell bash my-cli __my_cli_bash_complete"
  }
}
```

If you mention alternatives, keep `npm` first but note that the same idea can be adapted for `pnpm dlx` or `bunx`.

## Best Practices

- keep install/uninstall commands hidden from standard help with `docs.hideRoute` (users should not see internal completion plumbing)
- use the upstream bash-only model unless official docs add more shells
- prefer the generator or upstream package layout for first-time setup
- avoid inventing script-generation APIs that are not in the public package docs
