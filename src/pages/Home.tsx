import { CalendarDays, ArrowUp, Minus, ArrowUpRight, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardCharts } from "../components/DashboardCharts";
import { useWorkflowSummary } from "../hooks/useWorkflowSummary";

export function Home() {
  const { readyNewbornRequests, pendingNewbornRequests, urgentNewbornRequests } =
    useWorkflowSummary();
  // Match the existing KPI's fictional demo baseline; counts remain live.
  const proceededDelta = readyNewbornRequests - 0;
  const ProceededTrend = proceededDelta > 0 ? ArrowUp : Minus;
  return (
    <div className="overview-page">
      <section className="overview-banner" aria-label="Overview">
        <img
          className="overview-artwork overview-artwork-light"
          src="/branding/welcome-banner-light.png"
          alt="Baby holding an adult's finger, with hearts and the words Healthy Beginnings, Brighter Tomorrows"
        />
        <img
          className="overview-artwork overview-artwork-dark"
          src="/branding/welcome-banner-dark.png"
          alt="Baby holding an adult's finger, with hearts and the words Healthy Beginnings, Brighter Tomorrows"
        />
        <div className="overview-copy">
          <span className="overview-eyebrow">MOTHER & BABY CARE</span>
          <h2 className="overview-heading">Welcome!</h2>
          <p className="overview-copy">
            Manage newborn registration and lab requests in one place.
          </p>
        </div>
        <div className="overview-stats" role="group" aria-label="Request summary">
          <div className="overview-stat">
            <span className="overview-stat-icon" aria-hidden="true">
              <CalendarDays size={29} strokeWidth={1.8} />
            </span>
            <div className="overview-stat-copy">
              <Link
                className="overview-stat-label"
                to="/lab-request-register?status=Proceeded&linked=yes"
              >
                Proceeded requests
              </Link>
              <div className="overview-stat-line">
                <Link to="/lab-request-register?status=Proceeded&linked=yes">
                  <strong>{readyNewbornRequests}</strong>
                </Link>
                <span
                  className="overview-stat-status"
                  title="Compared with the demo yesterday baseline"
                >
                  <span className="overview-stat-change">
                    <ProceededTrend size={16} aria-hidden="true" />
                    {proceededDelta > 0 ? `+${proceededDelta}` : "0"}
                  </span>{" "}
                  <span className="overview-stat-change-span">from yesterday</span>
                </span>
              </div>
            </div>
          </div>
          <div className="overview-stat overview-stat-pink">
            <span className="overview-stat-icon" aria-hidden="true">
              <FlaskConical size={29} strokeWidth={1.8} />
            </span>
            <div className="overview-stat-copy">
              <Link
                className="overview-stat-label"
                to="/lab-request-register?status=Pending&linked=yes"
              >
                Pending requests
              </Link>
              <div className="overview-stat-line">
                <Link to="/lab-request-register?status=Pending&linked=yes">
                  <strong>{pendingNewbornRequests}</strong>
                </Link>
                <Link
                  to="/lab-request-register?status=Pending&priority=Urgent&linked=yes"
                  className="overview-stat-status overview-stat-urgent"
                >
                  <ArrowUpRight size={16} aria-hidden="true" />
                  {urgentNewbornRequests} urgent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <DashboardCharts />
    </div>
  );
}
