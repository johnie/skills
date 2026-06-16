# Parameters

Parameters (aka _positional arguments_) are the named slots that map onto argument values passed to the script — think of parameters as variable names and arguments as the values bound to them.

## Arguments vs. parameters

Every non-flag value is an _argument_, available on the `_` array:

```typescript
const argv = cli({ /* ... */ });

// $ my-script file-a.txt file-b.txt
argv._; // => ["file-a.txt", "file-b.txt"] (string[])
```

Defining `parameters` gives those arguments names, enables validation, and improves the generated help. Names are accessed in **camelCase** on `argv._`.

## Parameter formats

Declare parameters as strings using these markers:

| Format | Meaning |
|---|---|
| `<parameter name>` | Required parameter |
| `[parameter name]` | Optional parameter |
| `<parameter name...>` | Required spread (1 or more) |
| `[parameter name...]` | Optional spread (0 or more) |

Two ordering rules cleye enforces:

- Required parameters cannot come after optional parameters.
- A spread parameter must be last.

```typescript
const argv = cli({
    parameters: [
        "<required parameter>",
        "[optional parameter]",
        "[optional spread...]"
    ]
});

// $ my-script a b c d
argv._.requiredParameter; // => "a"            (string)
argv._.optionalParameter; // => "b"            (string | undefined)
argv._.optionalSpread;    // => ["c", "d"]     (string[])
```

The multi-word names in the markers (`<first name>`) are converted to camelCase keys (`argv._.firstName`).

## End-of-flags (`--`)

A bare `--` ends flag parsing: everything after it is treated as plain arguments, even if it looks like a flag. This mirrors `npm run <script> -- <script args>`.

All end-of-flag arguments are available on `argv._['--']`:

```typescript
const argv = cli({ /* ... */ });

// $ my-script --my-flag -- --not-a-flag
argv._["--"]; // => ["--not-a-flag"]
```

You can also name the end-of-flags arguments by placing `--` in the `parameters` array:

```typescript
const argv = cli({
    name: "npm-run",
    parameters: [
        "<script>",
        "--",
        "[arguments...]"
    ]
});

// $ npm-run echo -- hello world
argv._.script;    // => "echo"            (string)
argv._.arguments; // => ["hello", "world"] (string[])
```

## Validation

cleye validates the _shape_ of arguments against the declared parameters (required present, ordering, spread). For value-level validation (e.g. "must be an existing file"), validate in your code after parsing, or push validation into a flag/parameter type function that throws — see [`flags.md`](flags.md) and [`formats.md`](formats.md).
