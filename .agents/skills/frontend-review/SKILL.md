---
name: frontend-review
description: Review HomeSpace Admin Portal frontend changes for correctness, role permissions, API compatibility, usability and regressions. Use when an explicit admin frontend review is requested.
---

# Admin Frontend Review

## Mode

Review-only.

## Checklist

- UI behavior
- Role-based permissions
- Administrative action safety
- API contracts
- Validation
- Error handling
- Loading states
- Accessibility
- Regression risks

## Verification

Prefer static inspection and existing targeted tests.

Do not automatically run full builds or unrelated test suites.

Do not modify production data.

## Output

Report actionable findings with severity, file location and recommended correction.
