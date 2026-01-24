# Skills

A collection of specialized skills for Claude Code that extend its capabilities with domain-specific knowledge and workflows.

## Installation

Install skills for your AI agent using the [skills.sh](https://skills.sh/) CLI:

```bash
# Install all skills
npx skills add johnie/skills

# Install a specific skill
npx skills add johnie/skills --skill <skillName>
```

## Skills

<details>
<summary><b>/commit</b> - Semantic git commit automation</summary>

<br>

Create semantically correct, granular git commits by analyzing staged and unstaged changes.

**Features:**
- Automatic staging of all tracked changes
- Intelligent grouping of related changes into atomic commits
- Conventional commit format with semantic types
- Built-in safety checks for merge conflicts and protected branches

**Commands:**
- `/commit` - Auto-commit without confirmation
- `/commit -v` or `/commit --verify` - Show plan and ask for confirmation
- `/commit --dry-run` - Preview commit plan without executing
- `/commit --amend` - Amend last commit (requires -v verification)
- `/commit push` - Commit and push to remote branch
- `/commit push -v` - Push with verification prompt

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `chore` - Maintenance, dependencies, config
- `docs` - Documentation only
- `test` - Adding/updating tests
- `style` - Formatting, whitespace
- `perf` - Performance improvement

</details>

<details>
<summary><b>/pr</b> - GitHub PR management</summary>

<br>

Create, update, and review GitHub PRs with structured templates and comprehensive workflows.

**Features:**
- Structured PR templates with What/Why/How sections
- Smart generation from commits and diffs
- Update existing PRs while preserving user edits
- Code review analysis with quality feedback
- Draft PR support for work-in-progress changes

**Commands:**
- `/pr create` - Create PR with structured template
- `/pr create -v` - Preview draft before creating
- `/pr create --draft` - Create as draft PR (WIP)
- `/pr update` - Update existing PR after new commits
- `/pr update -v` - Preview changes before updating
- `/pr review <pr>` - Review PR by number or URL

**Workflows:**
- **Create**: Analyzes commits and diffs to generate comprehensive PR descriptions with proper formatting
- **Update**: Regenerates What/How/Changes sections while preserving Testing, Screenshots, and Deployment notes
- **Review**: Provides structured feedback on code quality, testing, security, and performance

**Template Sections:**
- What - Concise summary of changes
- Why - Context and motivation
- How - Implementation approach
- Changes - Bullet list of modifications
- Testing - Checklist for test coverage
- Deployment - Special deployment considerations
- Screenshots - Visual proof for UI changes

</details>

<details>
<summary><b>/stricli</b> - TypeScript CLI framework expertise</summary>

<br>

Build type-safe CLI applications with Stricli, Bloomberg's TypeScript CLI framework.

**Features:**
- Compile-time type checking for command parameters
- Automatic help generation
- Flexible command routing for multi-command CLIs
- Support for flags, positional arguments, and custom parsers

**Use Cases:**
- Creating command-line tools with TypeScript
- Defining commands with typed flags and positional arguments
- Organizing multi-command CLIs with route maps
- Compile-time parameter validation

**Core APIs:**
- `buildCommand` - Create typed commands with parameters
- `buildRouteMap` - Organize multiple commands with routing
- `buildApplication` - Wrap commands into executable apps
- `run` - Execute the application

**Parameter Types:**
- Boolean flags (`--verbose`)
- Counter flags (`-vvv`)
- Enum flags (`--format json|yaml|text`)
- Parsed flags (String, Number, custom parsers)
- Variadic flags (multiple values)
- Positional parameters (tuple or array)

</details>

<details>
<summary><b>/wp-cli</b> - WordPress CLI operations</summary>

<br>

WordPress CLI operations for database management, plugins, themes, users, content, and site configuration.

**Features:**
- Safe database migrations with automatic backups
- Bulk plugin and theme updates
- User management and audits
- Content operations
- Remote execution via SSH

**Command Categories:**
- `wp db` - Database operations (export, import, query, optimize)
- `wp core` - WordPress core management (install, update, verify)
- `wp plugin` / `wp theme` - Plugin and theme management
- `wp user` - User operations (create, list, delete, update)
- `wp post` / `wp comment` - Content management
- `wp option` - Settings and configuration
- `wp cache` / `wp transient` - Cache management
- `wp cron` - Scheduled tasks
- `wp config` - Configuration file management

**Common Workflows:**
- Site migration between environments
- Bulk plugin updates with rollback support
- User audits and cleanup
- Search-replace for URL changes
- Database backups and imports

**Safety Features:**
- Automatic backup reminders before destructive operations
- Dry-run flags for testing commands
- Explicit confirmation required for dangerous operations
- Skip flags for performance optimization

</details>

## License

MIT

---

Created by [@johnie](https://johnie.se)
