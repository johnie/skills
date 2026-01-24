# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run index.ts     # Run the application
bun --hot ./index.ts # Run with hot reload
bun test             # Run tests
bun test path/to/file.test.ts  # Run single test file

# Linting/Formatting (Ultracite + Biome)
bun x ultracite fix   # Auto-fix formatting and lint issues
bun x ultracite check # Check for issues without fixing
```

Pre-commit hooks run `ultracite fix` automatically via lefthook.

## Bun Runtime

Use Bun exclusively - not Node.js, npm, yarn, pnpm, or vite.

**Prefer Bun APIs:**
- `Bun.serve()` for HTTP servers with routes and WebSockets (not express)
- `Bun.file()` for file I/O (not node:fs)
- `Bun.$` for shell commands (not execa)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.redis` for Redis (not ioredis)
- `Bun.sql` for Postgres (not pg)
- Built-in `WebSocket` (not ws)

Bun auto-loads `.env` files - don't use dotenv.

**Testing:** Use `bun:test` - imports are `import { test, expect } from "bun:test"`

**Frontend:** Use HTML imports with `Bun.serve()` - Bun bundles .tsx/.jsx/.css automatically when imported from HTML.
