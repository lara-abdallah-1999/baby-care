import { useEffect, useRef, useState } from "react";
import { Columns3, X } from "lucide-react";
import "../registers.css";

export const childrenColumns = [
  "Full name",
  "MRN",
  "Gender",
  "Birth date",
  "Birth time",
  "Weight",
  "Height",
  "Head circumference",
  "Maturity",
] as const;
export const allChildrenColumns = [...childrenColumns, "Bracelet", "Requests"] as const;
export const defaultChildrenColumns: readonly string[] = [
  "Full name",
  "MRN",
  "Gender",
  "Birth date",
  "Weight",
  "Bracelet",
  "Requests",
];

export function ChildrenColumns({
  selected,
  onChange,
}: {
  selected: readonly string[];
  onChange: (columns: readonly string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="children-columns" ref={root}>
      <button
        ref={trigger}
        className={open ? "secondary active" : "secondary"}
        aria-expanded={open}
        aria-controls="children-columns-panel"
        onClick={() => setOpen(!open)}
      >
        <Columns3 size={15} />
        Columns
      </button>
      {open && (
        <div
          id="children-columns-panel"
          className="register-columns-panel"
          role="region"
          aria-label="Visible children columns"
        >
          <div className="register-panel-title">
            <strong>Visible columns</strong>
            <button
              className="quiet"
              aria-label="Close columns"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="register-column-options">
            {allChildrenColumns.map((column) => (
              <label key={column}>
                <input
                  type="checkbox"
                  checked={selected.includes(column)}
                  disabled={selected.length === 1 && selected.includes(column)}
                  onChange={() =>
                    onChange(
                      selected.includes(column)
                        ? selected.filter((value) => value !== column)
                        : [...selected, column],
                    )
                  }
                />
                {column}
              </label>
            ))}
          </div>
          <div className="register-column-actions">
            <button className="quiet" onClick={() => onChange(defaultChildrenColumns)}>
              Default columns
            </button>
            <button className="quiet" onClick={() => onChange(allChildrenColumns)}>
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
