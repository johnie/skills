#!/usr/bin/env bash
# Classify a GitHub Actions log by failure category.
# Usage: classify-log.sh [logfile]   (reads stdin when no file is given)
#
# Greps the log against one signature regex per category, in upstream-first
# priority order, and prints hit counts plus the first 5 matching lines for
# every category that matched. The final line is `primary: <category>` — the
# highest-priority category with hits (or `none`). Always exits 0.
set -euo pipefail

if [[ $# -ge 1 && "$1" != "-" ]]; then
  log="$1"
else
  log=$(mktemp)
  trap 'rm -f "$log"' EXIT
  cat > "$log"
fi

# Priority order: auth > deps > build > infra > lint > test > timeout.
categories=(auth deps build infra lint test timeout)

pattern_for() {
  case "$1" in
    auth)    echo '\b(403|401)\b|Resource not accessible by integration|Bad credentials|Permission denied \(publickey\)|Input required and not supplied: token|secret not found|pull access denied' ;;
    deps)    echo 'ERESOLVE|ETARGET|EINTEGRITY|404 Not Found - GET https?://|No matching (version|distribution) found|Could not find a version that satisfies|Failed building wheel|manifest unknown|toomanyrequests|ECONNREFUSED' ;;
    build)   echo 'error TS[0-9]+:|Build failed|Rollup failed to resolve|Module not found: Error: Can'"'"'t resolve|tsc exited with code|cannot find package|^[^ ]+:[0-9]+:[0-9]+: undefined:|COPY failed:|returned a non-zero code|no matching manifest for' ;;
    infra)   echo '\bKilled\b|exit code 137|No space left on device|ENOSPC|heap out of memory|CALL_AND_RETRY_LAST|MemoryError|runner has received a shutdown signal|Job was cancelled|This request was automatically failed|hosted runner encountered an error' ;;
    lint)    echo '[0-9]+ errors? found|found [0-9]+ errors?|Run prettier --write|✖ [0-9]+ problems?|Some checks failed|eslint|biome|prettier' ;;
    test)    echo '^FAIL |Test Suites: [0-9]+ failed|AssertionError|--- FAIL:|FAILED test_|test .* FAILED|snapshots? failed|thread .* panicked|panic: runtime error|race detected|Expected:|Received:' ;;
    timeout) echo 'exceeded the maximum execution time|The operation was canceled|Timed out in waitFor|timed out after' ;;
  esac
}

tab=$'\t'
primary=none
for cat in "${categories[@]}"; do
  regex=$(pattern_for "$cat")
  # Strip the "job-name<TAB>step-name<TAB>timestamp " prefix gh adds so line
  # anchors (^FAIL) hit the actual log text; line numbers stay original.
  hits=$(sed -E "s/^[^$tab]*$tab[^$tab]*$tab[0-9TZ:.-]+ ?//" "$log" | grep -nE "$regex" || true)
  [[ -z "$hits" ]] && continue
  count=$(printf '%s\n' "$hits" | wc -l | tr -d ' ')
  printf '== %s (%s hits)\n' "$cat" "$count"
  printf '%s\n' "$hits" | awk -F: 'NR<=5 { n=$1; sub(/^[0-9]+:/, ""); printf "  %6d: %s\n", n, substr($0, 1, 200) }'
  [[ "$primary" == none ]] && primary="$cat"
done

echo "primary: $primary"
