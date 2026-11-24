# HomeSpace Admin Portal — Codex Instructions

## Scope

Administration frontend.

Inspect package.json and existing project conventions.

## Development

- Preserve existing UI architecture.
- Reuse established components and services.
- Respect admin role and permission boundaries.
- Preserve existing API contracts.
- Validate user input.
- Avoid unrelated refactoring.
- Do not introduce unnecessary dependencies.

## Security

- Never expose admin credentials.
- Never bypass permission checks.
- Never execute destructive administrative actions without authorization.

## Git and verification

- Use `git status --short` once at the start if needed to protect existing edits and once at the end only if needed for reporting. Review the edit or use one path-scoped `git diff -- <paths>` when needed. Reuse that evidence while the files are unchanged. Use `git diff --stat` only when a scope summary is needed and `git diff --check` at most once after the final edit when useful. Reinspect affected paths only for new edits, conflicts or a concrete risk. Protect user changes. Commit, push, reset, clean, checkout or discard only when requested.
- **Start with the remaining risk.** For prose, comments, or cosmetic changes with no behavior impact, inspect the affected change and skip application builds and tests unless required. For routine behavior changes, validate once after editing with the smallest relevant test or static check. Add another check only when it covers a distinct risk. Run full builds or suites only when requested, required, or focused checks cannot cover a concrete risk.
- Reuse relevant passing results for unchanged inputs, including results supplied by the user or CI. Acknowledge their source in the report. After a failure, diagnose the cause and rerun only the affected check after correcting it. Let a running check finish before considering a retry. Report blocked checks and unverified risks. Preserve required security, business invariant and integration checks.
- Inspect available project scripts first. Expand checks for authentication, permissions and destructive actions.

## Skills

Use frontend-review when explicit frontend review is requested.

## Completion

Report changes, verification and security-sensitive limitations.
