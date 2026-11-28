import type { SourceRow } from "./csv";

export const INVENTORY_FIELDS = [
  {
    id: "asset_id",
    label: "Asset ID",
    requirement:
      "Required unique string · exact match; leading zeroes preserved",
  },
  { id: "label", label: "Label", requirement: "Required string" },
  { id: "category", label: "Category", requirement: "Required string" },
  { id: "location", label: "Location", requirement: "Required string" },
  {
    id: "inspection_date",
    label: "Inspection date",
    requirement: "Required date · YYYY-MM-DD; no format guessing",
  },
  {
    id: "quantity",
    label: "Quantity",
    requirement: "Required integer · e.g. 0, 12 or -1; no spaces or decimals",
  },
] as const;
export type InventoryField = (typeof INVENTORY_FIELDS)[number]["id"];
export type Mapping = Record<InventoryField, number | null>;
const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, "_");

export function suggestMapping(headers: string[]): Mapping {
  return Object.fromEntries(
    INVENTORY_FIELDS.map(({ id }) => {
      const matches = headers.flatMap((header, index) =>
        normalize(header) === id ? [index] : [],
      );
      return [id, matches.length === 1 ? matches[0] : null];
    }),
  ) as Mapping;
}
export function mappingProblems(mapping: Mapping, headers: string[]): string[] {
  return INVENTORY_FIELDS.flatMap(({ id, label }) => {
    const index = mapping[id];
    if (index === null) return [`${label}: choose a source column.`];
    if (!Number.isInteger(index) || index < 0 || index >= headers.length)
      return [`${label}: source column is unavailable.`];
    if (Object.values(mapping).filter((value) => value === index).length > 1)
      return [`${label}: source column is mapped more than once.`];
    return [];
  });
}
export type RequiredIssue = {
  rowId: string;
  sourceLine: number;
  field: InventoryField;
  code: "REQUIRED_EMPTY" | "REQUIRED_MISSING";
  rawValue: string | null;
};
export function requiredIssues(
  row: SourceRow,
  mapping: Mapping,
): RequiredIssue[] {
  return INVENTORY_FIELDS.flatMap(({ id }) => {
    const index = mapping[id];
    const value = index === null ? undefined : row.cells[index];
    return value === undefined || value.trim() === ""
      ? [
          {
            rowId: row.rowId,
            sourceLine: row.sourceLine,
            field: id,
            code:
              value === undefined
                ? ("REQUIRED_MISSING" as const)
                : ("REQUIRED_EMPTY" as const),
            rawValue: value ?? null,
          },
        ]
      : [];
  });
}
