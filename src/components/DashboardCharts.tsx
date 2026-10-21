import { CalendarDays, ChevronDown, UsersRound, ChartPie } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, type ReactNode } from "react";

import { useRegisters, chartDates, registerLink, inDateRange } from "../hooks/useRegisters";
const ranges = [3, 7, 14, 30];
function RangeFilter({
  title,
  range,
  onChange,
}: {
  title: string;
  range: number;
  onChange: (range: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div
      ref={root}
      className="chart-range-control"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="chart-range-trigger"
        aria-label={title + " range"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <CalendarDays size={14} />
        <span>Last {range} days</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="chart-range-menu" role="menu" aria-label={title + " date range"}>
          {ranges.map((days) => (
            <button
              key={days}
              type="button"
              role="menuitemradio"
              aria-checked={range === days}
              onClick={() => {
                onChange(days);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Last {days} days<span aria-hidden="true">{range === days ? "?" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const statuses = [
  { label: "Pending", color: "#ff96cf" },
  { label: "Proceeded", color: "#b9a1ff" },
];
function ChartCard({
  title,
  subtitle,
  to,
  tone,
  icon,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  to: (range: number) => string;
  tone: string;
  icon: ReactNode;
  children: (range: number) => ReactNode;
  wide?: boolean;
}) {
  const [range, setRange] = useState(7);
  const navigate = useNavigate();
  return (
    <article
      onClick={(event) => {
        if (!(event.target as Element).closest("a, button, select, label, .chart-range-control"))
          navigate(to(range));
      }}
      className={`dashboard-chart chart-${tone} ${wide ? "chart-wide" : ""}`}
    >
      <Link to={to(range)} className="chart-card-link" aria-label={title} />
      <header>
        <span className="chart-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <RangeFilter title={title} range={range} onChange={setRange} />
      </header>
      {children(range)}
    </article>
  );
}
function TrendChart({ bars = false, range }: { bars?: boolean; range: number }) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = useState({ width: 700, height: 180 });
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setPlotSize({ width, height });
    });
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);
  const [hover, setHover] = useState<number | null>(null);
  const navigate = useNavigate();
  const { babies } = useRegisters();
  const dates = chartDates(range);
  const values = dates.map(
    (date) =>
      babies.filter((b) => (bars ? b.birthDate : b.admittedAt.slice(0, 10)) === date).length,
  );
  const labels = dates.map((date) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );
  const openDay = (index: number) =>
    navigate(registerLink(bars ? "birth" : "admission", dates[index], dates[index]));
  const max = Math.max(5, Math.ceil(Math.max(...values) / 5) * 5);
  const { width, height } = plotSize;
  const bottom = height - 25,
    top = 12,
    left = 30,
    right = width - 8;
  const x = (i: number) => left + 30 + (i * (right - left - 75)) / (values.length - 1);
  const y = (n: number) => bottom - (n / max) * (bottom - top);
  const points = values.map((n, i) => [x(i), y(n)]);
  const curve = points
    .map(([px, py], i) =>
      i === 0
        ? `M${px} ${py}`
        : `C${(points[i - 1][0] + px) / 2} ${points[i - 1][1]} ${(points[i - 1][0] + px) / 2} ${py} ${px} ${py}`,
    )
    .join(" ");
  return (
    <div ref={plotRef} className="chart-plot" onMouseLeave={() => setHover(null)}>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${bars ? "Newborn records" : "Daily admissions"}: ${values.map((n, i) => `${labels[i]}: ${n}`).join(", ")}`}
      >
        <defs>
          <linearGradient
            id={bars ? "records-fill" : "admissions-fill"}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor={bars ? "#ff84c7" : "#41bbfe"} stopOpacity={bars ? ".95" : ".5"} />
            <stop offset="1" stopColor={bars ? "#ffc5e4" : "#dff7ff"} stopOpacity=".65" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4]
          .map((tick) => (tick * max) / 4)
          .map((n) => (
            <g key={n}>
              <line x1={left} x2={right} y1={y(n)} y2={y(n)} className="chart-grid-line" />
              <text x={left - 16} y={y(n) + 4} textAnchor="end" className="chart-axis-label">
                {n}
              </text>
            </g>
          ))}
        <path d={`M${left} ${top} V${bottom} H${right}`} className="chart-axis" fill="none" />
        {!bars && (
          <>
            <path
              d={`${curve} L${x(values.length - 1)} ${bottom} L${x(0)} ${bottom} Z`}
              fill="url(#admissions-fill)"
            />
            <path d={curve} stroke="#00aaff" strokeWidth="1.7" fill="none" />
          </>
        )}
        {values.map((n, i) => (
          <g
            key={i}
            tabIndex={0}
            role="link"
            onClick={(e) => {
              e.stopPropagation();
              openDay(i);
            }}
            aria-label={`${labels[i]}: ${n} ${bars ? "records" : "admissions"}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHover(null);
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                openDay(i);
              }
            }}
          >
            {bars ? (
              <rect
                x={x(i) - Math.min(35, ((right - left) / values.length) * 0.3)}
                y={y(n)}
                width={Math.min(70, ((right - left) / values.length) * 0.6)}
                height={bottom - y(n)}
                rx="4"
                fill="url(#records-fill)"
              />
            ) : (
              <circle
                cx={x(i)}
                cy={y(n)}
                r="3.7"
                stroke="#00aaff"
                strokeWidth="1.7"
                fill="var(--surface)"
              />
            )}
            <circle cx={x(i)} cy={y(n)} r="12" fill="transparent" />
            <text x={x(i)} y={y(n) - 12} textAnchor="middle" className="chart-value">
              {n}
            </text>
            {(values.length <= 7 ||
              i % Math.ceil(values.length / 7) === 0 ||
              i === values.length - 1) && (
              <text
                x={x(i)}
                y={height - 5}
                textAnchor="middle"
                className="chart-axis-label chart-x-axis-label"
              >
                {labels[i]}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="chart-tooltip point-tooltip"
          role="tooltip"
          style={{
            left: `${(x(hover) / width) * 100}%`,
            top: `${(y(values[hover]) / height) * 100}%`,
            transform: `translate(${hover > values.length * 0.7 ? "calc(-100% - 10px)" : "10px"}, ${y(values[hover]) < 55 ? "10px" : "calc(-100% - 10px)"})`,
          }}
        >
          <strong>{labels[hover]}</strong>
          <span>
            {bars ? "Newborn records" : "Newborn registrations"}: {values[hover]}
          </span>
        </div>
      )}
    </div>
  );
}
function RequestChart({ range }: { range: number }) {
  const navigate = useNavigate();
  const { requests } = useRegisters();
  const dates = chartDates(range);
  const openStatus = (status: string) =>
    navigate(registerLink("requests", dates[0], dates.at(-1)!, status));
  const [hover, setHover] = useState<string | null>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  function show(label: string, element: Element) {
    const bounds = element.getBoundingClientRect();
    const parent = element.closest(".request-chart-body")!.getBoundingClientRect();
    setAnchor({ x: bounds.left + bounds.width / 2 - parent.left, y: bounds.top - parent.top });
    setHover(label);
  }
  const filtered = statuses.map((status) => ({
    ...status,
    value: requests.filter(
      (r) =>
        r.displayStatus === status.label && inDateRange(r.requestedAt, dates[0], dates.at(-1)!),
    ).length,
  }));
  const total = filtered.reduce((sum, s) => sum + s.value, 0);
  const data = filtered.map((s) => ({
    ...s,
    percent: total ? Math.round((s.value / total) * 100) : 0,
  }));
  const selected = data.find((s) => s.label === hover);
  return (
    <div className="request-chart-body" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox="0 0 200 200"
        className="request-donut"
        role="img"
        aria-label={`${total} total requests: ${data.map((s) => `${s.label} ${s.value}`).join(", ")}`}
      >
        <circle cx="100" cy="100" r="74" fill="none" stroke="var(--border)" strokeWidth="38" />
        {data
          .filter((s) => s.value > 0)
          .map((status, i) => {
            const start = (data.slice(0, i).reduce((sum, s) => sum + s.value, 0) / total) * 100;
            const size = (status.value / total) * 100;
            const angle = ((start + size / 2) * Math.PI) / 50 - Math.PI / 2;
            return (
              <g
                key={status.label}
                tabIndex={0}
                role="link"
                aria-label={`${status.label}: ${status.value}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openStatus(status.label);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    openStatus(status.label);
                  }
                  if (e.key === "Escape") setHover(null);
                }}
                onMouseEnter={(e) => show(status.label, e.currentTarget.querySelector("text")!)}
                onFocus={(e) => show(status.label, e.currentTarget.querySelector("text")!)}
                onBlur={() => setHover(null)}
              >
                <circle
                  cx="100"
                  cy="100"
                  r="74"
                  fill="none"
                  stroke={status.color}
                  strokeWidth="38"
                  pathLength="100"
                  strokeDasharray={`${size} ${100 - size}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 100 100)"
                />
                <text
                  x={100 + 74 * Math.cos(angle)}
                  y={104 + 74 * Math.sin(angle)}
                  textAnchor="middle"
                  className="donut-segment-value"
                >
                  {status.value}
                </text>
              </g>
            );
          })}
        <text x="100" y="94" textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" className="chart-axis-label">
          Total requests
        </text>
      </svg>
      <div className="chart-legend">
        {data.map((s) => (
          <div
            key={s.label}
            role="link"
            tabIndex={0}
            aria-label={`View ${s.label} requests`}
            onClick={(e) => {
              e.stopPropagation();
              openStatus(s.label);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                openStatus(s.label);
              }
            }}
            onMouseEnter={(e) => show(s.label, e.currentTarget)}
            onMouseLeave={() => setHover(null)}
          >
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <span>{s.percent}%</span>
          </div>
        ))}
      </div>
      {selected && (
        <div
          role="tooltip"
          className="chart-tooltip point-tooltip"
          style={{
            left: anchor.x,
            top: anchor.y,
            transform: "translate(10px, calc(-100% - 10px))",
          }}
        >
          <strong>{selected.label}</strong>
          <span>
            {selected.value} requests ({selected.percent}%)
          </span>
        </div>
      )}
    </div>
  );
}
export function DashboardCharts() {
  const target = (kind: "admission" | "birth" | "requests") => (range: number) => {
    const dates = chartDates(range);
    return registerLink(kind, dates[0], dates.at(-1)!);
  };
  return (
    <div className="dashboard-charts">
      <ChartCard
        title="Newborn Registrations"
        subtitle="Daily registration trend"
        to={target("admission")}
        tone="blue"
        icon={<UsersRound size={27} />}
      >
        {(range) => <TrendChart key={range} range={range} />}
      </ChartCard>
      <ChartCard
        title="Lab Requests"
        subtitle="Status distribution"
        to={target("requests")}
        tone="pink"
        icon={<ChartPie size={27} />}
      >
        {(range) => <RequestChart key={range} range={range} />}
      </ChartCard>
    </div>
  );
}
