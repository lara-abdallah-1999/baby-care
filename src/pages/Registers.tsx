import { useRegisterView, type Row } from "../features/registers/useRegisterView";
import { WorkflowDialog } from "../components/WorkflowDialog";
import { RequestResults } from "../features/labRequests/RequestResults";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowRight,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Columns3,
  X,
} from "lucide-react";
import { DateTimeField } from "../components/DateTimeField";
import { RegisterSelect } from "../components/RegisterSelect";
import { useRegisters } from "../hooks/useRegisters";
import { useEffect, useRef, useState } from "react";

export function Registers({ kind }: { kind: "babies" | "requests" }) {
  const [panel, setPanel] = useState<"filters" | "columns" | null>(null);
  const columnsPanel = useRef<HTMLDivElement>(null);
  const columnTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (panel !== "columns") return;
    const close = (event: PointerEvent) => {
      if (
        !columnsPanel.current?.contains(event.target as Node) &&
        !columnTrigger.current?.contains(event.target as Node)
      )
        setPanel(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [panel]);
  const isBabies = kind === "babies";
  const navigate = useNavigate();
  const admissionState = (row: Row) => ({
    motherId: row.motherId,
    tab: isBabies ? "view" : "lab",
    babyId: isBabies ? row.id : row.babyId,
    requestId: isBabies ? undefined : row.id,
  });
  const data = useRegisters();
  const [resultId, setResultId] = useState<string | null>(null);
  const resultRequest = data.requests.find((request) => request.id === resultId);
  function openRow(row: Row) {
    if (!isBabies && row.status === "Proceeded") setResultId(row.id);
    else navigate("/admission", { state: admissionState(row) });
  }
  const {
    get,
    update,
    filtered,
    columns,
    visibleColumns,
    activeFilters,
    resetFilters,
    toggleColumn,
    sort,
    direction,
    size,
    pages,
    page,
    visible,
    sortBy,
    from,
    to,
    invalidRange,
    rows,
  } = useRegisterView(isBabies, data);
  function selectFilter(key: string, label: string, options: string[]) {
    return (
      <RegisterSelect
        label={label}
        value={get(key)}
        onChange={(value) => update(key, value)}
        options={[
          { value: "", label: "All" },
          ...options.map((option) => ({ value: option, label: option })),
        ]}
      />
    );
  }
  const unique = (key: string) =>
    Array.from(new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean))).sort();
  return (
    <div
      className={`register-page ${isBabies ? "" : "request-register"}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setPanel(null);
          if (panel === "columns") columnTrigger.current?.focus();
        }
      }}
    >
      <section className="register-panel register-results" aria-label="Register results">
        <header className="register-header">
          <div className="register-heading">
            <span className="eyebrow">REGISTERS</span>
            <h1>
              {isBabies ? "Admitted Babies" : "Lab Requests"}
              <span>{filtered.length}</span>
            </h1>
          </div>
          <div className="register-tools">
            <label className="register-search">
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Search records"
                type="search"
                value={get("q")}
                placeholder="Search records..."
                onChange={(e) => update("q", e.target.value)}
              />
            </label>
            <button
              className={panel === "filters" ? "secondary active" : "secondary"}
              aria-expanded={panel === "filters"}
              aria-controls="register-filters"
              onClick={() => setPanel(panel === "filters" ? null : "filters")}
            >
              <SlidersHorizontal size={15} />
              Filters{activeFilters > 0 && <span className="register-count">{activeFilters}</span>}
            </button>
            <button
              ref={columnTrigger}
              className={panel === "columns" ? "secondary active" : "secondary"}
              aria-expanded={panel === "columns"}
              aria-controls="register-columns"
              onClick={() => setPanel(panel === "columns" ? null : "columns")}
            >
              <Columns3 size={15} />
              Columns
            </button>
          </div>
          {panel === "columns" && (
            <div
              ref={columnsPanel}
              id="register-columns"
              className="register-columns-panel"
              role="region"
              aria-label="Visible columns"
            >
              <div className="register-panel-title">
                <strong>Visible columns</strong>
                <button
                  className="quiet"
                  aria-label="Close columns"
                  onClick={() => {
                    setPanel(null);
                    columnTrigger.current?.focus();
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <p>Choose what appears in this table.</p>
              <div className="register-column-options">
                {columns.map((column) => (
                  <label key={column.key}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.some((c) => c.key === column.key)}
                      disabled={visibleColumns.length === 1 && visibleColumns[0].key === column.key}
                      onChange={() => toggleColumn(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
              </div>
              <div className="register-column-actions">
                <button className="quiet" onClick={() => update("columns", "")}>
                  Default columns
                </button>
                <button
                  className="quiet"
                  onClick={() => update("columns", columns.map((c) => c.key).join(","))}
                >
                  Show all
                </button>
              </div>
            </div>
          )}
        </header>
        {panel !== "filters" && activeFilters > 0 && (
          <div className="register-filter-summary">
            <span>
              {activeFilters} active {activeFilters === 1 ? "filter" : "filters"}
              {from || to ? ` / ${from || "Any date"} to ${to || "Any date"}` : ""}
            </span>
            <button className="quiet" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )}
        <section
          id="register-filters"
          hidden={panel !== "filters"}
          className="register-filter-panel"
          aria-label="Register filters"
        >
          <div className="register-panel-title">
            <strong>Filter records</strong>
            <button className="quiet" onClick={resetFilters}>
              <RotateCcw size={13} />
              Reset filters
            </button>
          </div>
          <div className="register-filters">
            {isBabies && (
              <RegisterSelect
                label="Date to filter"
                value={get("dateField") === "birth" ? "birth" : "admission"}
                onChange={(value) => update("dateField", value)}
                options={[
                  { value: "admission", label: "Admission date" },
                  { value: "birth", label: "Birth date" },
                ]}
              />
            )}
            <DateTimeField
              kind="date"
              label="From date"
              value={from}
              onChange={(value) => update("from", value)}
              onBlur={() => undefined}
              allowClear
            />
            <DateTimeField
              kind="date"
              label="To date"
              value={to}
              onChange={(value) => update("to", value)}
              onBlur={() => undefined}
              allowClear
            />
            {selectFilter(
              "status",
              isBabies ? "Admission status" : "Request status",
              isBabies ? ["Active", "Discharged"] : ["Pending", "Proceeded"],
            )}
            {isBabies ? (
              <>
                {selectFilter("gender", "Gender", ["Male", "Female"])}
                {selectFilter("bloodType", "Blood type", [
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                  "Unknown",
                ])}
              </>
            ) : (
              <>
                {selectFilter("priority", "Priority", ["Routine", "Urgent"])}
                {selectFilter("requestedBy", "Requested by", unique("requestedBy"))}
              </>
            )}
          </div>
        </section>
        {invalidRange && (
          <p role="alert" className="register-filter-summary">
            From date must be on or before To date.
          </p>
        )}
        <div
          className="register-table-scroll"
          role="region"
          aria-label="Scrollable register"
          tabIndex={0}
        >
          <table className="register-table" style={{ minWidth: visibleColumns.length * 120 + 48 }}>
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={
                      sort === column.key
                        ? direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button title={column.label} onClick={() => sortBy(column.key)}>
                      <span>{column.label}</span>
                      {sort === column.key ? (
                        direction === "asc" ? (
                          <ArrowUp size={13} />
                        ) : (
                          <ArrowDown size={13} />
                        )
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </button>
                  </th>
                ))}
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="register-clickable-row"
                  tabIndex={0}
                  aria-label={
                    isBabies ? `Open admission for ${row.name}` : `Open request ${row.id}`
                  }
                  onClick={(event) => {
                    if (
                      (event.target as Element).closest("a, button, input, select, textarea") ||
                      window.getSelection()?.toString()
                    )
                      return;
                    openRow(row);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openRow(row);
                    }
                  }}
                >
                  {visibleColumns.map((column) => (
                    <td key={column.key} title={String(row[column.key] ?? "Not recorded")}>
                      {column.render
                        ? column.render(row)
                        : String(row[column.key] ?? "Not recorded") || "Not recorded"}
                    </td>
                  ))}
                  <td>
                    <Link
                      onClick={(event) => {
                        if (!isBabies && row.status === "Proceeded") {
                          event.preventDefault();
                          setResultId(row.id);
                        }
                      }}
                      className="register-open"
                      to="/admission"
                      state={admissionState(row)}
                      aria-label={
                        isBabies ? `Open admission for ${row.name}` : `Open request ${row.id}`
                      }
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="register-empty">
                    No records match these filters. Adjust the filters or reset to see all records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="register-pagination">
          <span role="status">
            {filtered.length
              ? `${(page - 1) * size + 1}-${Math.min(page * size, filtered.length)}`
              : "0"}{" "}
            of {filtered.length} records
          </span>
          <RegisterSelect
            label="Rows per page"
            value={String(size)}
            onChange={(value) => update("size", value)}
            options={[5, 10, 25, 50].map((n) => ({ value: String(n), label: String(n) }))}
          />
          <div>
            <button
              className="secondary"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => update("page", String(page - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              className="secondary"
              aria-label="Next page"
              disabled={page === pages}
              onClick={() => update("page", String(page + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
      {resultRequest && (
        <WorkflowDialog
          closeOnBackdrop
          title="Lab request results"
          onClose={() => setResultId(null)}
        >
          <RequestResults
            request={resultRequest}
            baby={data.babies.find((b) => b.id === resultRequest.babyId)}
            mother={data.mothers.find((m) => m.id === resultRequest.motherId)}
          />
        </WorkflowDialog>
      )}
    </div>
  );
}
