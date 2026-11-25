import { useEffect, useRef, useState } from "react";
import sample from "../../fixtures/inventory.csv?raw";
import type { ImportOptions, SourceRow } from "../domain/csv";
import {
  matchesReply,
  type Identity,
  type Reply,
  type Request,
} from "../worker/protocol";
import styles from "./workbench.module.css";

// Inventory operators inspect exact source values before mapping; the table is the focal surface.
// Paper/graphite, blue actions, border-led depth, system type and 4px spacing follow IMPLEMENTATION.md.
export function ImportWorkbench() {
  const worker = useRef<Worker | null>(null);
  const active = useRef<Identity | null>(null);
  const errorFocus = useRef<HTMLParagraphElement>(null);
  const [file, setFile] = useState<{ blob: Blob; name: string } | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    delimiter: ",",
    header: true,
  });
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    "Choose a CSV or try the synthetic inventory.",
  );
  const [error, setError] = useState("");
  const [source, setSource] = useState<{
    identity: Identity;
    name: string;
    headers: string[];
    total: number;
    rows: SourceRow[];
    page: number;
  } | null>(null);
  const importingName = useRef("");

  useEffect(() => {
    const instance = new Worker(
      new URL("../worker/import.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = instance;
    const fail = (message: string) => {
      setBusy(false);
      setError(message);
    };
    instance.onmessage = (event: MessageEvent<Reply>) => {
      const reply = event.data;
      if (!active.current || !matchesReply(reply, active.current)) return;
      if (reply.type === "progress") {
        setStatus(`Reading source: ${reply.rows.toLocaleString()} rows…`);
        return;
      }
      setBusy(false);
      if (reply.type === "error") {
        fail(reply.message);
        return;
      }
      if (reply.type === "cancelled") {
        setStatus("Import cancelled. No partial source was accepted.");
        return;
      }
      if (reply.type === "imported") {
        setSource({
          identity: active.current,
          name: importingName.current,
          headers: reply.headers,
          total: reply.total,
          rows: reply.rows,
          page: 0,
        });
        setStatus(
          `${reply.total.toLocaleString()} source rows ready. Values have not been repaired.`,
        );
      } else {
        setSource(
          (previous) =>
            previous && { ...previous, rows: reply.rows, page: reply.page },
        );
        setStatus(`Source page ${reply.page + 1} ready.`);
      }
    };
    instance.onerror = () =>
      fail(
        "The worker stopped unexpectedly. Reload and select the original file again; nothing was saved.",
      );
    return () => {
      active.current = null;
      instance.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    if (error) errorFocus.current?.focus();
  }, [error]);

  function send(request: Request) {
    active.current = request;
    setError("");
    setBusy(true);
    worker.current?.postMessage(request);
  }
  function select(blob: Blob, name: string) {
    setFile({ blob, name });
    setConfirmed(false);
    setError("");
    setStatus("Confirm the delimiter and first-row setting before importing.");
  }
  function changePage(page: number) {
    if (!source) return;
    send({
      ...source.identity,
      requestId: crypto.randomUUID(),
      type: "GET_ROWS",
      page,
    });
  }
  const pages = source ? Math.ceil(source.total / 50) : 0;
  const sourceWidth =
    source?.rows.reduce(
      (width, row) => Math.max(width, row.cells.length),
      source.headers.length,
    ) ?? 0;
  return (
    <main className={styles.workbench}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Private CSV workbench · source preview alpha
          </p>
          <h1>ImportDesk</h1>
        </div>
        <a href="https://github.com/ITJayasuriya/importdesk">
          Source & contribution guide
        </a>
      </header>
      <p className={styles.intro}>
        Inspect the source before an inventory import. Files stay in this
        browser’s memory. Refreshing clears this session; nothing is uploaded or
        saved.
      </p>
      <section aria-labelledby="import-heading" className={styles.panel}>
        <h2 id="import-heading">1. Confirm your source</h2>
        <p>
          UTF-8 CSV · up to 20 MiB, 100,000 rows, 50 columns and 64 KiB per
          cell.
        </p>
        <div className={styles.actions}>
          <label>
            Choose CSV
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              disabled={busy}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) select(selected, selected.name);
              }}
            />
          </label>
          <button
            disabled={busy}
            onClick={() => select(new Blob([sample]), "inventory.csv")}
          >
            Try inventory sample
          </button>
        </div>
        {file && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!confirmed) return;
              importingName.current = file.name;
              setStatus("Reading source…");
              send({
                type: "IMPORT",
                sessionId: crypto.randomUUID(),
                requestId: crypto.randomUUID(),
                revision: 0,
                file: file.blob,
                options,
              });
            }}
          >
            <p className={styles.filename}>
              Selected: <bdi>{file.name}</bdi>
            </p>
            <fieldset disabled={busy}>
              <legend>
                Import settings — explicitly confirm these for this file
              </legend>
              <div className={styles.actions}>
                <label>
                  Delimiter
                  <select
                    value={options.delimiter}
                    onChange={(event) => {
                      const delimiter = event.target.value;
                      if (
                        delimiter === "," ||
                        delimiter === ";" ||
                        delimiter === "\t"
                      )
                        setOptions({ ...options, delimiter });
                      setConfirmed(false);
                    }}
                  >
                    <option value=",">Comma</option>
                    <option value=";">Semicolon</option>
                    <option value={"\t"}>Tab</option>
                  </select>
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={options.header}
                    onChange={(event) => {
                      setOptions({ ...options, header: event.target.checked });
                      setConfirmed(false);
                    }}
                  />
                  First row contains headers
                </label>
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                I confirm the delimiter and first-row setting
              </label>
              <button
                className={styles.primary}
                disabled={!confirmed}
                type="submit"
              >
                Import source preview
              </button>
            </fieldset>
          </form>
        )}
        {busy && (
          <button
            onClick={() => {
              if (active.current) send({ ...active.current, type: "CANCEL" });
            }}
          >
            Cancel processing
          </button>
        )}
        <p role="status">{status}</p>
        {error && (
          <p
            role="alert"
            tabIndex={-1}
            ref={errorFocus}
            className={styles.error}
          >
            {error}
          </p>
        )}
      </section>
      {source && (
        <section aria-labelledby="source-heading" className={styles.panel}>
          <div className={styles.header}>
            <div>
              <h2 id="source-heading">2. Inspect original values</h2>
              <p>
                <bdi>{source.name}</bdi> · {source.total.toLocaleString()} rows
                · original unchanged
              </p>
            </div>
            <span className={styles.stamp}>Source only</span>
          </div>
          <p>
            Whitespace and dates remain exactly as supplied. Empty cells show
            “(empty)”; absent fields show “(missing)”. Mapping, repairs and
            exports are still in development.
          </p>
          <div
            role="region"
            aria-label="Scrollable source table"
            tabIndex={0}
            className={styles.tableScroll}
          >
            <table>
              <caption>
                Original source · rows {source.page * 50 + 1}–
                {Math.min((source.page + 1) * 50, source.total)} of{" "}
                {source.total}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Source line</th>
                  {Array.from(
                    {
                      length: sourceWidth,
                    },
                    (_, index) => (
                      <th scope="col" key={index}>
                        {source.headers[index] ?? `Extra column ${index + 1}`}{" "}
                        <small>#{index + 1}</small>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {source.rows.map((row) => (
                  <tr key={row.rowId}>
                    <th scope="row">{row.sourceLine}</th>
                    {Array.from(
                      {
                        length: sourceWidth,
                      },
                      (_, index) => (
                        <td key={index}>
                          <bdi>
                            {row.cells[index] === undefined
                              ? "(missing)"
                              : row.cells[index] === ""
                                ? "(empty)"
                                : row.cells[index]}
                          </bdi>
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Source pages" className={styles.actions}>
            <button
              disabled={busy || source.page === 0}
              onClick={() => changePage(source.page - 1)}
            >
              Previous page
            </button>
            <span>
              Page {source.page + 1} of {pages}
            </span>
            <button
              disabled={busy || source.page + 1 === pages}
              onClick={() => changePage(source.page + 1)}
            >
              Next page
            </button>
          </nav>
        </section>
      )}
      <footer>
        In development · Local processing, explicit choices, unchanged
        originals. Revision {__BUILD_REVISION__}.
      </footer>
    </main>
  );
}
