# Stricli Examples

Complete working examples demonstrating common Stricli patterns.

## Example 1: Custom Parsers

Advanced parsing with validation.

### URL Parser with Validation

```typescript
import { buildCommand } from "@stricli/core";

const urlParser = (input: string): URL => {
    try {
        const url = new URL(input);

        // Validate protocol
        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("URL must use HTTP or HTTPS protocol");
        }

        return url;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Invalid URL: ${input}`);
        }
        throw error;
    }
};

export const fetch = buildCommand({
    docs: {
        brief: "Fetch data from URL"
    },
    parameters: {
        flags: {
            url: {
                kind: "parsed",
                parse: urlParser,
                brief: "URL to fetch",
                placeholder: "URL"
            }
        }
    },
    async func(flags) {
        if (!flags.url) {
            throw new Error("--url is required");
        }

        console.log(`Fetching ${flags.url.href}...`);
        // Fetch logic here
    }
});
```

### Date Range Parser

```typescript
interface DateRange {
    start: Date;
    end: Date;
}

const dateRangeParser = (input: string): DateRange => {
    const [startStr, endStr] = input.split("..");

    if (!startStr || !endStr) {
        throw new Error(
            `Invalid date range format. Use: YYYY-MM-DD..YYYY-MM-DD`
        );
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (Number.isNaN(start.getTime())) {
        throw new Error(`Invalid start date: ${startStr}`);
    }
    if (Number.isNaN(end.getTime())) {
        throw new Error(`Invalid end date: ${endStr}`);
    }
    if (start > end) {
        throw new Error("Start date must be before end date");
    }

    return { start, end };
};

export const report = buildCommand({
    docs: {
        brief: "Generate report for date range"
    },
    parameters: {
        flags: {
            range: {
                kind: "parsed",
                parse: dateRangeParser,
                brief: "Date range (YYYY-MM-DD..YYYY-MM-DD)",
                placeholder: "RANGE"
            }
        }
    },
    func(flags) {
        if (!flags.range) {
            throw new Error("--range is required");
        }

        console.log(`Generating report from ${flags.range.start} to ${flags.range.end}`);
    }
});
```

### File Path Parser with Existence Check

```typescript
import { resolve } from "node:path";
import { access, constants } from "node:fs/promises";

// Note: Stricli doesn't natively support async parsers
// Validate inside the func instead:

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

## Example 2: Variadic Flags and Array Positionals

Handling multiple values.

### Variadic Flags

```typescript
import { buildCommand } from "@stricli/core";

export interface BuildFlags {
    readonly include: readonly string[];
    readonly exclude: readonly string[];
    readonly env: readonly string[];
}

export const build = buildCommand({
    docs: {
        brief: "Build the project",
        description: "Builds the project with specified includes, excludes, and environment variables"
    },
    parameters: {
        flags: {
            include: {
                kind: "variadic",
                parse: String,
                brief: "Directories to include in build",
                default: [],
                placeholder: "DIR"
            },
            exclude: {
                kind: "variadic",
                parse: String,
                brief: "Patterns to exclude from build",
                default: [],
                placeholder: "PATTERN"
            },
            env: {
                kind: "variadic",
                parse: String,
                brief: "Environment variables (KEY=VALUE)",
                default: [],
                placeholder: "VAR"
            }
        }
    },
    func(flags) {
        console.log("Building project...\n");

        if (flags.include.length > 0) {
            console.log("Including:");
            for (const dir of flags.include) {
                console.log(`  • ${dir}`);
            }
            console.log();
        }

        if (flags.exclude.length > 0) {
            console.log("Excluding:");
            for (const pattern of flags.exclude) {
                console.log(`  • ${pattern}`);
            }
            console.log();
        }

        if (flags.env.length > 0) {
            console.log("Environment:");
            for (const envVar of flags.env) {
                console.log(`  • ${envVar}`);
            }
            console.log();
        }

        console.log("✓ Build complete");
    }
});
```

**Usage:**

```bash
build --include src --include lib --exclude "**/*.test.ts" --env NODE_ENV=production --env API_KEY=xyz
```

### Array Positionals

```typescript
import { buildCommand } from "@stricli/core";

export const concat = buildCommand({
    docs: {
        brief: "Concatenate multiple files",
        description: "Reads multiple files and concatenates them into one output file"
    },
    parameters: {
        flags: {
            output: {
                kind: "parsed",
                parse: String,
                brief: "Output file path",
                placeholder: "FILE"
            }
        },
        positional: {
            kind: "array",
            parameter: {
                brief: "Input files to concatenate",
                parse: String,
                placeholder: "FILE"
            }
        }
    },
    async func(flags, inputFiles) {
        if (!flags.output) {
            throw new Error("--output is required");
        }

        if (inputFiles.length === 0) {
            throw new Error("At least one input file is required");
        }

        console.log(`Concatenating ${inputFiles.length} file(s)...`);

        for (const file of inputFiles) {
            console.log(`  • ${file}`);
        }

        // Concatenation logic here
        console.log(`\n✓ Written to ${flags.output}`);
    }
});
```

**Usage:**

```bash
concat --output combined.txt file1.txt file2.txt file3.txt
```

## Example 3: Lazy Loading for Large CLIs

Improve startup time by lazy-loading heavy commands.

### src/routes/index.ts

```typescript
import { buildRouteMap } from "@stricli/core";
import { quickCommand } from "../commands/quick";

export const routes = buildRouteMap({
    routes: {
        // Eagerly loaded (fast, small)
        quick: quickCommand,

        // Lazy loaded (slow, large dependencies)
        analyze: {
            lazy: async () => {
                const { analyzeCommand } = await import("../commands/analyze");
                return analyzeCommand;
            },
            brief: "Analyze code complexity"
        },

        bundle: {
            lazy: async () => {
                const { bundleCommand } = await import("../commands/bundle");
                return bundleCommand;
            },
            brief: "Bundle application"
        },

        deploy: {
            lazy: async () => {
                const { deployCommand } = await import("../commands/deploy");
                return deployCommand;
            },
            brief: "Deploy to production"
        }
    }
});
```

This pattern is especially useful when:
- Some commands import heavy dependencies (bundlers, analyzers, etc.)
- You want fast startup for common commands
- The CLI has many commands but users typically use only a few

## Example 4: Testing Commands

Commands are pure functions that are easy to test.

### test/greet.test.ts

```typescript
import { test, expect } from "vitest";
import { greet } from "../src/commands/greet";

test("greet with default name", () => {
    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg)
    };

    greet.func.call(
        { console: mockConsole },
        { name: "World", shout: false },
        undefined,
        undefined
    );

    expect(output).toEqual(["Hello, World!"]);
});

test("greet with custom name", () => {
    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg)
    };

    greet.func.call(
        { console: mockConsole },
        { name: "Alice", shout: false },
        undefined,
        undefined
    );

    expect(output).toEqual(["Hello, Alice!"]);
});

test("greet with shout enabled", () => {
    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg)
    };

    greet.func.call(
        { console: mockConsole },
        { name: "Bob", shout: true },
        undefined,
        undefined
    );

    expect(output).toEqual(["HELLO, BOB!"]);
});
```

### Testing with Context

```typescript
import { test, expect } from "vitest";
import { createProject } from "../src/commands/project/create";
import type { AppContext } from "../src/context";

test("create project", () => {
    const context: AppContext = {
        db: {
            projects: new Map(),
            tasks: new Map()
        },
        configPath: ".test-config.json"
    };

    const output: string[] = [];
    const mockConsole = {
        log: (msg: string) => output.push(msg)
    };

    createProject.func.call(
        { console: mockConsole },
        { name: "Test Project", description: "Test description" },
        undefined,
        context
    );

    // Verify project was created
    expect(context.db.projects.size).toBe(1);

    const project = Array.from(context.db.projects.values())[0];
    expect(project.name).toBe("Test Project");
    expect(project.description).toBe("Test description");

    // Verify output
    expect(output[0]).toContain("Created project: Test Project");
});
```

## Example 5: Integration with Existing Tools

Using Stricli as a wrapper for existing tools.

### Git Wrapper

```typescript
import { buildCommand, buildRouteMap } from "@stricli/core";
import { execSync } from "node:child_process";

const commitCommand = buildCommand({
    docs: {
        brief: "Create a git commit"
    },
    parameters: {
        flags: {
            message: {
                kind: "parsed",
                parse: String,
                brief: "Commit message",
                placeholder: "MESSAGE"
            },
            all: {
                kind: "boolean",
                brief: "Automatically stage all modified files",
                default: false
            }
        },
        aliases: {
            m: "message",
            a: "all"
        }
    },
    func(flags) {
        if (!flags.message) {
            throw new Error("Commit message is required (--message)");
        }

        const args = ["git", "commit"];

        if (flags.all) {
            args.push("--all");
        }

        args.push("--message", flags.message);

        execSync(args.join(" "), { stdio: "inherit" });
        console.log("✓ Commit created");
    }
});

const pushCommand = buildCommand({
    docs: {
        brief: "Push commits to remote"
    },
    parameters: {
        flags: {
            force: {
                kind: "boolean",
                brief: "Force push",
                default: false
            }
        }
    },
    func(flags) {
        const args = ["git", "push"];

        if (flags.force) {
            args.push("--force");
        }

        execSync(args.join(" "), { stdio: "inherit" });
        console.log("✓ Pushed to remote");
    }
});

export const gitRoutes = buildRouteMap({
    routes: {
        commit: commitCommand,
        push: pushCommand
    },
    docs: {
        brief: "Git operations"
    }
});
```

This pattern works well for:
- Creating type-safe wrappers around CLI tools
- Adding validation before calling external commands
- Providing better error messages and help text
- Composing multiple tool calls into workflows
