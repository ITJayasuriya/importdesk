import type { Source, SourceRow } from "./csv";

export const INVENTORY_FIELDS = [
  {
    id: "asset_id",
    label: "Asset ID",
    requirement: "Required string · leading zeroes preserved",
  },
  { id: "label", label: "Label", requirement: "Required string" },
  { id: "category", label: "Category", requirement: "Required string" },
  { id: "location", label: "Location", requirement: "Required string" },
  {
    id: "inspection_date",
    label: "Inspection date",
    requirement: "Required date · format validation coming next",
  },
  {
    id: "quantity",
    label: "Quantity",
    requirement: "Required integer · type validation coming next",
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
export type RequiredResult = {
  total: number;
  valid: number;
  rejected: number;
  issueCount: number;
  byField: Record<InventoryField, number>;
  examples: RequiredIssue[];
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

// Return bounded examples, never a second full row/issue dataset to the UI.
export async function validateRequired(
  source: Source,
  mapping: Mapping,
  cancelled: () => boolean,
): Promise<RequiredResult | null> {
  const problems = mappingProblems(mapping, source.headers);
  if (problems.length) throw new Error(problems.join(" "));
  const result: RequiredResult = {
    total: source.rows.length,
    valid: 0,
    rejected: 0,
    issueCount: 0,
    byField: {
      asset_id: 0,
      label: 0,
      category: 0,
      location: 0,
      inspection_date: 0,
      quantity: 0,
    },
    examples: [],
  };
  for (let index = 0; index < source.rows.length; index++) {
    if (index % 500 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (cancelled()) return null;
    }
    const issues = requiredIssues(source.rows[index]!, mapping);
    if (issues.length) result.rejected++;
    else result.valid++;
    result.issueCount += issues.length;
    for (const issue of issues) {
      result.byField[issue.field]++;
      if (result.examples.length < 50) result.examples.push(issue);
    }
  }
  return result;
}
