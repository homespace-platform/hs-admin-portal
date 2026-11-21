# HomeSpace Admin Portal — Codex Instructions

<!-- BEGIN: HomeSpace engineering standards -->
## HomeSpace engineering standards

- Preserve business invariants, public contracts and backward compatibility. Keep authentication, authorization, input validation and error handling intact.
- Protect secrets and sensitive data in code, commits, tests, logs and reports. Treat third-party hooks as untrusted until reviewed and explicitly authorized.
- Change production configuration, deploy or run destructive data operations only when explicitly authorized for the target environment.
- Keep review tasks read-only unless the developer requests fixes.
- Run targeted verification first. Broaden coverage when the risk or affected interfaces warrant it. Report checks that ran and any unverified behavior.
<!-- END: HomeSpace engineering standards -->

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
