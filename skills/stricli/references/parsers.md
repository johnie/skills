# Parsers

Parser functions transform string input into typed values for flags and positional parameters.

## Built-in Parsers

### Native Constructors

```typescript
import { buildCommand } from "@stricli/core";

flags: {
    name: {
        kind: "parsed",
        parse: String,              // Identity parser
        brief: "User name"
    },
    port: {
        kind: "parsed",
        parse: Number,              // Parses numbers (throws on NaN)
        brief: "Port number"
    }
}
```

### Stricli Parsers

```typescript
import { numberParser, booleanParser } from "@stricli/core";

flags: {
    timeout: {
        kind: "parsed",
        parse: numberParser,        // Parses numbers with better error messages
        brief: "Timeout value"
    },
    enabled: {
        kind: "parsed",
        parse: booleanParser,       // Parses "true"/"false" strings
        brief: "Enable feature"
    }
}
```

### Choice Parser

Restricts input to predefined options (use this instead of enum for parsed flags):

```typescript
import { buildChoiceParser } from "@stricli/core";

const colorParser = buildChoiceParser(["red", "green", "blue"]);

flags: {
    color: {
        kind: "parsed",
        parse: colorParser,
        brief: "Choose a color"
    }
}
```

**Note:** For most cases, use `kind: "enum"` instead. Use `buildChoiceParser` only when you need parsed flag behavior with restricted choices.

### Loose Boolean Parser

More lenient boolean parsing that accepts various formats:

```typescript
import { looseBooleanParser } from "@stricli/core";

flags: {
    enabled: {
        kind: "parsed",
        parse: looseBooleanParser,  // Accepts: true/false, 1/0, yes/no, on/off
        brief: "Enable feature"
    }
}
```

Accepted values:
- `true`, `false`
- `1`, `0`
- `yes`, `no`
- `on`, `off`

## Custom Parsers

### Basic Parser Pattern

Parsers are functions that transform string input into typed values:

```typescript
const portParser = (input: string): number => {
    const port = Number.parseInt(input, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid port: ${input}`);
    }
    return port;
};

flags: {
    port: {
        kind: "parsed",
        parse: portParser,
        brief: "Server port"
    }
}
```

### Error Return Pattern

Parsers can return `Error` instead of throwing (cleaner for complex validation):

```typescript
const portParser = (input: string): number | Error => {
    const port = Number.parseInt(input, 10);
    if (Number.isNaN(port)) {
        return new Error(`Invalid number: ${input}`);
    }
    if (port < 1 || port > 65535) {
        return new Error(`Port must be between 1 and 65535, got: ${port}`);
    }
    return port;
};

flags: {
    port: {
        kind: "parsed",
        parse: portParser,
        brief: "Server port (1-65535)"
    }
}
```

### URL Parser

```typescript
const urlParser = (input: string): URL | Error => {
    try {
        const url = new URL(input);

        // Validate protocol
        if (!["http:", "https:"].includes(url.protocol)) {
            return new Error("URL must use HTTP or HTTPS protocol");
        }

        return url;
    } catch {
        return new Error(`Invalid URL: ${input}`);
    }
};

flags: {
    endpoint: {
        kind: "parsed",
        parse: urlParser,
        brief: "API endpoint URL"
    }
}
```

### Date Parser

```typescript
const dateParser = (input: string): Date | Error => {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
        return new Error(`Invalid date: ${input}`);
    }
    return date;
};

flags: {
    startDate: {
        kind: "parsed",
        parse: dateParser,
        brief: "Start date (ISO 8601)",
        placeholder: "YYYY-MM-DD"
    }
}
```

### Regex Parser

```typescript
const regexParser = (input: string): RegExp | Error => {
    try {
        return new RegExp(input);
    } catch (error) {
        return new Error(`Invalid regex: ${input}`);
    }
};

