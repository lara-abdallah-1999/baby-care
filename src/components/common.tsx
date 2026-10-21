import {
  Check,
  CheckCircle2,
  Search,
  ArrowRight,
  AlertCircle,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import type { MotherAdmission } from "../types";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function SearchField({
  label,
  placeholder,
  onSearch,
  busy,
  onClear,
}: {
  label: string;
  placeholder: string;
  onSearch: (query: string) => void;
  busy: boolean;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  }
  return (
    <form onSubmit={submit} className="search-form">
      <label htmlFor="patient-search">{label}</label>
      <div className="search-line">
        <div className="input-icon">
          <Search size={17} />
          <input
            id="patient-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={busy}
          />
        </div>
        <button className="primary" disabled={busy || !query.trim()}>
          {busy ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}
          Search
        </button>
        <button
          type="button"
          className="quiet"
          disabled={busy}
          onClick={() => {
            setQuery("");
            onClear();
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
export function MotherSummary({ mother }: { mother: MotherAdmission }) {
  return (
    <section className="mother-summary" aria-label="Mother admission summary">
      <div className="patient-avatar">
        <UserRound size={23} />
      </div>
      <div className="patient-name">
        <span className="eyebrow">Mother’s admission</span>
        <h2>{mother.name}</h2>
        <span>{mother.patientId}</span>
      </div>
      <dl>
        <div>
          <dt>Case number</dt>
          <dd>{mother.caseNumber}</dd>
        </div>
        <div>
          <dt>Admission</dt>
          <dd>{mother.admissionNumber}</dd>
        </div>
        <div>
          <dt>Admitted</dt>
          <dd>{formatDate(mother.admittedAt)}</dd>
        </div>
        <div>
          <dt>Ward / department</dt>
          <dd>{mother.ward}</dd>
        </div>
      </dl>
      <Badge tone={mother.status === "Active" ? "green" : "neutral"}>{mother.status}</Badge>
    </section>
  );
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Search size={24} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="skeletons" role="status" aria-label="Loading">
      <div />
      <div />
      <div />
    </div>
  );
}
export function SuccessState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="success" role="status">
      <div className="success-icon">
        <CheckCircle2 size={28} />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function WorkflowProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="progress" aria-label="Workflow progress">
      {steps.map((step, i) => (
        <li
          key={step}
          className={i === current ? "current" : i < current ? "complete" : ""}
          aria-current={i === current ? "step" : undefined}
        >
          <span>{i < current ? <Check size={12} /> : i + 1}</span>
          {step}
          {i < steps.length - 1 && <ArrowRight size={13} className="step-arrow" />}
        </li>
      ))}
    </ol>
  );
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
