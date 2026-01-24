# Shell Auto-Completion

Add shell completion support to your CLI with `@stricli/auto-complete`.

## Installation

```bash
npm install @stricli/auto-complete
# or
bun add @stricli/auto-complete
```

## Supported Shells

- **Bash** - Linux, macOS, Windows (Git Bash, WSL)
- **Zsh** - macOS default, Linux
- **Fish** - Cross-platform

## Quick Start

### 1. Add Completion Command

Create a command that generates shell completion scripts:

```typescript
import { buildCommand } from "@stricli/core";
import { generateCompletionScript } from "@stricli/auto-complete";

export const completionCommand = buildCommand({
    docs: {
        brief: "Generate shell completion script",
        description: "Outputs a completion script for your shell (bash, zsh, fish)"
    },
    parameters: {
        flags: {
            shell: {
                kind: "enum",
                values: ["bash", "zsh", "fish"] as const,
                brief: "Shell type",
                default: "bash"
            }
        }
    },
    func(flags) {
        const script = generateCompletionScript({
            name: "my-cli",
            shell: flags.shell
        });

        console.log(script);
    }
});
```

### 2. Add to Route Map

```typescript
import { buildRouteMap } from "@stricli/core";
import { completionCommand } from "./commands/completion";

export const routes = buildRouteMap({
    routes: {
        completion: completionCommand,
        // ... other commands
    }
});
```

### 3. Install Completion

Users install completions by running:

**Bash:**
```bash
# Add to ~/.bashrc or ~/.bash_profile
eval "$(my-cli completion --shell bash)"

# Or save to completion directory
my-cli completion --shell bash > /etc/bash_completion.d/my-cli
```

**Zsh:**
```bash
# Add to ~/.zshrc
eval "$(my-cli completion --shell zsh)"

# Or save to completion directory
my-cli completion --shell zsh > /usr/local/share/zsh/site-functions/_my-cli
```

**Fish:**
```bash
# Save to Fish completion directory
my-cli completion --shell fish > ~/.config/fish/completions/my-cli.fish
```

## Advanced Integration

### Custom Completion Logic

Provide dynamic completions for specific flags:

```typescript
import { buildCommand } from "@stricli/core";
import { generateCompletionScript, CompletionSpec } from "@stricli/auto-complete";

// Define completion spec
const spec: CompletionSpec = {
    commands: {
        deploy: {
            flags: {
                env: {
                    // Static completions
                    completions: ["dev", "staging", "prod"]
                },
                region: {
                    // Dynamic completions (async)
                    async completions() {
                        // Fetch from API, file, etc.
                        return ["us-east-1", "us-west-2", "eu-west-1"];
                    }
                }
            }
        }
    }
};

export const completionCommand = buildCommand({
    docs: {
        brief: "Generate shell completion script"
    },
    parameters: {
        flags: {
            shell: {
                kind: "enum",
                values: ["bash", "zsh", "fish"] as const,
                brief: "Shell type",
                default: "bash"
            }
        }
    },
    func(flags) {
        const script = generateCompletionScript({
            name: "my-cli",
            shell: flags.shell,
            spec
        });

        console.log(script);
    }
});
```

### File Path Completions

Enable file path completions for file parameters:

```typescript
const spec: CompletionSpec = {
    commands: {
        process: {
            flags: {
                input: {
                    completionType: "file"  // Complete file paths
                },
                output: {
                    completionType: "directory"  // Complete directory paths
                }
            }
        }
    }
};
```

### Custom Completion Functions

Provide custom completion logic:

```typescript
const spec: CompletionSpec = {
    commands: {
        deploy: {
            flags: {
                project: {
                    async completions() {
                        // Read from local file
                        const projects = await readProjectList();
                        return projects.map(p => p.name);
                    }
                }
            }
        }
    }
};
```

## Full Example

### src/commands/completion.ts

```typescript
import { buildCommand } from "@stricli/core";
import { generateCompletionScript, CompletionSpec } from "@stricli/auto-complete";

const spec: CompletionSpec = {
    commands: {
        deploy: {
            flags: {
                env: {
                    completions: ["dev", "staging", "prod"]
                }
            }
        },
        config: {
            commands: {
                set: {
                    flags: {
                        key: {
                            completions: ["api_key", "base_url", "timeout"]
                        }
                    }
                }
            }
        }
    }
};

export const completionCommand = buildCommand({
    docs: {
        brief: "Generate shell completion script",
        description: `Install completion with:
  bash: eval "$(my-cli completion --shell bash)"
  zsh:  eval "$(my-cli completion --shell zsh)"
  fish: my-cli completion --shell fish > ~/.config/fish/completions/my-cli.fish`
    },
    parameters: {
        flags: {
            shell: {
                kind: "enum",
                values: ["bash", "zsh", "fish"] as const,
                brief: "Target shell",
                default: "bash"
            }
        }
    },
    func(flags) {
        const script = generateCompletionScript({
            name: "my-cli",
            shell: flags.shell,
            spec
        });

        console.log(script);
    }
});
```

### Usage

```bash
# Generate and install bash completion
eval "$(my-cli completion --shell bash)"

# Now completions work
my-cli deploy --env <TAB>
# Shows: dev  staging  prod

my-cli config set --key <TAB>
# Shows: api_key  base_url  timeout
```

## Benefits

**For Users:**
- Faster command typing with tab completion
- Discover available commands and flags
- Reduce typos and errors
- Better CLI experience

**For Developers:**
- Automatic completion for command structure
- Custom completions for dynamic values
- Support for multiple shells
- No manual completion script writing

## Best Practices

1. **Always provide a completion command** - Make it easy for users to install
2. **Document installation** - Show examples for all supported shells
3. **Use dynamic completions sparingly** - They can slow down completion
4. **Test in all shells** - Behavior differs between bash, zsh, and fish
5. **Include completion in docs** - Add installation instructions to README

## Troubleshooting

### Completions Not Working

**Check if completion is loaded:**
```bash
# Bash
complete -p my-cli

# Zsh
which _my-cli

# Fish
complete -c my-cli
```

**Reload shell configuration:**
```bash
# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc

# Fish
source ~/.config/fish/config.fish
```

### Completions Are Outdated

Regenerate and reinstall after adding new commands:

```bash
# Uninstall old completion
# Then reinstall
eval "$(my-cli completion --shell bash)"
```
