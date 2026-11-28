import type { InventoryResult } from "../../domain/validation";
import { useState } from "react";
import {
  INVENTORY_FIELDS,
  mappingProblems,
  suggestMapping,
  type Mapping,
} from "../../domain/inventory";
import styles from "../../app/workbench.module.css";

type Props = {
  headers: string[];
  busy: boolean;
  result: InventoryResult | null;
  onChange: () => void;
  onValidate: (mapping: Mapping) => void;
};
export function InventoryMapping({
  headers,
  busy,
  result,
  onChange,
  onValidate,
}: Props) {
  const [mapping, setMapping] = useState(() => suggestMapping(headers));
  const [confirmed, setConfirmed] = useState(false);
  const problems = mappingProblems(mapping, headers);
  const unmapped = headers.flatMap((header, index) =>
    Object.values(mapping).includes(index) ? [] : [`${header} (#${index + 1})`],
  );
  return (
    <section aria-labelledby="mapping-heading" className={styles.panel}>
      <h2 id="mapping-heading">3. Map to inventory</h2>
      <p>
        Inventory schema v1 · All six fields are required. Suggestions match
        header names only. Confirm each source column before checking values.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed && !problems.length) onValidate(mapping);
        }}
      >
        <fieldset disabled={busy}>
          <legend>Destination ← source column</legend>
          <div className={styles.mappingGrid}>
            {INVENTORY_FIELDS.map(({ id, label, requirement }) => (
              <div key={id}>
                <label htmlFor={`mapping-${id}`}>{label}</label>
                <select
                  id={`mapping-${id}`}
                  value={mapping[id] ?? ""}
                  aria-describedby={`${id}-requirement`}
                  onChange={(event) => {
                    setMapping({
                      ...mapping,
                      [id]:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    });
                    setConfirmed(false);
                    onChange();
                  }}
                >
                  <option value="">Choose source column</option>
                  {headers.map((header, index) => (
                    <option key={index} value={index}>
                      {header} (#{index + 1})
                    </option>
                  ))}
                </select>
                <small id={`${id}-requirement`}>{requirement}</small>
              </div>
            ))}
          </div>
          {problems.length > 0 && (
            <div className={styles.error}>
              <p>Resolve mapping before validation:</p>
              <ul>
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          )}
          {unmapped.length > 0 && (
            <p className={styles.filename}>
              Unmapped source columns: {unmapped.join(", ")}. Original values
              remain available in the source preview.
            </p>
          )}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={confirmed}
              disabled={problems.length > 0}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I confirm all inventory mappings
          </label>
          <button
            className={styles.primary}
            type="submit"
            disabled={!confirmed || problems.length > 0}
          >
            Check inventory values
          </button>
        </fieldset>
      </form>
      {result && (
        <section aria-labelledby="required-heading">
          <h3 id="required-heading">Inventory validation results</h3>
          <p>
            {result.total} source rows = {result.valid} passing inventory rules
            + {result.rejected} needing attention. {result.issueCount} inventory
            issues.
          </p>
          <p>
            Dates must be real YYYY-MM-DD calendar dates. Other formats need an
            explicit conversion; no date is guessed. Quantities must be integer
            strings. Every row sharing an exact Asset ID is flagged; no row is
            removed. Category and location accept any non-empty string. Export
            safety is checked separately before export is available.
          </p>
          <p>
            Whitespace-only cells count as empty. Results include applied
            repairs; originals stay unchanged. Showing up to 50 issue examples.
          </p>
          {result.examples.length > 0 && (
            <div
              className={styles.tableScroll}
              role="region"
              aria-label="Inventory issue examples"
              tabIndex={0}
            >
              <table>
                <caption>Inventory issue examples · current values</caption>
                <thead>
                  <tr>
                    <th scope="col">Source line</th>
                    <th scope="col">Destination</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Current value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.examples.map((issue) => (
                    <tr key={`${issue.rowId}:${issue.field}`}>
                      <th scope="row">{issue.sourceLine}</th>
                      <td>{issue.field}</td>
                      <td>{issue.code}</td>
                      <td>
                        <bdi>
                          {issue.rawValue === null
                            ? "(missing)"
                            : issue.rawValue.trim() === ""
                              ? "(empty or whitespace)"
                              : issue.rawValue}
                        </bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
