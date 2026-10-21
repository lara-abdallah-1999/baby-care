import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export function BloodTypePicker({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (disabled) {
      dialog.current?.close();
      setOpen(false);
    }
  }, [disabled]);

  function close() {
    dialog.current?.close();
    setOpen(false);
    onBlur();
    trigger.current?.focus();
  }

  function choose(type: string) {
    onChange(type);
    close();
  }

  return (
    <div className="blood-type-picker">
      <span className="field-label" id={`${id}-label`}>
        Blood type
      </span>
      <button
        ref={trigger}
        type="button"
        className="blood-type-trigger"
        disabled={disabled}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={`${id}-choices`}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
          dialog.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
        }}
      >
        <span id={`${id}-value`}>{value || "Unknown / not recorded"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="date-time-dialog blood-type-dialog"
        id={`${id}-choices`}
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="picker-title">
          <h3 id={`${id}-title`}>Choose blood type</h3>
          <button
            type="button"
            className="quiet"
            aria-label="Close blood type picker"
            onClick={close}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="blood-type-options" role="radiogroup" aria-labelledby={`${id}-title`}>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""].map((type) => (
            <label
              key={type}
              className={type ? "blood-type-choice" : "blood-type-choice blood-type-unknown"}
            >
              <input
                type="radio"
                name={id}
                value={type}
                checked={value === type}
                onChange={() => choose(type)}
                onClick={() => {
                  if (value === type) close();
                }}
              />
              <span>{type || "Unknown / not recorded"}</span>
            </label>
          ))}
        </div>
      </dialog>
    </div>
  );
}
