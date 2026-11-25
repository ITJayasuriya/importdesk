# ADR 1 — worker-owned source rows

Accepted 25 November 2026. Use the installed Papa Parse parser with string coercion disabled. Decode UTF-8 with a fatal decoder, bounded to 20 MiB. Retain source cell arrays, including absent versus empty fields, and identify rows by logical record ordinal. Duplicate headers are retained as positions, never object keys. Explicit import options precede parsing.

Cooperate between batches of 500 records. In-progress rows are private until completion. A new import terminates the prior worker; typed message identity protects the consumer from stale replies. Only a 50-row page crosses into React. Cancellation of a job never replaces a prior confirmed session with partial data.

The initial envelope is a rejection boundary, not performance evidence: 100,000 data rows, 50 columns, 64 KiB UTF-8 per cell, 20 MiB file. Benchmarking and all v1 mutation commands remain later work. No persistence or network transport is introduced.
