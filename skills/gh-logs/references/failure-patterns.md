# CI Failure Patterns

Signature database for matching log output to failure categories. When analyzing logs, scan for these patterns to classify and diagnose.

## Test Failures

### JavaScript / TypeScript (Jest, Vitest, Bun)

| Pattern | Meaning |
|---|---|
| `FAIL src/...` | Test file failed |
| `Test Suites: X failed` | Jest/Vitest summary |
| `Expected: ...` / `Received: ...` | Assertion mismatch |
| `Snapshot Summary: X snapshots failed` | Outdated snapshots |
| `Timed out in waitFor` | Async assertion timeout |
| `Cannot find module` in test | Missing mock or import |
| `Your test suite must contain at least one test` | Empty/misconfigured test file |
| `EADDRINUSE` | Port conflict between tests |

**Common root causes**: Snapshot drift after UI changes, missing test updates after refactor, race conditions in async tests, port conflicts from parallel test runs.

**Typical fixes**: Update snapshots (`--update`), fix assertion to match new behavior, add `--forceExit`, use random ports.

### Python (pytest)

| Pattern | Meaning |
|---|---|
| `FAILED test_...` | Test function failed |
| `AssertionError` | Assertion mismatch |
| `E       assert ...` | pytest assertion detail |
| `ModuleNotFoundError` | Missing dependency in test env |
| `fixture '...' not found` | Missing or misspelled fixture |

### Go

| Pattern | Meaning |
|---|---|
| `--- FAIL: Test...` | Test function failed |
| `got ..., want ...` | Table-driven test mismatch |
| `panic: runtime error` | Nil pointer or index out of range |
| `race detected` | Data race (with `-race` flag) |

### Rust

| Pattern | Meaning |
|---|---|
| `test ... FAILED` | Test failed |
| `left: ..., right: ...` | `assert_eq!` mismatch |
| `thread '...' panicked` | Panic in test |

## Build Failures

### TypeScript

| Pattern | Meaning |
|---|---|
| `error TS\d+:` | TypeScript compiler error |
| `Cannot find module '...'` | Missing import/package |
| `Type '...' is not assignable to type '...'` | Type mismatch |
| `Property '...' does not exist on type '...'` | Missing property |
| `tsc exited with code 1` | General compilation failure |

**Common root causes**: New code doesn't match type definitions, missing `@types/` package, breaking change from dependency upgrade.

### Bundlers (Webpack, Vite, esbuild, Turbopack)

| Pattern | Meaning |
|---|---|
| `Module not found: Error: Can't resolve` | Missing module |
| `Build failed with X errors` | esbuild failure |
| `[vite]: Rollup failed to resolve` | Vite resolution failure |
| `SyntaxError: Unexpected token` | Unsupported syntax/missing loader |

### Go

| Pattern | Meaning |
|---|---|
| `cannot find package` | Missing dependency |
| `undefined:` | Missing symbol reference |
| `imported and not used` | Unused import |

### Docker

| Pattern | Meaning |
|---|---|
| `COPY failed:` | File not found during build |
| `returned a non-zero code` | RUN command failed |
| `no matching manifest for` | Platform/architecture mismatch |

## Dependency Failures

### npm / Yarn / pnpm / Bun

| Pattern | Meaning |
|---|---|
| `ERESOLVE unable to resolve dependency tree` | Peer dependency conflict |
| `404 Not Found - GET https://registry.npmjs.org/` | Package doesn't exist or is unpublished |
| `ETARGET No matching version found` | Requested version doesn't exist |
| `npm ERR! code EINTEGRITY` | Checksum mismatch (corrupted cache) |
| `error: could not determine executable to run` | Missing bin in package |
| `ECONNREFUSED` / `ETIMEDOUT` | Registry unreachable |

**Common root causes**: Unpublished/yanked package, peer dependency conflict after upgrade, stale lockfile, registry outage.

**Typical fixes**: `bun install` to regenerate lockfile, pin version, use `--legacy-peer-deps`, check registry status.

### pip (Python)

| Pattern | Meaning |
|---|---|
| `No matching distribution found` | Package/version doesn't exist |
| `Could not find a version that satisfies` | Version constraint conflict |
| `ERROR: Failed building wheel` | Native compilation failure |

### Docker Registry

| Pattern | Meaning |
|---|---|
| `manifest unknown` | Image tag doesn't exist |
| `pull access denied` | Auth failure or private image |
| `toomanyrequests` | Docker Hub rate limit |

## Infrastructure Failures

### Out of Memory

| Pattern | Meaning |
|---|---|
| `Killed` (exit code 137) | OOM killer terminated process |
| `JavaScript heap out of memory` | Node.js memory limit |
| `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed` | V8 memory exhaustion |
| `MemoryError` | Python OOM |

**Typical fixes**: Increase runner memory, add `--max-old-space-size`, split workload, use swap.

### Disk

| Pattern | Meaning |
|---|---|
| `No space left on device` | Disk full |
| `ENOSPC` | Node.js disk full error |

**Typical fixes**: Clean workspace, reduce artifact size, use larger runner.

### Runner / Environment

| Pattern | Meaning |
|---|---|
| `The runner has received a shutdown signal` | Runner preempted/terminated |
| `Job was cancelled` | Manual or concurrency cancellation |
| `This request was automatically failed` | GitHub infrastructure issue |
| `The hosted runner encountered an error` | Runner provisioning failure |

### Network

| Pattern | Meaning |
|---|---|
| `Connection reset by peer` | Network interruption |
| `ETIMEDOUT` | Connection timeout |
| `Could not resolve host` | DNS failure |
| `SSL: CERTIFICATE_VERIFY_FAILED` | TLS/certificate issue |

## Lint / Format Failures

| Pattern | Meaning |
|---|---|
| `X error(s) found` / `found X errors` | Linter errors |
| `Run prettier --write to fix` | Unformatted code |
| `✖ X problems (X errors, X warnings)` | ESLint summary |
| `Some checks failed` (Biome) | Biome lint/format failure |
| `error: Unexpected ...` (Biome) | Biome parse/lint error |

**Common root causes**: Forgot to run formatter before committing, pre-commit hook not set up locally.

**Typical fixes**: Run the formatter (`bun x ultracite fix`, `prettier --write .`, `eslint --fix`), commit the changes.

## Auth / Permission Failures

| Pattern | Meaning |
|---|---|
| `403: Resource not accessible by integration` | GitHub token lacks permission |
| `401: Bad credentials` | Expired or invalid token |
| `Permission denied (publickey)` | SSH key issue |
| `Error: Input required and not supplied: token` | Missing secret |
| `secret not found` | Secret name mismatch or missing |

**Common root causes**: Workflow permissions too restrictive, secret expired or not set in repo settings, `GITHUB_TOKEN` scope insufficient.

**Typical fixes**: Add `permissions:` block to workflow, update secrets in repo settings, use a PAT for cross-repo access.

## Timeout Failures

| Pattern | Meaning |
|---|---|
| `The job running on runner ... has exceeded the maximum execution time` | Job timeout (default 6h) |
| `The operation was canceled` | Step timeout |
| No output for >10 minutes then cancellation | Stuck/hanging process |

**Common root causes**: Infinite loop, deadlock, waiting for user input in CI, test hanging on network call.

**Typical fixes**: Add `timeout-minutes` to step/job, fix the hang, mock network calls in tests, add `--ci` flag.
