# Status

Stage: verified development foundation, not an implemented product.

Completed: repository skeleton, pinned dependencies, application setup marker, TypeScript/lint/format configuration, production build, Chromium smoke and axe check, three-browser CI configuration, contribution/security documents and implementation plans.

Local Firefox startup currently fails before page load with “Could not find profile folder.” Chromium and WebKit are the local readiness checks via `npm run test:e2e:local`; full `npm run test:e2e` includes Firefox and is required in Linux CI. Do not claim local Firefox passed.

Next: M0 discovery and first vertical slice from IMPLEMENTATION.md. No product unit tests exist yet; add meaningful domain tests with product logic.

Deferred tool integrations: unused Storybook (FormPath) and PWA tooling (RepairRelay) were removed after moderate transitive advisories. Select secure compatible versions when those milestones start.

Read SETUP-RESULT.md and OPERATIONS.md for verified setup and release prerequisites. All main-branch CI checks passed on Linux including all three browser engines. Do not create scheduled tasks: the owner will create them after readiness review.

## 25 November 2026 — day 1 in progress

Branch: codex/inventory-alpha. Discovery assumptions and synthetic acceptance fixture recorded (issues #4–6). No human validation claimed. PR #12 is an external proposal without application implementation; do not merge it as alpha completion. Next: bounded parser, worker protocol and source preview. Remaining v1: all mapping/validation/repair/export/recipe/persistence and release acceptance gates. No deployment yet. Initial baseline: 8cbc32d.
