import { validateInventory } from "./validation";
import { expect, it } from "vitest";
import { fillStep, previewFill, repairedRow } from "./repair";
import { suggestMapping } from "./inventory";
import type { Source } from "./csv";
const source: Source = {
  headers: [
    "asset_id",
    "label",
    "category",
    "location",
    "inspection_date",
    "quantity",
  ],
  rows: [
    {
      rowId: "a",
      sourceLine: 2,
      cells: ["0001", "  ", "x", "Hall", "01/02/2026", "0"],
    },
    {
      rowId: "b",
      sourceLine: 3,
      cells: ["0002", "Chair", "x", "Hall", "01/02/2026", "1"],
    },
    { rowId: "c", sourceLine: 4, cells: ["0003"] },
  ],
};
const mapping = suggestMapping(source.headers);
it("previews exact empty and absent changes; applies deterministically without touching original identifiers/dates", async () => {
  const original = structuredClone(source);
  const step = fillStep(source, mapping, "label", "Spare");
  const preview = await previewFill(source, [], step, () => false);
  expect(preview).toMatchObject({
    affected: 2,
    examples: [
      { rowId: "a", before: "  ", after: "Spare" },
      { rowId: "c", before: null },
    ],
  });
  const view = (row: Source["rows"][number]) => repairedRow(row, [step]);
  expect(view(source.rows[0]!)).toMatchObject({
    rowId: "a",
    cells: ["0001", "Spare", "x", "Hall", "01/02/2026", "0"],
  });
  expect(view(source.rows[1]!)).toBe(source.rows[1]);
  expect(
    await validateInventory(source, mapping, () => false, view),
  ).toMatchObject({ total: 3, valid: 0, rejected: 3 });
  expect(await previewFill(source, [step], step, () => false)).toMatchObject({
    affected: 0,
  });
  expect(source).toEqual(original);
});
it("enforces mapping, replacement byte limits and cancellation; caps examples", async () => {
  expect(() => fillStep(source, mapping, "label", " \t")).toThrow("non-empty");
  expect(() => fillStep(source, mapping, "label", "é".repeat(32769))).toThrow(
    "64 KiB",
  );
  expect(() =>
    fillStep(source, { ...mapping, label: 0 }, "label", "x"),
  ).toThrow("more than once");
  const large = {
    ...source,
    rows: Array.from({ length: 1001 }, (_, i) => ({
      rowId: `row:${i}`,
      sourceLine: i + 2,
      cells: [],
    })),
  };
  expect(
    await previewFill(large, [], { column: 1, value: "x" }, () => false),
  ).toMatchObject({ affected: 1001, examples: expect.any(Array) });
  expect(
    (await previewFill(large, [], { column: 1, value: "x" }, () => false))
      ?.examples,
  ).toHaveLength(50);
  expect(
    await previewFill(large, [], { column: 1, value: "x" }, () => true),
  ).toBeNull();
});

it("filling a later absent field preserves absence of intermediate columns", () => {
  const row = source.rows[2]!;
  const current = repairedRow(row, [{ column: 5, value: "0" }]);
  expect(current.cells[1]).toBeUndefined();
  expect(current.cells[4]).toBeUndefined();
  expect(current.cells[5]).toBe("0");
  expect(row.cells).toEqual(["0003"]);
});
