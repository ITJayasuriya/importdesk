# Status

Stage: verified development foundation, not an implemented product.

Completed: repository skeleton, pinned dependencies, application setup marker, TypeScript/lint/format configuration, production build, Chromium smoke and axe check, three-browser CI configuration, contribution/security documents and implementation plans.

Local Firefox startup currently fails before page load with “Could not find profile folder.” Chromium and WebKit are the local readiness checks via `npm run test:e2e:local`; full `npm run test:e2e` includes Firefox and is required in Linux CI. Do not claim local Firefox passed.

Next: M0 discovery and first vertical slice from IMPLEMENTATION.md. No product unit tests exist yet; add meaningful domain tests with product logic.

Deferred tool integrations: unused Storybook (FormPath) and PWA tooling (RepairRelay) were removed after moderate transitive advisories. Select secure compatible versions when those milestones start.

Read SETUP-RESULT.md and OPERATIONS.md for verified setup and release prerequisites. All main-branch CI checks passed on Linux including all three browser engines. Do not create scheduled tasks: the owner will create them after readiness review.

## 25 November 2026 — day 1 in progress

Branch: codex/inventory-alpha. Discovery assumptions and synthetic acceptance fixture recorded (issues #4–6). No human validation claimed. PR #12 is an external proposal without application implementation; do not merge it as alpha completion. Next: bounded parser, worker protocol and source preview. Remaining v1: all mapping/validation/repair/export/recipe/persistence and release acceptance gates. No deployment yet. Initial baseline: 8cbc32d.

Bounded parser implemented: fatal UTF-8 decoding, explicit comma/semicolon/tab and header options, uncoerced strings, stable logical row IDs with physical line provenance, batch yields and cancellation. Eleven domain tests pass, including 100,000-row acceptance, overflow rejection, quoted-newline/BOM/empty-versus-missing preservation. This proves the parser boundary, not the full performance budget or alpha journey. Next: worker ownership and paged browser preview.

Worker integration: runtime-validated IMPORT/GET_ROWS/CANCEL messages, session/request/revision identity, 50-row page replies, no partial completion after cancel, and preservation of confirmed data after failed replacement. Added four regression tests (15 total). Next: import confirmation and preview UI. Worker and UI contain no network or persistence APIs.

Day 1 UI: explicit delimiter/header confirmation, local file and synthetic sample selection, worker progress/cancel, 50-row source pages, source-line provenance, recoverable UTF-8 errors with focus, responsive scroll-contained table and revision marker. No repairs or export claims. Local Chromium/WebKit: all 6 browser cases passed; desktop/360px screenshots inspected. Offline sample and observed no-external-request/no-storage checks passed. Unit: 15 passed; check/build passed before final documentation/revision changes (rechecking). Self-review findings resolved in docs/review-2026-11-25.md. Next delivery unit: explicit inventory destination mapping and required-field validation, then previewed repair/export alpha. Entire recipe/duplicate/date/persistence/release scope remains.

Final day-1 checks passed; 16 unit/worker cases, 6 Chromium/WebKit browser cases, production build and type/lint/format checks. Last additional guard ignores obsolete cancellation IDs (unit-covered). Linux CI and deployment pending. Main bundle after worker-boundary simplification: 71.52 KiB gzip (lab build size only). Final tested tree will be the fourth implementation commit; checkpoint reconciles its SHA after commit.
