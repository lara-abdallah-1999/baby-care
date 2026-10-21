import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Search, X, LoaderCircle, UserRound } from "lucide-react";
import type { MotherAdmission } from "../types";
import { admissionService } from "../services/workflows";
import { errorMessage } from "./common";

export function PatientSearch({
  onSelect,
  onEmpty,
  onClear,
  disabled = false,
  compact = false,
  caseOnly = false,
}: {
  onSelect: (mother: MotherAdmission) => void;
  onEmpty?: () => void;
  onClear?: () => void;
  disabled?: boolean;
  compact?: boolean;
  caseOnly?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MotherAdmission[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const version = useRef(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const resultsPanel = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    if (!open || !query.trim() || disabled) return;
    function positionPanel() {
      const bounds = wrapper.current?.querySelector("form")?.getBoundingClientRect();
      if (!bounds) return;
      const gap = 8,
        margin = 12;
      const footer = wrapper.current?.closest(".app-shell")?.querySelector("footer");
      const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
      const panelBottom = Math.min(window.innerHeight, footerTop);
      const below = panelBottom - bounds.bottom - gap - margin;
      const width = Math.min(bounds.width, window.innerWidth - margin * 2);
      setPanelStyle({
        position: "fixed",
        left: Math.max(margin, Math.min(bounds.left, window.innerWidth - width - margin)),
        width,
        right: "auto",
        top: bounds.bottom + gap,
        bottom: "auto",
        maxHeight: Math.max(0, Math.min(320, below)),
        boxSizing: "border-box",
        visibility: "visible",
        zIndex: 1000,
      });
    }
    positionPanel();
    const reposition = (event: Event) => {
      if (!resultsPanel.current?.contains(event.target as Node)) positionPanel();
    };
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, query, disabled]);
  useEffect(() => {
    if (active >= 0)
      resultsPanel.current
        ?.querySelector<HTMLElement>('[aria-selected="true"]')
        ?.scrollIntoView?.({ block: "nearest" });
  }, [active]);
  useEffect(() => {
    const requestVersion = version;
    const close = (event: PointerEvent) => {
      if (
        !wrapper.current?.contains(event.target as Node) &&
        !resultsPanel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      requestVersion.current++;
    };
  }, []);
  useEffect(() => {
    const current = ++version.current;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      admissionService
        .searchMotherAdmission(query, caseOnly)
        .then((matches) => {
          if (version.current !== current) return;
          setResults(matches);
          setLoading(false);
          setError("");
          setActive(-1);
        })
        .catch((reason) => {
          if (version.current === current) {
            setError(errorMessage(reason));
            setLoading(false);
          }
        });
    }, 140);
    return () => {
      clearTimeout(timer);
    };
  }, [query, caseOnly]);
  function select(mother: MotherAdmission) {
    version.current++;
    setOpen(false);
    setLoading(false);
    onSelect(mother);
  }
  async function submit() {
    if (!query.trim() || disabled) return;
    const current = ++version.current;
    setLoading(true);
    setError("");
    try {
      const matches = await admissionService.searchMotherAdmission(query, caseOnly);
      if (current !== version.current) return;
      setResults(matches);
      setOpen(true);
      if (matches.length === 1) select(matches[0]);
      else if (!matches.some((m) => m.status === "Active")) {
        setOpen(false);
        onEmpty?.();
      }
    } catch (reason) {
      if (current === version.current) setError(errorMessage(reason));
    } finally {
      if (current === version.current) setLoading(false);
    }
  }
  const suggestions =
    open && query.trim() && !disabled ? (
      <div
        ref={resultsPanel}
        style={panelStyle}
        className="lookup-results lookup-results-floating"
        id={`${id}-results`}
        role="listbox"
        aria-label="Matching admissions"
      >
        {loading ? (
          <p role="status">Searching admissions…</p>
        ) : results.length ? (
          results.map((mother, i) => (
            <div
              key={mother.id}
              role="option"
              aria-selected={active === i}
              id={`${id}-option-${i}`}
              className={`lookup-option ${active === i ? "active" : ""}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => select(mother)}
            >
              <UserRound size={17} />
              <div>
                <strong>{mother.name}</strong>
                <span>
                  MRN {mother.patientId} · {mother.caseNumber}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>
            No matching admission.{" "}
            {onEmpty && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setOpen(false);
                  onEmpty();
                }}
              >
                View reception guidance
              </button>
            )}
          </p>
        )}
      </div>
    ) : null;
  return (
    <div ref={wrapper} className={`patient-lookup ${compact ? "compact" : ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (open && active >= 0 && results[active]) select(results[active]);
          else void submit();
        }}
      >
        <div className="lookup-input">
          <Search size={16} />
          <input
            ref={input}
            id={id}
            role="combobox"
            aria-label={caseOnly ? "Case number" : compact ? "Find patient" : "Mother’s admission"}
            aria-autocomplete="list"
            aria-controls={`${id}-results`}
            aria-expanded={open && !!query}
            aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
            autoComplete="off"
            placeholder={
              compact
                ? "Find patient by name, MRN, case or phone…"
                : caseOnly
                  ? "Enter case number"
                  : "Name, MRN, case or phone"
            }
            disabled={disabled}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setError("");
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((i) => Math.min(i + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />
          {loading ? (
            <LoaderCircle size={15} className="lookup-end spin" />
          ) : (
            query && (
              <button
                type="button"
                className="lookup-clear"
                aria-label="Clear patient search"
                disabled={disabled}
                onClick={() => {
                  version.current++;
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                  onClear?.();
                  input.current?.focus();
                }}
              >
                <X size={14} />
              </button>
            )
          )}
        </div>
        {!compact && (
          <button className="primary" disabled={disabled || !query.trim()}>
            Search
          </button>
        )}
      </form>
      {error && (
        <p className="lookup-error" role="alert">
          {error}
        </p>
      )}
      {suggestions && createPortal(suggestions, document.body)}
      {!compact && (
        <p className="lookup-help">
          {caseOnly
            ? "Search by case number, e.g. CASE-2026-00127"
            : "Search across admitted patients. Demo MRN: PT-10482"}
        </p>
      )}
    </div>
  );
}
