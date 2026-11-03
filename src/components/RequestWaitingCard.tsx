import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { chartDates, useRegisters } from "../hooks/useRegisters";
import { DateTimeField } from "./DateTimeField";

export function RequestWaitingCard() {
  const { requests } = useRegisters();
  const [date, setDate] = useState(() => chartDates(1)[0]);
  const navigate = useNavigate();
  const processed = requests.filter(
    (request) =>
      request.status === "Ready" && (!date || request.proceededAt?.slice(0, 10) === date),
  );
  const withResults = processed.filter((request) => (request.results?.length ?? 0) > 0).length;
  const percentage = processed.length ? Math.round((withResults / processed.length) * 100) : 0;
  const params = new URLSearchParams({ status: "Proceeded" });
  if (date) {
    params.set("dateField", "proceeded");
    params.set("from", date);
    params.set("to", date);
  }
  const to = `/lab-request-register?${params}`;
  const groups = [
    { label: "With results", count: withResults, tone: "available" },
    { label: "Without results", count: processed.length - withResults, tone: "pending" },
  ];
  return (
    <section
      className="dashboard-chart chart-blue request-waiting-card"
      aria-label="Processed request results"
      onClick={(event) => {
        if (!(event.target as Element).closest("a, button, input, label, .results-date-filter"))
          navigate(to);
      }}
    >
      <header>
        <span className="chart-icon">
          <FlaskConical size={18} />
        </span>
        <div>
          <h3>Processed request results</h3>
          <p>{date ? `Proceeded on ${date}` : "All proceeded requests"}</p>
        </div>
        <div className="results-date-filter">
          <DateTimeField
            kind="date"
            label="Proceeded date"
            value={date}
            onChange={setDate}
            onBlur={() => undefined}
          />
        </div>
        {date && (
          <button className="quiet" onClick={() => setDate("")}>
            All dates
          </button>
        )}
      </header>
      <div className="processed-results-body">
        <div className="waiting-summary">
          <span className="results-total-label">Total proceeded</span>
          <div className="results-total-values">
            <strong>{processed.length}</strong>
            <span
              className="results-total-percentage"
              aria-label={`${percentage}% have results available`}
            >
              {percentage}% <small>with results</small>
            </span>
          </div>
          {!processed.length && <span className="waiting-note">No processed requests yet</span>}
        </div>
        <div className="waiting-bars">
          {groups.map((group) => (
            <Link
              className="waiting-row"
              key={group.label}
              to={`${to}&results=${group.tone === "available" ? "available" : "unavailable"}`}
            >
              <span>{group.label}</span>
              <div className={`waiting-track results-${group.tone}`} aria-hidden="true">
                <span
                  style={{
                    width: `${processed.length ? (group.count / processed.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <strong>{group.count}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
