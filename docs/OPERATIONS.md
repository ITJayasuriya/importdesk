# Operations

Live development URL: https://isuru-importdesk.pages.dev

Build with npm run build. Deploy the checked revision using npm run deploy -- --project-name isuru-importdesk --branch main. Wrangler uses the owner-approved limited Pages OAuth sign-in in the Mac keychain. This local sign-in is not available to GitHub-hosted CI. No cloud token is committed.

Cloudflare account: 88caf19a7dd4ee5d8d2fbfeb8906f86b.

The public page now implements bounded private CSV import and paginated source preview. The repair/export alpha is not yet complete. Latest checked deployment: c65a84733c16 on 25 November 2026, https://c26bcedc.isuru-importdesk.pages.dev. The footer shows the build revision. PR #13 and post-merge main CI passed; live sample/revision/mobile layout verified. Rollback candidate is the previously checked setup build 8cbc32d (no browser storage migration exists yet). Read docs/STATUS.md before continuing.
