import { useId, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export function RegisterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    dialog.current?.close();
    trigger.current?.focus();
  }
  return (
    <div className="register-select-field">
      <span id={`${id}-label`}>{label}</span>
      <button
        ref={trigger}
        type="button"
        className="register-select-trigger"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <span id={`${id}-value`}>
          {options.find((option) => option.value === value)?.label ?? "All"}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="date-time-dialog register-select-dialog"
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="picker-title">
          <h3 id={`${id}-title`}>{label}</h3>
          <button type="button" className="quiet" aria-label={`Close ${label}`} onClick={close}>
            <X size={16} />
          </button>
        </div>
        <div className="register-select-options">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
}
