import { expect, it } from "vitest";
import { dateIssue, validateInventory } from "./validation";
import { INVENTORY_FIELDS, suggestMapping } from "./inventory";
const headers = INVENTORY_FIELDS.map(({ id }) => id);
const mapping = suggestMapping(headers);
const source = (values: string[][]) => ({
  headers,
  rows: values.map((cells, i) => ({
    rowId: `row:${i + 1}`,
    sourceLine: i + 2,
    cells,
  })),
});
const valid = ["0001", "Chair", "equipment", "Hall", "2026-02-01", "0"];

it("validates dates without guessing formats or rolling invalid calendars", () => {
  for (const value of ["2024-02-29", "2000-02-29", "0001-01-01", "9999-12-31"])
    expect(dateIssue(value)).toBeNull();
  for (const value of [
    "1900-02-29",
    "2026-02-29",
    "0000-01-01",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
  ])
    expect(dateIssue(value)).toBe("DATE_INVALID");
  for (const value of [
    "01/02/2026",
    "2026-2-01",
    " 2026-02-01",
    "2026-02-01T00:00:00Z",
  ])
    expect(dateIssue(value)).toBe("DATE_FORMAT");
});
it("requires lexical integers without coercion or floating point precision loss", async () => {
  const quantities = [
    "0",
    "-1",
    "999999999999999999999999",
    "1.0",
    "1e3",
    "+1",
    "01",
    " 1",
    "Infinity",
  ];
  const data = source(
    quantities.map((quantity, i) => [
      String(i),
      ...valid.slice(1, 5),
      quantity,
    ]),
  );
  const original = structuredClone(data);
  const result = await validateInventory(data, mapping, () => false);
  expect(result).toMatchObject({ valid: 3, rejected: 6, issueCount: 6 });
  expect(result?.examples.every((i) => i.code === "INTEGER_FORMAT")).toBe(true);
  expect(data).toEqual(original);
});
it("rejects every duplicate member, preserves exact identifiers and counts rows once", async () => {
  const data = source([
    valid,
    ["1", ...valid.slice(1)],
    [...valid.slice(0, 4), "01/02/2026", "1.5"],
    ["0001 ", ...valid.slice(1)],
  ]);
  const original = structuredClone(data);
  const result = await validateInventory(data, mapping, () => false);
  expect(result).toMatchObject({
    total: 4,
    valid: 2,
    rejected: 2,
    issueCount: 4,
    byField: { asset_id: 2, inspection_date: 1, quantity: 1 },
  });
  expect(
    result?.examples
      .filter((i) => i.code === "DUPLICATE_ID")
      .map((i) => i.rowId),
  ).toEqual(["row:1", "row:3"]);
  expect(data).toEqual(original);
});
it("validates repaired values, bounds examples and cancels in either pass", async () => {
  const data = source(Array.from({ length: 1001 }, () => valid));
  const result = await validateInventory(data, mapping, () => false);
  expect(result).toMatchObject({ rejected: 1001, issueCount: 1001 });
  expect(result?.examples).toHaveLength(50);
  for (const stopAt of [1, 4]) {
    let yields = 0;
    expect(
      await validateInventory(data, mapping, () => ++yields === stopAt),
    ).toBeNull();
  }
  expect(
    await validateInventory(
      source([valid]),
      mapping,
      () => false,
      (row) => ({ ...row, cells: [...row.cells.slice(0, 5), "bad"] }),
    ),
  ).toMatchObject({ rejected: 1, examples: [{ code: "INTEGER_FORMAT" }] });
  await expect(
    validateInventory(data, { ...mapping, label: null }, () => false),
  ).rejects.toThrow("choose");
});
it("does not double-report missing values as type or uniqueness errors", async () => {
  const result = await validateInventory(
    source([[], []]),
    mapping,
    () => false,
  );
  expect(result).toMatchObject({ total: 2, rejected: 2, issueCount: 12 });
  expect(result?.examples.every((i) => i.code === "REQUIRED_MISSING")).toBe(
    true,
  );
});
