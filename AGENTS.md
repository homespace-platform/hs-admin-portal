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

## Verification

- Prefer targeted tests and lint.
- Inspect available project scripts first.
- Do not run every test or a full build for a minor UI change.
- Expand checks for authentication, permissions and destructive actions.

## Skills

Use frontend-review when explicit frontend review is requested.

## Completion

Report changes, verification and security-sensitive limitations.
