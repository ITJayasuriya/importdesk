# Status

Stage: private CSV import, source preview, explicit inventory mapping and required-field checks implemented; repair/export alpha remains unfinished.

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

## Day 2 — 26 November 2026, completed

Explicit six-field inventory mapping and required-field validation are live. Positional choices retain duplicate headers; unambiguous normalized names are suggested. Missing/reused mappings block validation, confirmation is explicit, mapping edits clear stale results and extra source columns are disclosed. The worker returns complete row/issue counts, per-field totals and at most 50 examples; missing versus empty/whitespace retain distinct codes. Source identifiers, dates and original cells remain unchanged. Presence checks do not imply clean-export validity.

PR: https://github.com/ITJayasuriya/importdesk/pull/14. Reviewed final head 2eab85d206efad31d7c28463489e0fc181614388; normal SHA-bound squash merge 07cf1b07e8239876aa4ce4496b5f946506636c21. Required Linux CI passed all checks, 21 units and 15 browser cases (Chromium/Firefox/WebKit): https://github.com/ITJayasuriya/importdesk/actions/runs/45862722604. Post-merge main CI also passed: https://github.com/ITJayasuriya/importdesk/actions/runs/45863057210.

Local check, 21 unit cases, build and 10 Chromium/WebKit cases passed; affected four mapping cases rerun after label fixes. Main rebuilt successfully (72.88 kB gzip main JS, 117.87 kB raw deferred worker). One deployment: https://cd46d006.isuru-importdesk.pages.dev; live https://isuru-importdesk.pages.dev verified revision 07cf1b07e823. Live Chromium sample mapping worked offline: 5 source rows, 1 missing-label row; leading zeroes and ambiguous date preserved; no page errors, only four same-origin GET requests without bodies, no localStorage/IndexedDB writes observed. Actual desktop/360px screenshots inspected; no document overflow.

Thermo self-review in review-2026-11-26.md: pure rules stay in domain, runtime schemas in worker, bounded result data in React, native labels/controls and a dedicated mapping component. No unresolved structural blocker. Initial CI exposed pinned Firefox build1572's upstream ARIA-reflection crash (Playwright #44135). Offline restoration/in-page axe experiments failed and were removed. Native label/for and combobox role/name selectors resolved CI while preserving default axe rules, offline assertions and all engines. No dependency/workflow changes, bypass or independent approval claimed.

Daily target retained: 3. Actual: 6 meaningful commits (5352e40, 9254e79, 981e14c, 8f9c9c7, 9d3ff93, 2eab85d); diagnostic fixes exceeded the target, no padding. Squash integration is not counted twice. Labels codex/codex-automation remain unavailable; enhancement applied. Open PRs #1/#2 are unchanged major tooling updates with old green checks, deferred compatibility review; #3 remains red; #12 unchanged and lacks application implementation. None is a necessary implementation PR awaiting CI.

Next delivery day: previewed fill-missing repair plus validated clean/rejected CSV export with explicit formula-safe choices to close the M1 journey. Continue full schema rules, issue navigation, deterministic transforms, duplicate review, undo/redo, versioned recipe replay, opt-in IndexedDB/recovery and measured 100k×20 envelope. Deadline stays 5 January 2027. Human pilot evidence, VoiceOver/NVDA, forced colors/zoom and browser performance remain unverified. No full alpha/v1 completion claim and no quota failure or critical blocker.

Final operational records (RUN-STATE.json, STATUS.md, OPERATIONS.md) remain local changes for the next implementation PR; product files match tested/deployed main. Same-day recovery must reconcile evidence and skip further work/deployment unless a necessary PR needs action.

## Day 3 — 27 November 2026, in progress

Target 3 retained. Pure missing-value fill preview/application passes 23 unit tests: empty/absent distinction, bounded examples, cancellation, UTF-8 replacement limit, deterministic results and immutable source IDs/dates. Worker/UI integration next. Export is deferred until destination type/date/uniqueness validation is complete; presence alone must not label a row clean. Prior final operational notes are preserved in this branch. Open PRs #1/2/3/12 are unchanged; no necessary implementation PR is awaiting merge.
