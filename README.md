# ImportDesk

[![CI](https://github.com/ITJayasuriya/importdesk/actions/workflows/ci.yml/badge.svg)](https://github.com/ITJayasuriya/importdesk/actions/workflows/ci.yml)

A browser-only CSV inspection and repair workbench in development. The first implemented slice imports UTF-8 CSV into a worker and previews original values in 50-row pages. Mapping, repairs, export, recipes and opt-in saved sessions are still being built; this is not yet the complete repair alpha.

## Try the source preview

1. Choose **Try inventory sample** (synthetic data) or select a local UTF-8 CSV.
2. Select comma, semicolon or tab and whether the first row is a header. Confirm both settings, then choose **Import source preview**.
3. Inspect raw values and source line numbers. Leading zeroes, whitespace, quoted newlines, duplicate IDs and ambiguous dates stay unchanged. Use Previous/Next page for longer files.
4. An import error accepts no partial source; correct the input/settings and retry. Cancel stops the active import. Refresh discards the memory-only session.

File content stays in the browser. No accounts, upload endpoint, analytics or automatic persistence. Current rejection limits: 20 MiB, 100,000 data rows, 50 columns and 64 KiB UTF-8 per cell. The 100k parser boundary is unit-tested; browser performance at 100k×20 has not yet been measured.

The [inventory acceptance contract](docs/research/2026-11-25-workflow.md) explains the deliberate exceptions and the eventual repair/replay journey. No pilot observations or success metrics are claimed.

## Local development

Use Node 24.21.0.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e:local # Chromium and WebKit on this Mac; CI runs all three browsers
```

Read [implementation plan](docs/IMPLEMENTATION.md), [engineering standards](docs/ENGINEERING.md) and [current status](docs/STATUS.md).

## Contributions

See [CONTRIBUTING.md](CONTRIBUTING.md). Report defects with synthetic data only.

[Live development demo](https://isuru-importdesk.pages.dev) · [Delivery board](https://github.com/users/ITJayasuriya/projects/2) · [Setup results](docs/SETUP-RESULT.md)
