# Inventory mapping and required values

Implemented alpha contract, 26 November 2026. This is a presence check, not a clean-export guarantee. Full date/integer/enum/unique rules, repairs, export and configurable schema import follow in the remaining milestones.

## Try it

1. Import the synthetic inventory with comma delimiter and a header row.
2. In **Map to inventory**, inspect all six suggestions. Choose columns by position; duplicated names display their column number. Header matching ignores case and surrounding whitespace and treats spaces/hyphens as underscores. Ambiguous matches are left unselected.
3. Each destination requires a different source column. Resolve all missing/reused columns, then confirm the mappings. Additional source columns are disclosed and retained in the original preview.
4. Choose **Check required fields**. The five-row fixture has four rows with all required values and one with an empty label, on physical source line 5. The duplicate ID, formula trigger and ambiguous date remain unchanged and are not covered by this check.
5. Change any mapping: confirmation and the previous result clear. Recheck after confirming the new choices. A failed replacement import keeps the confirmed source and its mapping readable.

## Contract for contributors

The fixed inventory v1 fields are `asset_id`, `label`, `category`, `location`, `inspection_date`, `quantity`, all required. Mapping stores zero-based source indices, never header-object keys. Missing selections are `null`. Column indices must be integers in the source-header range; the runtime request schema further bounds them to 0–49.

`REQUIRED_MISSING` means the mapped index is absent in that row. `REQUIRED_EMPTY` means the source value is empty or whitespace-only under JavaScript `trim()`. Values are inspected without mutation or type coercion; `0`, `000123` and `01/02/2026` all remain strings. Missing and empty retain different reason codes.

The worker receives `VALIDATE_REQUIRED` with session/request/revision identity and a mapping. It rejects mappings before scanning, yields every 500 rows and checks cancellation. New imports/validation supersede older processing; obsolete jobs cannot publish a result. No mutation revision is created because source data remains unchanged. React rejects replies for obsolete request/session/revision identities.

Results contain total rows, rows passing presence, rows failing presence, issue count, per-field counts and at most 50 examples with stable row ID and physical source line. A row with multiple missing fields counts once as rejected. `valid + rejected = total`; examples are deliberately incomplete when issues exceed 50. The original dataset remains solely in worker memory. No storage or network interface was added.

## Verification boundaries

Unit coverage includes ambiguous/reordered headers, positional mapping errors, missing versus whitespace-only values, unchanged identifiers/date strings, complete counts beyond 50 examples, cooperative cancellation, replaced validation and stale revision rejection. Browser coverage exercises mapping confirmation, edit invalidation, duplicate headers, extra-column disclosure, offline validation and original-source preservation. See [testing](testing.md) and [review](review-2026-11-26.md).
