import { validateInventory } from "./validation";
import { expect, it } from "vitest";
import {
  mappingProblems,
  requiredIssues,
  suggestMapping,
  INVENTORY_FIELDS,
} from "./inventory";
const headers = INVENTORY_FIELDS.map(({ id }) => id);
const mapping = suggestMapping(headers);
it("suggests only unambiguous normalized headers, including reordered and duplicate headers", () => {
  expect(
    suggestMapping([" Quantity ", "asset-id", "Asset ID"]).asset_id,
  ).toBeNull();
  expect(suggestMapping([" Quantity "]).quantity).toBe(0);
  expect(suggestMapping(["Column 1"]).asset_id).toBeNull();
  expect(mappingProblems({ ...mapping, label: 0 }, headers).join()).toContain(
    "more than once",
  );
  expect(mappingProblems({ ...mapping, label: 10 }, headers).join()).toContain(
    "unavailable",
  );
  expect(
    mappingProblems({ ...mapping, label: null }, headers).join(),
  ).toContain("choose");
});
it("distinguishes missing and whitespace-only cells without altering source or coercing values", async () => {
  const rows = [
    {
      rowId: "row:1",
      sourceLine: 2,
      cells: ["000123", " Chair ", "equipment", "Hall", "2026-02-01", "0"],
    },
    {
      rowId: "row:2",
      sourceLine: 3,
      cells: ["000124", " \t", "equipment", "Hall"],
    },
  ];
  const original = structuredClone(rows);
  expect(requiredIssues(rows[1]!, mapping).map((issue) => issue.code)).toEqual([
    "REQUIRED_EMPTY",
    "REQUIRED_MISSING",
    "REQUIRED_MISSING",
  ]);
  expect(
    await validateInventory({ headers, rows }, mapping, () => false),
  ).toMatchObject({
    total: 2,
    valid: 1,
    rejected: 1,
    issueCount: 3,
    byField: { label: 1, quantity: 1 },
  });
  expect(rows).toEqual(original);
});
it("bounds examples while counting every issue and supports cancellation", async () => {
  const source = {
    headers,
    rows: Array.from({ length: 1001 }, (_, i) => ({
      rowId: `row:${i}`,
      sourceLine: i + 2,
      cells: [],
    })),
  };
  const result = await validateInventory(source, mapping, () => false);
  expect(result).toMatchObject({
    total: 1001,
    rejected: 1001,
    valid: 0,
    issueCount: 6006,
  });
  expect(result?.examples).toHaveLength(50);
  expect(await validateInventory(source, mapping, () => true)).toBeNull();
  await expect(
    validateInventory(source, { ...mapping, label: null }, () => false),
  ).rejects.toThrow("choose");
});
