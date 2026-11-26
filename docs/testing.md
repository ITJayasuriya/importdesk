# Verification

Run `npm ci`, `npm run check`, `npm test`, `npm run build`. Install browsers with `npx playwright install`. On this Mac run `npm run test:e2e:local` (Chromium/WebKit); Linux CI runs `npm run test:e2e` including Firefox. Local Firefox's known startup failure is not a product pass.

The 21 domain/worker tests cover string preservation, BOM, physical lines versus logical row IDs, empty/missing values, malformed CSV, fatal UTF-8, every input limit, 100k-row acceptance, cooperative cancellation, stale reply identity, page isolation and failed replacement recovery. The 100k unit case is not a browser performance benchmark.

Browser tests cover explicit settings confirmation, keyboard activation, sample values, 50-row pagination, failure focus/recovery, offline sample import, no external requests in the observed sample journey, no localStorage/IndexedDB writes, axe on desktop/mobile and mobile document overflow. Screenshots are generated under ignored `test-results/`. On macOS WebKit, Option-Tab includes buttons in native keyboard navigation. This is accounted for in the test without changing application tab order.

Not yet verified: VoiceOver/NVDA, zoom/forced colors, browser 100k×20 timing/long tasks/cancellation latency, future repair/export/persistence/replay journeys. No field performance or pilot success claims.

Day 2 mapping tests add positional ambiguity, invalid/reused mapping rejection, missing/whitespace rule codes, complete row/issue counts with bounded examples, unchanged source values and cancelled/replaced validation. Local browser suite now has 10 cases across Chromium/WebKit. Mapping checks also run offline, clear results on edits and retain identifiers/dates. Required Linux CI includes all three engines. See inventory-mapping.md and review-2026-11-26.md.
