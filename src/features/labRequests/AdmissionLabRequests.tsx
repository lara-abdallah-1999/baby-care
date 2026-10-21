import { useRegisters } from "../../hooks/useRegisters";
import { RequestResults } from "./RequestResults";
import { AdmissionEmptyState } from "../../components/AdmissionEmptyState";
import { Baby as BabyIcon, Check, FlaskConical } from "lucide-react";
import { RequestList } from "./RequestList";
import { useEffect, useRef, useState } from "react";
import type { Baby, LabRequest } from "../../types";
import { processNewbornRequest } from "../../services/workflows";
import { babyFullName } from "../../lib/patientNames";
import { WorkflowDialog } from "../../components/WorkflowDialog";
import { Badge, ErrorState, errorMessage } from "../../components/common";
import { useOperation } from "../../store/operation";
export function AdmissionLabRequests({
  entries,
  selected,
  onSelect,
  loading,
  onProceeded,
  initialRequest,
}: {
  initialRequest?: LabRequest | null;
  entries: { baby: Baby; requests: LabRequest[] }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
  onProceeded: (requestId: string) => void;
}) {
  const { mothers } = useRegisters();
  const visibleEntries = entries.filter((entry) => entry.requests.length);
  const [results, setResults] = useState<LabRequest | null>(null);
  const [requestId, setRequestId] = useState(initialRequest?.id ?? "");
  const [highlightedId, setHighlightedId] = useState(initialRequest?.id ?? "");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!loading && highlightedId)
      root.current
        ?.querySelector<HTMLElement>(".request-highlight")
        ?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [loading, selected, highlightedId]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState("");
  const saving = useOperation((s) => s.saving);
  const entry = entries.find((e) => e.baby.id === selected);
  const request = entry?.requests.find((r) => r.id === requestId);
  async function proceed() {
    if (!entry || !request || useOperation.getState().saving) return;
    useOperation.getState().setSaving(true);
    setError("");
    try {
      await processNewbornRequest(request.id, entry.baby.id);
      setDone(request.id);
      onProceeded(request.id);
      setRequestId("");
      setConfirm(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      useOperation.getState().setSaving(false);
    }
  }
  return (
    <section ref={root} aria-label="Lab Requests">
      {initialRequest && !initialRequest.babyId && (
        <div className="request-row request-highlight">
          <div>
            <strong>{initialRequest.id}</strong>
            <p>
              {(initialRequest.tests?.length ? initialRequest.tests : [initialRequest.test]).join(
                ", ",
              )}
            </p>
            <p>This request is not linked to a child yet.</p>
          </div>
          <Badge tone={initialRequest.status === "Pending" ? "amber" : "green"}>
            {initialRequest.status === "Pending" ? "Pending" : "Proceeded"}
          </Badge>
        </div>
      )}
      {done && <p role="status">Request {done} proceeded and is now moving to action.</p>}
      {error && !confirm && <ErrorState message={error} />}
      {loading ? (
        <p role="status">Loading lab requests...</p>
      ) : (
        <div className={`admission-lab-grid ${request ? "with-review" : ""}`}>
          <section className="request-selection-panel">
            <header>
              <div>
                <h2>Babies & lab requests</h2>
              </div>
              {visibleEntries.length > 0 && (
                <Badge tone="blue">{visibleEntries.length} with requests</Badge>
              )}
            </header>
            {visibleEntries.length > 0 && (
              <div className="lab-selection-step">
                <h3>
                  <span className="lab-selection-number">1</span>Choose a baby
                </h3>
              </div>
            )}
            <div className="baby-list">
              {visibleEntries.map((e) => (
                <button
                  key={e.baby.id}
                  disabled={saving}
                  aria-pressed={selected === e.baby.id}
                  className={`baby-card admission-lab-baby baby-${e.baby.gender.toLowerCase()} ${selected === e.baby.id ? "selected" : ""}`}
                  onClick={() => {
                    onSelect(e.baby.id);
                    setRequestId("");
                    setHighlightedId("");
                    setError("");
                  }}
                >
                  <span className="baby-selection-dot" aria-hidden="true">
                    {selected === e.baby.id && <Check size={13} />}
                  </span>
                  <span className="lab-baby-avatar" aria-hidden="true">
                    <BabyIcon size={23} />
                  </span>
                  <span className="lab-baby-name">
                    <strong>{babyFullName(e.baby)}</strong>
                    <span>
                      {e.baby.gender} / Born {e.baby.birthTime}
                    </span>
                  </span>
                  <span className="baby-count">
                    <Badge tone="amber">
                      {e.requests.length} {e.requests.length === 1 ? "request" : "requests"}
                    </Badge>
                  </span>
                </button>
              ))}
              {!visibleEntries.length && !error && (
                <AdmissionEmptyState
                  icon={FlaskConical}
                  title="No lab requests yet"
                  description={
                    entries.length
                      ? "Lab requests linked to this admission's children will appear here, ready to review and process."
                      : "Once children are registered and have linked lab requests, you can review them here."
                  }
                />
              )}
            </div>
            {!entry && visibleEntries.length > 0 && (
              <div className="pending-section">
                <div className="lab-selection-step">
                  <h3>
                    <span className="lab-selection-number">2</span>Select a lab request for this
                    baby
                  </h3>
                </div>
                <div className="choose-baby-empty">
                  <AdmissionEmptyState
                    icon={BabyIcon}
                    title="Choose a baby"
                    description="Select a baby above to see their lab requests here."
                  />
                </div>
              </div>
            )}
            {entry && (
              <div className="pending-section">
                <div className="lab-selection-step">
                  <h3>
                    <span className="lab-selection-number">2</span>Select a lab request for this
                    baby
                  </h3>
                  <span className="lab-selection-count">
                    {entry.requests.length} {entry.requests.length === 1 ? "request" : "requests"}
                  </span>
                </div>
                <RequestList
                  showIcon
                  highlightedId={highlightedId}
                  requests={entry.requests.filter((r) => r.status === "Pending")}
                  selectedId={requestId}
                  disabled={saving}
                  onSelect={(r) => {
                    setRequestId(r.id);
                    setHighlightedId("");
                    setError("");
                  }}
                  onProceed={() => setConfirm(true)}
                />
                {entry.requests
                  .filter((r) => r.status === "Ready")
                  .map((r) => (
                    <button
                      type="button"
                      onClick={() => setResults(r)}
                      className={`request-row ${highlightedId === r.id ? "request-highlight" : ""}`}
                      key={r.id}
                    >
                      <strong>{r.id}</strong>
                      <Badge tone="green">Proceeded ? View results</Badge>
                    </button>
                  ))}
              </div>
            )}
          </section>
          {entry && request && (
            <aside className="review-panel compact-request-review">
              <div className="review-heading">
                <span className="eyebrow">
                  {request.status === "Ready" ? "PROCEEDED" : "BEFORE YOU PROCEED"}
                </span>
                <h2>{request.status === "Ready" ? "Request details" : "Request review"}</h2>
              </div>
              <dl className="review-details">
                <div>
                  <dt>Request</dt>
                  <dd>{request.id}</dd>
                </div>
                <div className="procedures-stacked">
                  <dt>Procedures</dt>
                  <dd>
                    <ul className="review-procedures">
                      {(request.tests?.length ? request.tests : [request.test]).map((test, i) => (
                        <li key={i}>{test}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Requested by</dt>
                  <dd>{request.requestedBy}</dd>
                </div>
                <div>
                  <dt>Gender / weight</dt>
                  <dd>
                    {entry.baby.gender} / {entry.baby.weight} kg
                  </dd>
                </div>
                <div>
                  <dt>Birth date / time</dt>
                  <dd>
                    {entry.baby.birthDate} / {entry.baby.birthTime}
                  </dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      )}
      {confirm && entry && request && (
        <WorkflowDialog
          title="Confirm request"
          busy={saving}
          onClose={() => {
            setConfirm(false);
            setError("");
          }}
        >
          <p>
            Proceed with {request.id} for {babyFullName(entry.baby)}?
          </p>
          <ul>
            {(request.tests?.length ? request.tests : [request.test]).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          {error && <ErrorState message={error} />}
          <div className="dialog-actions">
            <button className="secondary" disabled={saving} onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button className="primary" disabled={saving} onClick={proceed}>
              {saving ? "Processing..." : error ? "Retry Proceed" : "Confirm and proceed"}
            </button>
          </div>
        </WorkflowDialog>
      )}
      {results && (
        <WorkflowDialog
          closeOnBackdrop
          title="Lab request results"
          onClose={() => setResults(null)}
        >
          <RequestResults
            request={results}
            baby={entries.find((e) => e.baby.id === results.babyId)?.baby}
            mother={mothers.find((m) => m.id === results.motherId)}
          />
        </WorkflowDialog>
      )}
    </section>
  );
}