flags: {
    pattern: {
        kind: "parsed",
        parse: regexParser,
        brief: "Regex pattern to match"
    }
}
```

### JSON Parser

```typescript
const jsonParser = <T = unknown>(input: string): T | Error => {
    try {
        return JSON.parse(input) as T;
    } catch {
        return new Error(`Invalid JSON: ${input}`);
    }
};

flags: {
    config: {
        kind: "parsed",
        parse: jsonParser,
        brief: "JSON configuration string"
    }
}
```

### File Path Parser

For file existence validation, perform the check in the command function:

```typescript
import { resolve } from "node:path";
import { access, constants } from "node:fs/promises";

export const process = buildCommand({
    docs: {
        brief: "Process a file"
    },
    parameters: {
        flags: {
            file: {
                kind: "parsed",
                parse: String,
                brief: "File path",
                placeholder: "PATH"
            }
        }
    },
    async func(flags) {
        if (!flags.file) {
            throw new Error("--file is required");
        }

        // Validate file exists and is readable
        const path = resolve(flags.file);
        try {
            await access(path, constants.R_OK);
        } catch {
            throw new Error(`File not readable: ${flags.file}`);
        }

        console.log(`Processing ${path}...`);
        // Process file
    }
});
```

**Note:** Stricli doesn't natively support async parsers. Perform async validation in the command function instead.

### Date Range Parser

Parse complex formats with validation:

```typescript
interface DateRange {
    start: Date;
    end: Date;
}

const dateRangeParser = (input: string): DateRange | Error => {
    const [startStr, endStr] = input.split("..");

    if (!startStr || !endStr) {
        return new Error("Invalid date range format. Use: YYYY-MM-DD..YYYY-MM-DD");
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (Number.isNaN(start.getTime())) {
        return new Error(`Invalid start date: ${startStr}`);
    }
    if (Number.isNaN(end.getTime())) {
        return new Error(`Invalid end date: ${endStr}`);
    }
    if (start > end) {
        return new Error("Start date must be before end date");
    }

    return { start, end };
};

flags: {
    range: {
        kind: "parsed",
        parse: dateRangeParser,
        brief: "Date range (YYYY-MM-DD..YYYY-MM-DD)",
        placeholder: "RANGE"
    }
}
```

## Parser Best Practices

### Clear Error Messages

Provide specific, actionable error messages:

```typescript
const parser = (input: string): number | Error => {
    const value = Number.parseInt(input, 10);
    if (Number.isNaN(value)) {
        return new Error(`Expected a number, got: "${input}"`);
    }
    if (value < 0) {
        return new Error(`Expected a positive number, got: ${value}`);
    }
    return value;
};
```

### Type Safety

Use TypeScript generics for reusable parsers:

```typescript
function buildRangeParser(min: number, max: number) {
    return (input: string): number | Error => {
        const value = Number.parseInt(input, 10);
        if (Number.isNaN(value)) {
            return new Error(`Expected a number, got: "${input}"`);
        }
        if (value < min || value > max) {
            return new Error(`Expected value between ${min} and ${max}, got: ${value}`);
        }
        return value;
    };
}

const portParser = buildRangeParser(1, 65535);
const percentParser = buildRangeParser(0, 100);
```

### Validation in Parsers vs Command Functions

**Use parsers for:**
- Format validation (URL, regex, JSON syntax)
- Type conversion (string to number, date)
- Range validation (min/max values)
- Simple synchronous checks

**Use command functions for:**
- Async validation (file existence, API calls)
- Cross-parameter validation
- Complex business logic
- Database lookups

## Error Handling

Stricli provides clear error messages for parser failures:

```bash
# Parser throws error
$ my-cli --port invalid
Error: Invalid port: invalid

# Parser returns Error
$ my-cli --port 99999
Error: Port must be between 1 and 65535, got: 99999

# Invalid enum value
$ my-cli --format xml
Error: Invalid value for --format: "xml". Must be one of: json, yaml
```
