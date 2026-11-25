import Papa from "papaparse";

export const LIMITS = {
  bytes: 20 * 1024 * 1024,
  rows: 100_000,
  columns: 50,
  cellBytes: 64 * 1024,
};
export type ImportOptions = { delimiter: "," | ";" | "\t"; header: boolean };
export type SourceRow = { rowId: string; sourceLine: number; cells: string[] };
export type Source = { headers: string[]; rows: SourceRow[] };
export class ImportError extends Error {
  constructor(
    public code: "LIMIT" | "UTF8" | "CSV" | "EMPTY" | "CANCELLED",
    message: string,
  ) {
    super(message);
  }
}

export async function parseCsv(
  file: Blob,
  options: ImportOptions,
  control: { cancelled: () => boolean; progress: (rows: number) => void } = {
    cancelled: () => false,
    progress: () => {},
  },
): Promise<Source> {
  if (file.size > LIMITS.bytes)
    throw new ImportError("LIMIT", "File exceeds 20 MiB.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    throw new ImportError(
      "UTF8",
      "Cannot decode file as UTF-8. Export it as UTF-8 CSV and retry.",
    );
  }
  if (control.cancelled())
    throw new ImportError("CANCELLED", "Import cancelled.");
  if (!text.length) throw new ImportError("EMPTY", "The file is empty.");
  // The file buffer is bounded above; parsing yields between 500-record batches.
  return new Promise((resolve, reject) => {
    const rows: SourceRow[] = [];
    let headers: string[] | undefined;
    let record = 0;
    let cursor = 0;
    let baseOffset = 0;
    let sourceLine = 1;
    let failed = false;
    const encoder = new TextEncoder();
    Papa.parse<string[]>(text, {
      delimiter: options.delimiter,
      dynamicTyping: false,
      skipEmptyLines: false,
      step(result, parser) {
        if (failed) return;
        const fail = (error: ImportError) => {
          failed = true;
          parser.abort();
          reject(error);
        };
        if (control.cancelled()) {
          fail(new ImportError("CANCELLED", "Import cancelled."));
          return;
        }
        // Papa reports a final empty record for a terminal newline. Preserve every other blank record.
        if (
          result.data.length === 1 &&
          result.data[0] === "" &&
          cursor === text.length
        )
          return;
        if (result.errors.length) {
          fail(
            new ImportError(
              "CSV",
              `Malformed CSV near line ${sourceLine}: ${result.errors[0]?.message}`,
            ),
          );
          return;
        }
        if (
          result.data.length > LIMITS.columns ||
          result.data.some(
            (cell) => encoder.encode(cell).length > LIMITS.cellBytes,
          )
        ) {
          fail(
            new ImportError(
              "LIMIT",
              "A record exceeds 50 columns or a cell exceeds 64 KiB UTF-8.",
            ),
          );
          return;
        }
        record++;
        if (options.header && record === 1) headers = result.data;
        else {
          if (rows.length === LIMITS.rows) {
            fail(new ImportError("LIMIT", "File exceeds 100,000 data rows."));
            return;
          }
          rows.push({
            rowId: `row:${rows.length + 1}`,
            sourceLine,
            cells: result.data,
          });
        }
        const consumed = text.slice(cursor, baseOffset + result.meta.cursor);
        sourceLine += (consumed.match(/\r\n|\r|\n/g) ?? []).length;
        cursor = baseOffset + result.meta.cursor;
        if (record % 500 === 0) {
          control.progress(rows.length);
          parser.pause();
          setTimeout(() => {
            baseOffset = cursor;
            parser.resume();
          }, 0);
        }
      },
      complete() {
        if (failed) return;
        if (!rows.length) {
          reject(new ImportError("EMPTY", "No data rows found."));
          return;
        }
        const width = Math.max(
          headers?.length ?? 0,
          ...rows.slice(0, 1).map((row) => row.cells.length),
        );
        resolve({
          headers:
            headers ??
            Array.from({ length: width }, (_, i) => `Column ${i + 1}`),
          rows,
        });
      },
    });
  });
}
