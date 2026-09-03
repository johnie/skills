# cleye 3.x beta: what changed from 2.x

`cleye@3.0.0-beta.1` ships on the `beta` dist-tag (`npm i cleye@beta`). Every claim below was checked against the published `dist/index.d.mts`, `dist/formats.d.mts`, `dist/help.d.mts`, `dist/help/responsive.d.mts`, and `package.json` of that version. Anything the type declarations do not encode is tagged `[unverified in beta.1]` and comes from the release notes or the migration guide bundled in the package (`docs/migration/v2-v3.md`). Where the release notes and the shipped declarations disagree, the declarations win — the beta iterated on itself before publishing.

## Runtime requirements

- ESM only: `package.json` has `"type": "module"` and no `require` export condition. CommonJS consumers use `await import("cleye")`.
- Node `>=22.22.2` (`engines.node`). Node 18 and 20 are unsupported.
- New subpaths: `cleye/formats`, `cleye/help`, `cleye/help/responsive`. `cleye/renderers/responsive` is gone `[unverified in beta.1]`.

## `command()` removed; `commands` is a record

Root exports are now `cli`, `group`, `CleyeExit` plus types (`CliOptions`, `Flags`, `ParsedArgv`, `ExitReason`, `Commands`, `CommandEntry`, `HelpOptions`, `HelpContext`, `HelpRenderer`, `DescribedDefault`). `command`, `Command`, `Renderers`, `TypeFlag`, and `MaybePromise` are no longer exported.

`commands` is `Record<string, CommandEntry>` where an entry is either a handler function or `{ description?, alias?, loader }`. The key is the command name. A command parses its own parameters and flags by calling `cli()` again inside its handler — nested calls receive the remaining argv and inherit `strictFlags`, `strictCommands`, `booleanFlagNegation`, and `throwOnExit` from the parent.

Before (2.x):

```typescript
import { cli, command } from "cleye";

cli({
  name: "npm",
  commands: [
    command(
      {
        name: "install",
        parameters: ["<package name>"],
        flags: { saveDev: Boolean },
      },
      (argv) => console.log(argv._.packageName)
    ),
  ],
});
```

After (3.x):

```typescript
import { cli } from "cleye";

const argv = cli({
  name: "npm",
  commands: {
    install: {
      description: "Install a package",
      loader: async () => {
        const argv = cli({
          parameters: ["<package name>"],
          flags: { saveDev: Boolean },
        });
        console.log(argv._.packageName);
      },
    },
  },
});
await argv.runCommand(); // sync cli() does not auto-run the matched command
```

A `loader` that returns a module namespace (`loader: () => import("./install.js")`) runs the module's `default` export. Commands alongside _required_ parameters throw at startup, and `strictCommands` refuses to coexist with `parameters` — both enforced in the shipped `dist/index.mjs` rather than the types. Optional parameters next to `commands` are accepted, although the bundled migration guide still calls the two mutually exclusive.

## Callback signature and return value

