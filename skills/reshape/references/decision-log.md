# Decision log example

Record findings, decisions, evidence, and verification results. Findings before editing:

```md
- Fix: give Dialog explicit focus ownership so closing a nested dialog returns focus correctly.
  - ui/LogoutDialog.tsx:30 uses a delay; ui/SettingsDialog.tsx:61 sets a global skipRefocus flag.
  - Evidence: the nested-dialog test shows both workarounds compensate for the same focus race.
  - Verify: run nested-dialog focus checks before and after the refactor.
- Keep: payments/client.ts:18 retries rate-limited requests.
  - Evidence: the provider requires Retry-After handling; tests cover the retry limit and exhausted error.
- Leave separate: checkout and reporting each calculate a percentage.
  - Evidence: checkout follows tax rules; reporting follows independently versioned analytics rules.
```
