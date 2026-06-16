# Help & Version Documentation

cleye uses all the information you provide — `name`, `parameters`, flag `description`/`placeholder`, command names — to generate rich `--help` output. The more you supply, the better the docs.

## Default flags

### Help (`--help`, `-h`)

Handled by default. To disable it, set `help: false`. The document can still be printed manually:

```typescript
const argv = cli({ help: false, /* ... */ });
argv.showHelp();              // print default help
argv.showHelp({ /* HelpOptions */ }); // override content
```

### Version (`--version`)

Auto-handled only when `version` is set:

```typescript
cli({ version: "1.2.3" });

// $ my-script --version
// 1.2.3
```

The version also appears in `--help`. To show a version in help _without_ auto-handling `--version`, pass it via `help.version` instead of the top-level `version`.

> Tip: import `name`, `version`, and `description` from `package.json` to keep them in sync:
>
> ```typescript
> import { name, version, description } from "./package.json" with { type: "json" };
>
> cli({ name, version, help: { description } });
> ```

## `help` options

`help` is either `false` or an object:

| Property | Type | Description |
|---|---|---|
| `version` | `string` | Version shown in `--help`. |
| `description` | `string` | Description shown in `--help`. |
| `usage` | `string \| string[] \| false` | Usage examples. Pass `false` to disable the auto-generated usage. |
| `examples` | `string \| string[]` | Example snippets shown in `--help`. |
| `render` | `(nodes, renderers) => string` | Customize the rendered document. |

## Customizing the document

`help.render(nodes, renderers) => string` gives full control. `nodes` is the array of document nodes; `renderers` is an object of render functions. Each node has `type` (maps to a `renderers` key), `data` (passed to the renderer), and an `id` identifying the section: `name`, `description`, `usage`, `commands`, `flags`, `examples`, `aliases`.

```typescript
cli({
    // ...
    help: {
        render(nodes, renderers) {
            // Modify nodes — e.g. append a line
            nodes.push("\nCheckout cleye: https://github.com/privatenumber/cleye");

            // Extend renderers — e.g. use `=` between flag and value
            renderers.flagOperator = () => "=";

            // Render and return
            return renderers.render(nodes);
        }
    }
});
```

Default renderers live in the cleye source at `/src/render-help/renderers.ts`. Import the `Renderers` type when you need to type a custom renderer:

```typescript
import type { Renderers } from "cleye";
```

## Responsive tables

The "Flags" table wraps cell content based on column and terminal width, with breakpoints for narrower viewports (powered by [`terminal-columns`](https://github.com/privatenumber/terminal-columns)). Configure it via the `renderers.table` renderer.

## `ignoreArgv`

`ignoreArgv` is a callback that selectively excludes argv tokens from parsing. Returning `true` ignores the token:

```typescript
type IgnoreArgvCallback = (
    type: "known-flag" | "unknown-flag" | "argument",
    flagOrArgv: string,
    value: string | undefined
) => boolean | void;
```

Useful for passing a subset of argv through to a child process or another parser. Available on both `cli()` and `command()`.
