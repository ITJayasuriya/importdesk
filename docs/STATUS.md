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

Required PR CI passed (16 unit tests, 9 browser cases across Chromium/Firefox/WebKit): https://github.com/ITJayasuriya/importdesk/actions/runs/45606032393. PR #13 squash-merged as c65a84733c16d2563b685539d9531a09a70ad633; post-merge main CI also passed: https://github.com/ITJayasuriya/importdesk/actions/runs/45606449955. Built main and deployed once to https://isuru-importdesk.pages.dev (immutable deployment https://c26bcedc.isuru-importdesk.pages.dev). Live Chromium sample verified 5 rows, preserved IDs/date, revision c65a84733c16, 360px layout, zero page errors, 4 same-origin GET requests and no payload-bearing requests. Live mobile screenshot inspected. Neither `codex` nor `codex-automation` label exists in this repository; PR uses existing enhancement label. External PR #12 was inspected read-only and left untouched because it contains no application implementation.

## Next action and remaining scope

Day 1 completed; same-day recovery should skip after revision/checkpoint reconciliation. Next implement explicit inventory destination-schema mapping, required-field validation and previewed repair/export to complete M1 within days 1–7.

V1 still requires configurable constrained schemas, all validation rules and issue navigation, deterministic trim/enum/date/missing-value/manual transforms, duplicate review, undo/redo, versioned recipe import/replay, opt-in IndexedDB sessions and quota/corruption recovery, validated clean/rejected exports and formula-safe choices. Finish full browser, cancellation, round-trip/data-count tests; measured 100k×20 performance; manual accessibility/cross-browser reviews; clean-checkout contributor verification; human feedback disclosure and release gates by 5 January 2027.

Local Firefox has the documented pre-page startup failure; Linux CI must run all three engines. VoiceOver/NVDA and full browser performance budgets remain unverified. Missing pilot evidence is not a blocker to independent implementation and is not a passed discovery gate. See SETUP-RESULT.md and OPERATIONS.md for existing deployment prerequisites.

Daily target: 4; actual coherent implementation/documentation commits: 5 (d21c91c, 2ac1ede, e47ff78, 93b7326, b8593e2), integrated by squash c65a847. Final operational/checkpoint records are intentionally left as local documentation changes for the next implementation PR; product files match tested main. No critical blocker; no quota failure.

## Day 2 — 26 November 2026, in progress

Daily target selected once: 3. Pure inventory mapping/presence validation and worker request boundary implemented; 21 unit tests pass, including required-value counts, bounded examples, stale validation cancellation/replacement and immutable source values. Type checking passes after UI reply handling integration; full check pending formatting of checkpoint. Next: finish mapping UI and browser journeys, then self-review and required CI. PR triage: #1–3 are unchanged major tooling upgrades, deferred compatibility review; #12 unchanged and lacks implementation. No necessary implementation PR awaits CI. Original day-1 operational records preserved.
