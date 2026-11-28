# Missing-value repair contract

This slice fills one mapped column after an explicit before/after preview. It is not yet the complete repair/export alpha.

## Try the sample

1. Import the synthetic inventory and confirm its six destination mappings.
2. Choose **Check inventory values**: five source rows, one passing and four needing attention (two duplicate-ID rows, one ambiguous date and one empty label).
3. In **Fill missing values**, leave **Destination field** as Label and enter `Spare stool`.
4. Choose **Preview replacement**. Inspect source line 5: `(empty)` → `Spare stool`; one affected cell. Editing either parameter removes the preview and requires a new preview.
5. Choose **Apply 1 replacements**. Focus moves to the repair heading. Inventory results now show two passing rows and three needing attention: the two duplicate-ID rows and ambiguous date. The source preview still contains the original empty label.
6. Preview the same replacement again: zero affected cells; Apply is disabled. Refresh clears the session and all repairs.

The sample's duplicate ID, ambiguous date and formula-like label remain unresolved. The validation result is not a spreadsheet-safety guarantee. Explicit date conversion, duplicate resolution and safe export remain follow-up work.

## Data and concurrency

- A fill targets a confirmed source-column position. It affects only absent, empty or JavaScript `trim()` whitespace-only current values. Replacement text is preserved literally, including surrounding whitespace; an all-whitespace replacement is rejected.
- Original arrays, stable row IDs and physical source lines never change. Short records retain absent intermediate columns. Each current row is derived by ordered fill steps; no second complete dataset is stored or sent to React.
- The worker checks mapping and a 64 KiB UTF-8 replacement limit. This alpha caps in-memory steps at 100. UI only receives counts and at most 50 exact examples.
- `PREVIEW_FILL` returns a request-bound preview. `COMMIT_FILL` consumes that preview ID once at the same session/revision. Any intervening worker command invalidates it. Stale revisions, zero-change previews and unmatched preview IDs cannot commit.
- Apply recomputes all inventory rule counts against candidate steps, yielding every 500 rows. Cancellation or replacement before completion cannot publish a mutation. Only successful completion installs the steps and increments the source revision together.
- `GET_ROWS` always returns original rows. Inventory validation includes applied steps, including global unique-ID checks. Mapping edits clear UI results and require confirmation/revalidation; prior fills remain attached to their original source positions.
- Undo/redo, public versioned recipes, manual edits, configurable schemas, export and persistence are unfinished. Internal `FillStep` is not a recipe interchange format.

## Verification

`src/domain/repair.test.ts` covers deterministic previews, unchanged originals and identifiers/dates, absent intermediate fields, UTF-8 limits, invalid mapping, cancellation and bounded examples. `src/worker/handler.test.ts` covers preview-required application, revision changes, repeated commits, immutable source pages and cancelled preview/commit jobs. `tests/repair.spec.ts` exercises the offline keyboard journey, parameter invalidation, post-apply focus, unchanged originals, zero-change handling, axe, console errors and desktop/360px screenshots. Linux CI must pass all three browser engines before merge. No measured 100k×20 performance or assistive-technology pass is claimed.
