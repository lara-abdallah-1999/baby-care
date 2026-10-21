import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Baby as BabyIcon, Check } from "lucide-react";
import {
  admissionService,
  labRequestService,
  processNewbornRequest,
} from "../../services/workflows";
import { useOperation } from "../../store/operation";
import { useWorkflow } from "../../store/workflow";
import type { Baby, LabRequest, MotherAdmission } from "../../types";
import {
  Badge,
  EmptyState,
  ErrorState,
  errorMessage,
  LoadingSkeleton,
  MotherSummary,
  Panel,
  SearchField,
  WorkflowProgress,
} from "../../components/common";
import { RequestList } from "./RequestList";

interface BabyWithRequests {
  baby: Baby;
  requests: LabRequest[];
}
export function NewbornRequests({
  mother: suppliedMother,
  refreshKey = 0,
}: { mother?: MotherAdmission; refreshKey?: number } = {}) {
  const navigate = useNavigate();
  const { selection: s, setMother, setBaby, setRequest, setStage, reset } = useWorkflow();
  const [babies, setBabies] = useState<BabyWithRequests[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [inactive, setInactive] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const searchVersion = useRef(0);
  const processing = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    reset();
    return () => {
      mounted.current = false;
    };
  }, [reset]);
  useEffect(() => {
    if (!suppliedMother) return;
    let active = true;
    reset();
    setMother(suppliedMother);
    setBusy(true);
    setError("");
    setBabies([]);
    labRequestService
      .getRequestsForMother(suppliedMother.id)
      .then((entries) =>
        entries.map((entry) => ({
          ...entry,
          requests: entry.requests.filter((request) => request.status === "Pending"),
        })),
      )
      .then((entries) => {
        if (active) setBabies(entries);
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [suppliedMother, refreshKey, loadAttempt, reset, setMother]);
  function clear() {
    searchVersion.current++;
    reset();
    setBabies([]);
    setError("");
    setSearched(false);
    setInactive(false);
  }
  async function search(query: string) {
    clear();
    const version = searchVersion.current;
    setBusy(true);
    try {
      const mother = await admissionService.searchMotherByCaseNumber(query);
      if (version !== searchVersion.current || !mounted.current) return;
      setSearched(true);
      if (mother?.status === "Discharged") {
        setInactive(true);
        return;
      }
      if (mother) {
        const entries = (await labRequestService.getRequestsForMother(mother.id)).map((entry) => ({
          ...entry,
          requests: entry.requests.filter((request) => request.status === "Pending"),
        }));
        if (version !== searchVersion.current || !mounted.current) return;
        setMother(mother);
        setBabies(entries);
      }
    } catch (e) {
      if (version === searchVersion.current && mounted.current) setError(errorMessage(e));
    } finally {
      if (version === searchVersion.current && mounted.current) setBusy(false);
    }
  }
  async function proceed() {
    if (s.stage !== "review" || processing.current) return;
    processing.current = true;
    setError("");
    setStage("processing");
    useOperation.getState().setSaving(true);
    try {
      const request = await processNewbornRequest(s.request.id, s.baby.id);
      if (mounted.current) {
        setStage("ready", request);
        navigate("/request-proceeded", { state: { requestId: request.id } });
      }
    } catch (e) {
      if (mounted.current) {
        setStage("review", s.request);
        setError(errorMessage(e));
      }
    } finally {
      processing.current = false;
      useOperation.getState().setSaving(false);
    }
  }
  const locked = s.stage === "processing";
  const ready = s.stage === "ready";
  const actionable = babies.filter((b) => b.requests.length);
  const selectedRequests =
    "baby" in s ? (babies.find((b) => b.baby.id === s.baby.id)?.requests ?? []) : [];
  return (
    <>
      {!suppliedMother && (
        <WorkflowProgress
          steps={["Search mother", "Select baby", "Select request", "Review", "Ready"]}
          current={
            s.stage === "search"
              ? 0
              : s.stage === "baby"
                ? 1
                : s.stage === "request"
                  ? 2
                  : ready
                    ? 4
                    : 3
          }
        />
      )}
      {!suppliedMother && !locked && !ready && (
        <Panel title="Search for Mother According to Case Number">
          <SearchField
            label="Case number"
            placeholder="e.g. CASE-2026-00128"
            busy={busy}
            onSearch={search}
            onClear={clear}
          />
          <div className="search-hint">
            Demo: 00127 · single baby / 00128 · twins / 00129 · triplets (use full case number)
          </div>
        </Panel>
      )}
      {busy && <LoadingSkeleton />}
      {error && <ErrorState message={error} />}{" "}
      {suppliedMother && error && s.stage === "baby" && !busy && (
        <button className="secondary" onClick={() => setLoadAttempt((value) => value + 1)}>
          Retry loading requests
        </button>
      )}
      {searched && s.stage === "search" && !busy && !error && (
        <EmptyState title={inactive ? "No active admission found" : "Mother not found"}>
          {inactive
            ? "This admission is discharged. Search for an active mother’s admission."
            : "Check the full case number and try again."}
        </EmptyState>
      )}
      {!suppliedMother && "mother" in s && <MotherSummary mother={s.mother} />}{" "}
      {ready
        ? null
        : !busy &&
          !(suppliedMother && error && s.stage === "baby") &&
          "mother" in s && (
            <div className={`lab-workspace ${"request" in s ? "has-request" : "no-request"}`}>
              <Panel
                title="Babies & pending requests"
                description={`${babies.length} ${babies.length === 1 ? "baby" : "babies"} linked to this admission`}
                action={<Badge tone="blue">{actionable.length} with requests</Badge>}
              >
                {babies.length === 0 ? (
                  <EmptyState title="No babies recorded">
                    No baby records are linked to this mother.
                  </EmptyState>
                ) : actionable.length === 0 ? (
                  <EmptyState title="No pending requests">
                    The babies linked to this mother have no pending lab requests.
                  </EmptyState>
                ) : (
                  <div className="baby-list">
                    {actionable.map(({ baby, requests }) => (
                      <button
                        className={`baby-card baby-${baby.gender.toLowerCase()} ${"baby" in s && s.baby.id === baby.id ? "selected" : ""}`}
                        key={baby.id}
                        disabled={locked}
                        aria-pressed={"baby" in s && s.baby.id === baby.id}
                        onClick={() => {
                          setBaby(baby);
                          setError("");
                        }}
                      >
                        <span className="baby-selection-dot" aria-hidden="true">
                          {"baby" in s && s.baby.id === baby.id ? <Check size={13} /> : null}
                        </span>
                        <span className="baby-icon">
                          <BabyIcon size={20} />
                        </span>
                        <div>
                          <strong>
                            {[baby.firstName, baby.middleName, baby.lastName]
                              .filter(Boolean)
                              .join(" ") || baby.identifier}
                          </strong>
                          <span>
                            {baby.gender} · Born {baby.birthTime}
                          </span>
                        </div>
                        <div className="baby-count">
                          <Badge tone="amber">{requests.length} pending</Badge>
                          <span className="baby-select-label">
                            {"baby" in s && s.baby.id === baby.id ? "Selected" : "Select baby"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {babies.length > actionable.length && (
                  <p className="muted-note">
                    {babies.length - actionable.length}{" "}
                    {babies.length - actionable.length === 1 ? "baby has" : "babies have"} no
                    pending requests.
                  </p>
                )}
                {"baby" in s && (
                  <div className="pending-section">
                    <h3>Select the request that will Start Processing</h3>
                    <RequestList
                      onProceed={proceed}
                      retry={!!error}
                      requests={selectedRequests}
                      selectedId={"request" in s ? s.request.id : undefined}
                      disabled={locked}
                      onSelect={(r) => {
                        setRequest(r);
                        setError("");
                      }}
                    />
                  </div>
                )}
              </Panel>
              {"request" in s && (
                <aside className="review-panel compact-request-review" aria-label="Request review">
                  <div className="review-heading">
                    <span className="eyebrow">BEFORE YOU PROCEED</span>
                    <h2>Request review</h2>
                  </div>
                  <dl className="review-details">
                    <div>
                      <dt>Request</dt>
                      <dd>{s.request.id}</dd>
                    </div>
                    <div className="procedures-stacked">
                      <dt>Procedures</dt>
                      <dd>
                        <ul className="review-procedures">
                          {(s.request.tests?.length ? s.request.tests : [s.request.test]).map(
                            (test, i) => (
                              <li key={i}>{test}</li>
                            ),
                          )}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt>Requested by</dt>
                      <dd>{s.request.requestedBy}</dd>
                    </div>

                    <div>
                      <dt>Gender / weight</dt>
                      <dd>
                        {s.baby.gender} / {s.baby.weight} kg
                      </dd>
                    </div>
                    <div>
                      <dt>Birth date / time</dt>
                      <dd>
                        {s.baby.birthDate} / {s.baby.birthTime}
                      </dd>
                    </div>
                  </dl>
                  {locked && (
                    <p className="muted-note" role="status">
                      Preparing the request. Please wait.
                    </p>
                  )}
                </aside>
              )}
            </div>
          )}
      {s.stage === "search" && !searched && !busy && !error && (
        <EmptyState title="Find the mother to see her babies">
          Search by the full case number to view babies and their pending requests.
        </EmptyState>
      )}
    </>
  );
}
