# Operations

Live development URL: https://isuru-importdesk.pages.dev

Build with npm run build. Deploy the checked revision using npm run deploy -- --project-name isuru-importdesk --branch main. Wrangler uses the owner-approved limited Pages OAuth sign-in in the Mac keychain. This local sign-in is not available to GitHub-hosted CI. No cloud token is committed.

Cloudflare account: 88caf19a7dd4ee5d8d2fbfeb8906f86b.

The public page now implements bounded private CSV import and paginated source preview. The repair/export alpha is not yet complete. Latest checked deployment: c65a84733c16 on 25 November 2026, https://c26bcedc.isuru-importdesk.pages.dev. The footer shows the build revision. PR #13 and post-merge main CI passed; live sample/revision/mobile layout verified. Rollback candidate is the previously checked setup build 8cbc32d (no browser storage migration exists yet). Read docs/STATUS.md before continuing.

26 November 2026: PR #14 merged as 07cf1b07e8239876aa4ce4496b5f946506636c21 after required Linux CI; main CI also passed. Main build deployed once to https://cd46d006.isuru-importdesk.pages.dev, aliased at https://isuru-importdesk.pages.dev. Live Chromium verified that revision, offline sample mapping/presence validation, unchanged IDs/date, 360px layout, zero errors and four same-origin GET requests with no payload. No persistence migration. Rollback candidate: day-1 checked c65a847. Mapping and presence checks are live; repair/export alpha remains unfinished.
