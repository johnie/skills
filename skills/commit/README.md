# Commit Skill

An intelligent Git commit automation skill that creates clean, semantic commits from your staged and unstaged changes.

## Overview

The commit skill analyzes your repository's current changes and automatically groups them into logically coherent commits following conventional commit standards. It prioritizes atomic, granular commits over large monolithic ones.

## Key Features

- **Semantic Analysis**: Groups related changes by feature, scope, and type
- **Conventional Commits**: Generates messages with standard format (`feat`, `fix`, `refactor`, etc.)
- **Auto-commit or Verify**: Run silently or get a confirmation prompt before committing
- **Optional Push**: Automatically push commits to the remote branch if requested
- **Respects Staging**: Works with both staged and unstaged changes

## Quick Start

```bash
/commit              # Auto-commit all changes
/commit -v           # Show plan and ask for confirmation
/commit push         # Auto-commit and push to remote
/commit push -v      # Confirm plan, then commit and push
```

## How It Works

1. Analyzes all git changes (`git diff`, `git status`)
2. Groups files logically by feature/scope/type
3. Creates multiple focused commits instead of one large commit
4. Optionally shows you the plan and asks for approval
5. Executes commits with properly formatted messages
6. Can push to remote branch if requested

See `SKILL.md` for detailed documentation.
