import type { Source, SourceRow } from "./csv";
import {
  mappingProblems,
  requiredIssues,
  type Mapping,
  type RequiredIssue,
  type RequiredResult,
} from "./inventory";

export type InventoryIssue = Omit<RequiredIssue, "code"> & {
  code:
    | RequiredIssue["code"]
    | "DATE_FORMAT"
    | "DATE_INVALID"
    | "INTEGER_FORMAT"
    | "DUPLICATE_ID";
};
export type InventoryResult = Omit<RequiredResult, "examples"> & {
  examples: InventoryIssue[];
};

// Calendar arithmetic avoids timezone conversion and Date's rollover/year quirks.
export function dateIssue(
  value: string,
): "DATE_FORMAT" | "DATE_INVALID" | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "DATE_FORMAT";
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1]!
    ? null
    : "DATE_INVALID";
}

// Two passes flag every duplicate member (including the first), without keeping
// a second dataset or an unbounded issue list. Identifiers compare exact strings.
export async function validateInventory(
  source: Source,
  mapping: Mapping,
  cancelled: () => boolean,
  viewRow: (row: SourceRow) => SourceRow = (row) => row,
): Promise<InventoryResult | null> {
  const problems = mappingProblems(mapping, source.headers);
  if (problems.length) throw new Error(problems.join(" "));
  const counts = new Map<string, number>();
  const yieldCancelled = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    return cancelled();
  };
  for (let index = 0; index < source.rows.length; index++) {
    if (index % 500 === 0 && (await yieldCancelled())) return null;
    const value = viewRow(source.rows[index]!).cells[mapping.asset_id!];
    if (value !== undefined && value.trim() !== "")
      counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const result: InventoryResult = {
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
    if (index % 500 === 0 && (await yieldCancelled())) return null;
    const row = viewRow(source.rows[index]!);
    const issues: InventoryIssue[] = requiredIssues(row, mapping);
    for (const field of ["asset_id", "inspection_date", "quantity"] as const) {
      const value = row.cells[mapping[field]!];
      if (value === undefined || value.trim() === "") continue;
      const code =
        field === "asset_id"
          ? counts.get(value)! > 1
            ? "DUPLICATE_ID"
            : null
          : field === "inspection_date"
            ? dateIssue(value)
            : /^-?(0|[1-9]\d*)$/.test(value)
              ? null
              : "INTEGER_FORMAT";
      if (code)
        issues.push({
          rowId: row.rowId,
          sourceLine: row.sourceLine,
          field,
          code,
          rawValue: value,
        });
    }
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