The callback is typed `(parsed) => Return | Promise<Return>` — a single argument. `runCommand` lives on `parsed`, not as a second parameter (the release notes' `(parsed, runCommand)` wording predates the shipped types). `parsed` is a discriminated union over `command`: inside `if (parsed.command === "install")`, `parsed.runCommand` carries that handler's parameter and return types; when nothing matched it is a no-op returning `undefined`.

If the callback returns without calling `runCommand`, cleye invokes the matched command afterwards. Calling it yourself lets you run setup first or pass arguments to the handler.

## `cli()` return type depends on the callback

The declarations carry two overloads:

- `cli(options)` — no callback — returns `ParsedArgv` synchronously. Matched commands are _not_ auto-run; call `await argv.runCommand()` yourself.
- `cli(options, callback)` returns `Promise<CallbackReturn>`: whatever the callback returns, not the parsed argv. Pass `(parsed) => parsed` when you want the argv back.

The release notes list both "always returns a Promise" and "returns synchronously when no callback is provided"; the second landed later and is what beta.1 ships. The 2.x thenable-augmented-result pattern is gone.

```typescript
// 2.x
const argv = await cli({ flags: { verbose: Boolean } }, (parsed) => {
  console.log(parsed.flags.verbose);
});

// 3.x — same shape, but the resolved value is now the callback's return
const argv = await cli({ flags: { verbose: Boolean } }, (parsed) => parsed);
```

## `cleye/formats` is PascalCase

| 2.x | 3.x |
| --- | --- |
| `oneOf("a", "b")` | `OneOf(["a", "b"])` — takes an array, result carries a `placeholder` |
| `commaList(Number)` | `CommaList(Number)` |
| `integer()` / `float()` / `url()` | `Integer` / `Float` / `Url` — plain parsers, used without a call |
| `range(1, 10)` | `Range(1, 10)` |

```typescript
import { CommaList, Integer, OneOf, Range } from "cleye/formats";

cli({
  flags: {
    format: OneOf(["json", "csv", "table"]),
    port: Range(1024, 65535),
    retries: Integer,
    tags: CommaList(String),
  },
});
```

## Help rendering: atoms instead of `Renderers`

`help.render` is now `(options: CliOptions, { form: "short" | "long" }) => Node | Node[] | string`. A `Node` is `{ kind: string; render(): string }`. `cleye/help` exports `defaultHelp(options, { form })`, `render`, `renderToString`, and the atoms `p`, `usage`, `section`, `cmds`, `flags`, `flagsColumns`, `flagsStacked`, `footer`. `-h` prints the short form, `--help` the long form; `help` may also be a function of `HelpContext` (`{ name, command, version }`) returning `HelpOptions`.

```typescript
// 2.x
help: {
  render(nodes, renderers) {
    nodes.push("\nDocs: https://example.com");
    return renderers.render(nodes);
  },
}

// 3.x
import { defaultHelp, footer } from "cleye/help";

help: {
  render: (options, { form }) => [...defaultHelp(options, { form }), footer("Docs: https://example.com")],
}
```

Default help no longer wraps to the terminal width. For responsive output import `defaultHelp` (and the atoms) from `cleye/help/responsive` instead of `cleye/help`; it exposes the same names with width-aware rendering. The release notes mention a `createRenderer()` from `cleye/renderers/responsive`; neither name exists in the shipped declarations, so use the subpath swap above.

## Flags

- `group(name, flags)` (root export) tags flags with a `group` so long help lists them under `<name>:`. Spread the result into `flags`; inference is preserved.
- `default` accepts `{ value, description }` (`DescribedDefault`) to show stable help text for computed defaults.
- Standard Schema validators (Zod, Valibot, ArkType) work directly as a flag `type`; the parsed type is inferred from the schema output `[unverified in beta.1]` — the constraint lives in `type-flag@5`, which cleye's declarations import rather than restate. Wrap in `[schema]` for multiple values and keep booleans as `Boolean`.
- Single-character flag names (`v: Boolean`) parse as `-v`; declaring `alias` on such a flag throws at startup `[unverified in beta.1]` — enforced by `type-flag@5.0.0-beta`.
- Acronyms kebab-case correctly: `baseURL` is `--base-url`, not `--base-u-r-l` `[unverified in beta.1]`.

## New options

- `strictCommands` rejects unknown command names with did-you-mean suggestions, mirroring `strictFlags`. Inherited by nested `cli()` calls.
- `throwOnExit: true` makes every exit path (`--help`, `--version`, missing parameter, bad flag value, strict-mode errors, no command matched) throw `CleyeExit` instead of calling `process.exit`. `CleyeExit` exposes `code` (0 for help/version, 1 otherwise) and `reason: ExitReason` (`"help" | "version" | "missing-required-parameter" | "unknown-flag" | "invalid-flag-value" | "unknown-command" | "no-command-match"`). Inherited by nested calls.

```typescript
import { CleyeExit, cli } from "cleye";

try {
  await cli({ throwOnExit: true, flags: { port: Number } }, run);
} catch (error) {
  if (error instanceof CleyeExit && error.reason !== "help")
    process.exitCode = error.code;
}
```

## Migration order

1. Bump Node to 22.22.2+ and make the entry point ESM.
2. Replace each `command()` with a `commands` key whose handler calls `cli()` for its own parameters/flags; drop `name` from those options.
3. Move `runCommand` usage onto `parsed`; `await` any `cli()` call that has a callback and decide what the callback returns.
4. Rename `cleye/formats` imports to PascalCase and switch `oneOf(...)` spreads to arrays.
5. Rewrite `help.render` to return atoms; add `cleye/help/responsive` only if wrapping is needed.
6. Remove `alias` from single-character flag names; update docs that reference mis-cased acronym flags.
