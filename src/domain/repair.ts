import { LIMITS, type Source, type SourceRow } from "./csv";
import {
  mappingProblems,
  type InventoryField,
  type Mapping,
} from "./inventory";

export type FillStep = { column: number; value: string };
export type RepairPreview = {
  affected: number;
  examples: {
    rowId: string;
    sourceLine: number;
    before: string | null;
    after: string;
  }[];
};
export function repairedRow(
  row: SourceRow,
  steps: readonly FillStep[],
): SourceRow {
  let cells = row.cells;
  for (const step of steps) {
    if ((cells[step.column] ?? "").trim() !== "") continue;
    if (cells === row.cells) cells = [...cells];
    // A short record may have absent columns between the original end and this cell.
    while (cells.length <= step.column) cells.push("");
    cells[step.column] = step.value;
  }
  return cells === row.cells ? row : { ...row, cells };
}
export function fillStep(
  source: Source,
  mapping: Mapping,
  field: InventoryField,
  value: string,
): FillStep {
  const problems = mappingProblems(mapping, source.headers);
  if (problems.length) throw new Error(problems.join(" "));
  if (!value.trim()) throw new Error("Choose a non-empty replacement value.");
  if (new TextEncoder().encode(value).length > LIMITS.cellBytes)
    throw new Error("Replacement exceeds 64 KiB per cell.");
  return { column: mapping[field]!, value };
}
export async function previewFill(
  source: Source,
  steps: readonly FillStep[],
  step: FillStep,
  cancelled: () => boolean,
): Promise<RepairPreview | null> {
  const preview: RepairPreview = { affected: 0, examples: [] };
  for (let index = 0; index < source.rows.length; index++) {
    if (index % 500 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (cancelled()) return null;
    }
    const row = repairedRow(source.rows[index]!, steps);
    const before = row.cells[step.column] ?? null;
    if (before !== null && before.trim() !== "") continue;
    preview.affected++;
    if (preview.examples.length < 50)
      preview.examples.push({
        rowId: row.rowId,
        sourceLine: row.sourceLine,
        before,
        after: step.value,
      });
  }
  return preview;
}
