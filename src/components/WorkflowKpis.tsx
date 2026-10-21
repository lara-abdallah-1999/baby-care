import {
  ArrowUp,
  ArrowDown,
  Minus,
  Baby,
  ClipboardList,
  FlaskConical,
  UsersRound,
} from "lucide-react";
import { useWorkflowSummary } from "../hooks/useWorkflowSummary";

const metrics = [
  {
    key: "activeAdmissions",
    label: "Baby admissions",
    icon: UsersRound,
    tone: "blue",
    note: "Currently admitted",
  },
  {
    key: "newbornRecords",
    label: "Newborn records",
    icon: Baby,
    tone: "pink",
    note: "Linked child records",
  },
  {
    key: "readyNewbornRequests",
    label: "Proceeded requests",
    icon: ClipboardList,
    tone: "blue",
    note: "Prepared successfully",
  },
  {
    key: "pendingNewbornRequests",
    label: "Pending requests",
    icon: FlaskConical,
    tone: "pink",
    note: "Pending preparation",
  },
] as const;
// Fictional daily snapshots for the demo; the final point is always the live count.
const demoHistory = {
  activeAdmissions: [1, 2, 2, 3, 2, 3],
  newbornRecords: [1, 2, 3, 3, 4, 4],
  readyNewbornRequests: [0, 0, 0, 0, 0, 0],
  pendingNewbornRequests: [2, 3, 4, 3, 4, 4],
};
export function WorkflowKpis() {
  const summary = useWorkflowSummary();
  return (
    <section className="workflow-kpis" aria-label="Workflow summary">
      {metrics.map(({ key, label, icon: Icon, tone }) => {
        const history = [...demoHistory[key], summary[key]];
        const delta = summary[key] - history[history.length - 2];
        const Trend = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
        const max = Math.max(...history, 1);
        const points = history.map((value, i) => `${i * 12},${37 - (value / max) * 30}`).join(" ");
        return (
          <article className={`kpi-card kpi-${tone}`} key={key}>
            <span className="kpi-icon" aria-hidden="true">
              <Icon size={23} strokeWidth={1.7} />
            </span>
            <div className="kpi-copy">
              <div className="kpi-heading">{label}</div>
              <strong className="kpi-value">{summary[key]}</strong>
              <span className="kpi-note kpi-trend">
                <Trend size={12} />
                {delta === 0
                  ? "No change"
                  : `${Math.abs(delta)} ${delta > 0 ? "more" : "fewer"}`}{" "}
                <span>from yesterday</span>
              </span>
            </div>
            <svg
              className="kpi-sparkline"
              viewBox="0 0 74 42"
              role="img"
              aria-label={`Demo trend: ${history.join(", ")}`}
            >
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </article>
        );
      })}
    </section>
  );
}
