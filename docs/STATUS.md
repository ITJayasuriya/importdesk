# Status

Stage: private CSV import and original-source preview implemented; mapping/repair/export alpha remains unfinished.

## Current implementation — 25 November 2026 (day 1)

- Synthetic five-row inventory acceptance fixture and local-worker ADR; human workflow hypotheses and interview guide recorded without fabricated discovery evidence. Issues #4–7 remain open.
- Bounded UTF-8 parsing with explicit delimiter/header confirmation, preserved strings, quoted newlines/BOM, physical source lines, stable logical row IDs, cancellation and strict file/row/column/cell rejection limits.
- Runtime-validated worker requests; session/request/revision guards, obsolete cancellation/reply rejection, atomic confirmed-source replacement and 50-row pages. No full dataset in React, upload transport or persistence writes.
- Native labeled file/sample controls, paginated semantic table, responsive scroll-contained preview, error focus/retry, offline sample and build revision marker.

## Verification and review

PR: https://github.com/ITJayasuriya/importdesk/pull/13. Implementation revision: 93b732659b2d0b4ddc19aca6028b2b3833bf0eab. Subsequent documentation-only commit does not change product behavior.

Local: `npm run check`, `npm test` (16 domain/worker cases), `npm run build` passed. `npm run test:e2e:local` passed all 6 Chromium/WebKit cases; the final obsolete-cancel guard is unit-covered and Linux CI reruns the full tree. Actual desktop/360px screenshots inspected. Keyboard activation, error focus, offline sample, no external requests in the observed sample journey, no localStorage/IndexedDB writes and axe checks passed. See testing.md and review-2026-11-25.md for scope/limitations.

Self-review resolved request Blob leakage into replies, client-side runtime schema bundling, repeated table-width calculation, stale cancellation, error-focus timing, mobile fieldset overflow and lazy dependency reload. No independent reviewer claimed. Main bundle: 71.52 KiB gzip before final guard (lab build size, not field performance). 100,000-row parser test is not 100k×20 browser performance evidence.

Linux required CI pending. Existing live setup marker verified before deployment. No new deployment claimed yet. Neither `codex` nor `codex-automation` label exists in this repository; PR uses existing enhancement label. External PR #12 was inspected read-only and left untouched because it contains no application implementation.

## Next action and remaining scope

Pass required CI, merge PR #13 normally, build checked main and deploy once to https://isuru-importdesk.pages.dev; verify live sample and revision. Then implement explicit inventory destination-schema mapping, required-field validation and previewed repair/export to complete M1 within days 1–7.

V1 still requires configurable constrained schemas, all validation rules and issue navigation, deterministic trim/enum/date/missing-value/manual transforms, duplicate review, undo/redo, versioned recipe import/replay, opt-in IndexedDB sessions and quota/corruption recovery, validated clean/rejected exports and formula-safe choices. Finish full browser, cancellation, round-trip/data-count tests; measured 100k×20 performance; manual accessibility/cross-browser reviews; clean-checkout contributor verification; human feedback disclosure and release gates by 5 January 2027.

Local Firefox has the documented pre-page startup failure; Linux CI must run all three engines. VoiceOver/NVDA and full browser performance budgets remain unverified. Missing pilot evidence is not a blocker to independent implementation and is not a passed discovery gate. See SETUP-RESULT.md and OPERATIONS.md for existing deployment prerequisites.
