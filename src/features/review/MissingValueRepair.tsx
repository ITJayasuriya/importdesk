import { useEffect, useRef, useState } from "react";
import { INVENTORY_FIELDS, type InventoryField } from "../../domain/inventory";
import type { RepairPreview } from "../../domain/repair";
import styles from "../../app/workbench.module.css";

type Props = {
  busy: boolean;
  preview: RepairPreview | null;
  stepCount: number;
  onChange: () => void;
  onPreview: (field: InventoryField, value: string) => void;
  onApply: () => void;
};
export function MissingValueRepair({
  busy,
  preview,
  stepCount,
  onChange,
  onPreview,
  onApply,
}: Props) {
  const [field, setField] = useState<InventoryField>("label");
  const [value, setValue] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (stepCount > 0) heading.current?.focus();
  }, [stepCount]);
  return (
    <section aria-labelledby="repair-heading" className={styles.panel}>
      <h2 id="repair-heading" ref={heading} tabIndex={-1}>
        4. Fill missing values
      </h2>
      <p>
        Fill empty, whitespace-only or absent cells in one mapped column.
        Existing non-empty values stay unchanged. Preview the exact changes
        before applying.
      </p>
      <p>
        {stepCount} repair steps applied. Originals remain available above. This
        alpha keeps repairs in memory; undo, recipe download and export are
        still in development.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onPreview(field, value);
        }}
      >
        <fieldset disabled={busy || stepCount >= 100}>
          <legend>One explicit replacement</legend>
          <div className={styles.actions}>
            <div>
              <label htmlFor="repair-field">Destination field</label>
              <select
                id="repair-field"
                value={field}
                onChange={(event) => {
                  const selected = INVENTORY_FIELDS.find(
                    ({ id }) => id === event.target.value,
                  );
                  if (selected) setField(selected.id);
                  onChange();
                }}
              >
                {INVENTORY_FIELDS.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="repair-value">Replacement value</label>
              <input
                id="repair-value"
                type="text"
                value={value}
                maxLength={65536}
                onChange={(event) => {
                  setValue(event.target.value);
                  onChange();
                }}
                required
              />
            </div>
            <button type="submit" disabled={!value.trim()}>
              Preview replacement
            </button>
          </div>
        </fieldset>
      </form>
      {preview && (
        <section aria-labelledby="preview-heading">
          <h3 id="preview-heading">Before / after inspection</h3>
          <p>
            {preview.affected} cells will change. Showing up to 50 examples.
            Replacement is literal text; dates and integers are not converted or
            validated.
          </p>
          {preview.examples.length > 0 && (
            <div
              className={styles.tableScroll}
              role="region"
              aria-label="Repair preview examples"
              tabIndex={0}
            >
              <table>
                <caption>Proposed replacement · original source lines</caption>
                <thead>
                  <tr>
                    <th scope="col">Source line</th>
                    <th scope="col">Before</th>
                    <th scope="col">After</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.examples.map((example) => (
                    <tr key={example.rowId}>
                      <th scope="row">{example.sourceLine}</th>
                      <td>
                        <bdi>
                          {example.before === null
                            ? "(missing)"
                            : example.before === ""
                              ? "(empty)"
                              : example.before}
                        </bdi>
                      </td>
                      <td>
                        <bdi>{example.after}</bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            className={styles.primary}
            disabled={busy || preview.affected === 0}
            onClick={onApply}
          >
            Apply {preview.affected} replacements
          </button>
        </section>
      )}
    </section>
  );
}
