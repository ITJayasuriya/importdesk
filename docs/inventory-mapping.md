# Inventory mapping and validation

Implemented contract, 28 November 2026. Inventory rules cover presence, strict dates, lexical integers and exact unique Asset IDs. This is not a clean-export guarantee. Date conversion, duplicate resolution, export and configurable schema import remain unfinished.

## Try it

1. Import the synthetic inventory with comma delimiter and a header row.
2. In **Map to inventory**, inspect all six suggestions. Choose columns by position; duplicated names display their column number. Header matching ignores case and surrounding whitespace and treats spaces/hyphens as underscores. Ambiguous matches are left unselected.
3. Each destination requires a different source column. Resolve all missing/reused columns, then confirm the mappings. Additional source columns are disclosed and retained in the original preview.
4. Choose **Check inventory values**. The five-row fixture has one passing row and four needing attention: duplicate Asset IDs on physical lines 2 and 6, an ambiguous date on line 3, and an empty label on line 5. The formula-like label stays text; export safety is still pending.
5. Change any mapping: confirmation and the previous result clear. Recheck after confirming the new choices. A failed replacement import keeps the confirmed source and its mapping readable.

## Contract for contributors

The fixed inventory v1 fields are `asset_id`, `label`, `category`, `location`, `inspection_date`, `quantity`, all required. Mapping stores zero-based source indices, never header-object keys. Missing selections are `null`. Column indices must be integers in the source-header range; the runtime request schema further bounds them to 0–49.

`REQUIRED_MISSING` means the mapped index is absent in that row. `REQUIRED_EMPTY` means the source value is empty or whitespace-only under JavaScript `trim()`. Values are inspected without mutation or type coercion; `0`, `000123` and `01/02/2026` all remain strings. Missing and empty retain different reason codes.

The worker receives `VALIDATE_INVENTORY` with session/request/revision identity and a mapping. It rejects mappings before scanning, counts IDs then checks rules in two passes, yielding every 500 rows in each pass and checking cancellation. New imports/validation supersede older processing; obsolete jobs cannot publish a result. No mutation revision is created because source data remains unchanged. React rejects replies for obsolete request/session/revision identities.

Results contain total rows, rows passing inventory rules, rows failing inventory rules, issue count, per-field counts and at most 50 examples with stable row ID and physical source line. A row with multiple issues counts once as rejected. `valid + rejected = total`; examples are deliberately incomplete when issues exceed 50. The original dataset remains solely in worker memory. No storage or network interface was added.

## Verification boundaries

Unit coverage includes ambiguous/reordered headers, positional mapping errors, missing versus whitespace-only values, unchanged identifiers/date strings, complete counts beyond 50 examples, cooperative cancellation, replaced validation and stale revision rejection. Browser coverage exercises mapping confirmation, edit invalidation, duplicate headers, extra-column disclosure, offline validation and original-source preservation. See [testing](testing.md) and [review](review-2026-11-26.md).

## Type and uniqueness rules

- `DATE_FORMAT`: inspection date is not exactly `YYYY-MM-DD`. No source format is guessed; `01/02/2026` stays unchanged and unresolved.
- `DATE_INVALID`: the format matches but is not a Gregorian calendar date in years 0001–9999. Leap-century rules apply without timezone conversion or calendar rollover.
- `INTEGER_FORMAT`: quantity does not match `-?(0|[1-9][0-9]*)`. No spaces, plus sign, leading zeroes, exponent or decimal point. Negative quantities are allowed by this schema; no floating-point conversion or precision loss occurs. Asset IDs remain independent string values.
- `DUPLICATE_ID`: every row sharing the exact current Asset ID is flagged, including the first. `0001`, `1` and `0001 ` are distinct strings. No row is deleted. Empty/missing IDs receive only presence issues.

Category/location accept any non-empty string; this inventory schema declares no enum vocabulary. Validation runs on repaired views as well as originals, so filling an empty Asset ID can introduce duplicate issues for another row. Unit and browser regressions cover these rules; see [28 November review](review-2026-11-28.md).
