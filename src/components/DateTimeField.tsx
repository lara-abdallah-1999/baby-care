import { useId, useRef, useState } from "react";
import { CalendarDays, Clock3, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  kind: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  label?: string;
  allowClear?: boolean;
}
const pad = (n: number) => String(n).padStart(2, "0");
const displayDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join("/") : value;
function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return value;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T12:00:00`);
  return date.getFullYear() === Number(match[3]) &&
    date.getMonth() + 1 === Number(match[2]) &&
    date.getDate() === Number(match[1])
    ? iso
    : value;
}
export function DateTimeField({
  kind,
  value,
  onChange,
  onBlur,
  error,
  label: suppliedLabel,
  allowClear = false,
}: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [month, setMonth] = useState(new Date());
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const label = suppliedLabel ?? (kind === "date" ? "Birth date" : "Birth time");
  const Icon = kind === "date" ? CalendarDays : Clock3;
  function open() {
    if (kind === "date")
      setMonth(/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date());
    else {
      const parts = (value || "00:00").split(":");
      setHour(Number(parts[0]));
      setMinute(Number(parts[1]));
    }
    dialog.current?.showModal();
  }
  function choose(next: string) {
    onChange(next);
    dialog.current?.close();
    onBlur();
  }
  const year = month.getFullYear(),
    monthIndex = month.getMonth();
  const start = new Date(year, monthIndex, 1).getDay();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  return (
    <div className="date-time-field">
      <label htmlFor={id}>{label}</label>
      <div className="date-time-input">
        <input
          id={id}
          type={kind === "date" ? "text" : "time"}
          placeholder={kind === "date" ? "dd/mm/yyyy" : undefined}
          step={kind === "time" ? 60 : undefined}
          maxLength={kind === "date" ? 10 : undefined}
          value={kind === "date" ? displayDate(value) : value}
          onChange={(e) => onChange(kind === "date" ? parseDate(e.target.value) : e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="picker-trigger"
          aria-label={`Choose ${label.toLowerCase()}`}
          onClick={open}
        >
          <Icon size={17} />
        </button>
      </div>
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
      <dialog
        ref={dialog}
        className="date-time-dialog"
        aria-labelledby={`${id}-title`}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="picker-title">
          <h3 id={`${id}-title`}>Choose {label.toLowerCase()}</h3>
          <button
            type="button"
            className="quiet"
            aria-label="Close picker"
            onClick={() => dialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        {kind === "date" ? (
          <>
            <div className="calendar-navigation">
              <button
                type="button"
                className="quiet"
                aria-label="Previous month"
                onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <strong aria-live="polite">
                {month.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <button
                type="button"
                className="quiet"
                aria-label="Next month"
                onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="calendar-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span className="calendar-weekday" key={day}>
                  {day}
                </span>
              ))}
              {Array.from({ length: start }, (_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const date = `${year}-${pad(monthIndex + 1)}-${pad(i + 1)}`;
                return (
                  <button
                    key={date}
                    type="button"
                    className={value === date ? "selected" : ""}
                    aria-pressed={value === date}
                    aria-label={date}
                    onClick={() => choose(date)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="picker-footer">
              {allowClear && (
                <button type="button" className="secondary" onClick={() => choose("")}>
                  Clear date
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const today = new Date();
                  choose(
                    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
                  );
                }}
              >
                Today
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="time-hint">24-hour time · hours and minutes</p>
            <div className="time-columns">
              <label>
                Hour
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={Number.isNaN(hour) ? "" : hour}
                  onChange={(e) => setHour(e.target.valueAsNumber)}
                />
              </label>
              <span>:</span>
              <label>
                Minute
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={Number.isNaN(minute) ? "" : minute}
                  onChange={(e) => setMinute(e.target.valueAsNumber)}
                />
              </label>
            </div>
            <div className="picker-footer">
              <button
                type="button"
                className="primary"
                disabled={
                  !Number.isInteger(hour) ||
                  !Number.isInteger(minute) ||
                  hour < 0 ||
                  hour > 23 ||
                  minute < 0 ||
                  minute > 59
                }
                onClick={() => choose(`${pad(hour)}:${pad(minute)}`)}
              >
                Apply time
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
