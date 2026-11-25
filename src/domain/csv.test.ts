import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseCsv, LIMITS } from "./csv";
const comma = { delimiter: ",", header: true } as const;
const parse = (text: string, options = comma) =>
  parseCsv(new Blob([text]), options);

describe("bounded CSV source", () => {
  it("preserves inventory strings, source lines, duplicate IDs and raw formulas", async () => {
    const source = await parse(readFileSync("fixtures/inventory.csv", "utf8"));
    expect(source.rows).toHaveLength(5);
    expect(source.rows[0]?.cells.slice(0, 2)).toEqual([
      "000123",
      " Folding chair ",
    ]);
    expect(source.rows[1]?.cells[1]).toBe("Projector,\nportable");
    expect(source.rows[1]?.cells[4]).toBe("01/02/2026");
    expect(source.rows[2]).toMatchObject({ rowId: "row:3", sourceLine: 5 });
    expect(source.rows[4]?.cells[1]).toMatch(/^=HYPERLINK/);
  });
  it("supports BOM, CRLF, duplicate headers, empty vs absent cells", async () => {
    const source = await parse('\uFEFFid,id,extra\r\n0001,"a""b",\r\n0002,x');
    expect(source.headers).toEqual(["id", "id", "extra"]);
    expect(source.rows.map((row) => row.cells)).toEqual([
      ["0001", 'a"b', ""],
      ["0002", "x"],
    ]);
  });
  it.each([";", "\t"] as const)(
    "supports explicit %j delimiter without headers",
    async (delimiter) => {
      const source = await parseCsv(new Blob([`0001${delimiter}12.00`]), {
        delimiter,
        header: false,
      });
      expect(source.rows[0]?.cells).toEqual(["0001", "12.00"]);
      expect(source.headers).toEqual(["Column 1", "Column 2"]);
    },
  );
  it("preserves blank data records, ignoring only the terminal newline", async () => {
    expect((await parse("id\n1\n\n2\n")).rows.map((row) => row.cells)).toEqual([
      ["1"],
      [""],
      ["2"],
    ]);
  });
  it.each(["", "id\n", 'id\n"unterminated'])(
    "rejects empty or malformed input %j",
    async (text) => {
      await expect(parse(text)).rejects.toThrow();
    },
  );
  it("rejects undecodable UTF-8", async () => {
    await expect(
      parseCsv(new Blob([new Uint8Array([0xff])]), comma),
    ).rejects.toMatchObject({ code: "UTF8" });
  });
  it("rejects each exceeded envelope boundary without a partial source", async () => {
    await expect(
      parseCsv(new Blob([new Uint8Array(LIMITS.bytes + 1)]), comma),
    ).rejects.toMatchObject({ code: "LIMIT" });
    await expect(
      parse("id\n" + "é".repeat(LIMITS.cellBytes / 2 + 1)),
    ).rejects.toMatchObject({ code: "LIMIT" });
    await expect(
      parse(Array(51).fill("a").join(",") + "\n1"),
    ).rejects.toMatchObject({ code: "LIMIT" });
    await expect(
      parse("id\n" + "1\n".repeat(LIMITS.rows + 1)),
    ).rejects.toMatchObject({ code: "LIMIT" });
  });
  it("accepts 100,000 rows and cooperatively cancels between batches", async () => {
    const input = "id\n" + "0001\n".repeat(LIMITS.rows);
    const source = await parse(input);
    expect(source.rows).toHaveLength(LIMITS.rows);
    expect(source.rows.at(-1)).toMatchObject({
      rowId: "row:100000",
      sourceLine: 100001,
    });
    let cancel = false;
    await expect(
      parseCsv(new Blob([input]), comma, {
        cancelled: () => cancel,
        progress: () => {
          cancel = true;
        },
      }),
    ).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
