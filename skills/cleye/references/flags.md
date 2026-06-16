# Flags

Flags (aka options) are key-value pairs passed in the form `--flag-name <value>`. cleye's flag parsing is powered by [`type-flag`](https://github.com/privatenumber/type-flag).

## Defining flags

Each entry in the `flags` object maps a flag name to either a **type function** or a **descriptor object**. Define keys in **camelCase** — cleye automatically parses the kebab-case equivalent (`saveDev` accepts `--save-dev`).

A type function is any function that takes a string and returns the parsed value. The built-in JS constructors cover most cases: `String`, `Number`, `Boolean`.

```typescript
const argv = cli({
    flags: {
        someBoolean: Boolean,

        someString: {
            type: String,
            description: "Some string flag",
            default: "n/a"
        },

        someNumber: {
            // Wrap the type function in an array to allow multiple values
            type: [Number],
            alias: "n",
            description: "Array of numbers. (eg. -n 1 -n 2 -n 3)"
        }
    }
});

// $ my-script --some-boolean --some-string hello --some-number 1 -n 2
argv.flags.someBoolean; // => true        (boolean | undefined)
argv.flags.someString;  // => "hello"     (string)
argv.flags.someNumber;  // => [1, 2]      (number[])
```

## Descriptor object properties

| Property | Type | Description |
|---|---|---|
| `type` | `Function` | Flag value parsing function (or `[Function]` for multiple values). |
| `alias` | `string` | Single-character alias (e.g. `n` → `-n`). |
| `default` | `any` | Default value when the flag is absent. |
| `description` | `string` | Shown in `--help`. |
| `placeholder` | `string` | Value placeholder shown in `--help` (e.g. `--port <number>`). |

## Multiple values

Wrap the type function in an array to collect repeated occurrences into an array:

```typescript
flags: {
    file: { type: [String], alias: "f" }
}

// $ my-script -f a.txt -f b.txt
// argv.flags.file => ["a.txt", "b.txt"]
```

## Parsing features (from type-flag)

- **Delimiters**: `--flag value`, `--flag=value`, `--flag:value`, and `--flag.value` all work.
- **Combined aliases**: `-abcd 2` expands to `-a -b -c -d 2`.
- **End of flags**: a bare `--` ends flag parsing (see [`parameters.md`](parameters.md)).
- **Unknown flags**: unexpected flags are collected on `argv.unknownFlags` (unless `strictFlags` is on).

## Boolean flags

### Negation (`--no-<flag>`)

Enable `booleanFlagNegation` to support `--no-<flag>` for boolean flags:

```typescript
cli({
    flags: { verbose: Boolean },
    booleanFlagNegation: true
});

// $ my-script --no-verbose   → argv.flags.verbose === false
```

Last-wins semantics apply between `--flag` and `--no-flag`:

```sh
$ my-script --verbose --no-verbose   # => false
$ my-script --no-verbose --verbose   # => true
```

Only flags defined as `Boolean` are affected. For non-boolean flags, `--no-<flag>` is treated as an unknown flag. Commands inherit `booleanFlagNegation` from the parent CLI but can override it.

### Inverting with `=`

Even without `booleanFlagNegation`, a boolean flag can be set false using `=`:

```sh
$ my-script --some-boolean=false   # => false
```

Without `=`, the value is parsed as a separate argument:

```sh
$ my-script --some-boolean false
# argv.flags.someBoolean => true
# argv._ => ["false"]
```

## Strict flags

Enable `strictFlags` to reject unknown flags with an error (and a did-you-mean suggestion within 2 edits):

```typescript
cli({
    flags: { foo: Boolean, bar: String },
    strictFlags: true
});

// $ my-script --baz
// Error: Unknown flag: --baz. (Did you mean --bar?)
```

When enabled, the CLI exits with an error on any unknown flag. Commands inherit `strictFlags` from the parent CLI but can override it (e.g. `strictFlags: false` on a passthrough command).

## Unknown flags

When `strictFlags` is off, unexpected flags are collected on `argv.unknownFlags` as `{ [flagName: string]: (string | boolean)[] }`, so you can forward or inspect them:

```typescript
// $ my-script --custom value --custom2
argv.unknownFlags; // => { custom: ["value"], custom2: [true] }
```

## Custom types and validation

For typed/validated flags beyond the built-in constructors, use a custom type function or a helper from `cleye/formats`. See [`formats.md`](formats.md).
