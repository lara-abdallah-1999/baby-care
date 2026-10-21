import { ChildrenColumns, defaultChildrenColumns } from "../components/ChildrenColumns";
import { AdmissionEmptyState } from "../components/AdmissionEmptyState";
import { flushSync } from "react-dom";
import { useEffect, useState } from "react";
import {
  Pencil,
  ArrowRight,
  PlusCircle,
  UsersRound,
  FlaskConical,
  Baby as BabyIcon,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import type { Baby, LabRequest, MotherAdmission } from "../types";
import { admissionService } from "../services/workflows";
import { MotherSummary } from "../features/admission/MotherSummary";
import { AdmissionSearch } from "../features/admission/AdmissionSearch";
import { BraceletPanel } from "../components/BraceletPanel";
import { ChildrenTable } from "../features/admission/ChildrenTable";
import { ChildEditor } from "../features/admission/ChildEditor";
import { AdmissionLabRequests } from "../features/labRequests/AdmissionLabRequests";
import { ErrorState } from "../components/common";
import { useOperation } from "../store/operation";
import { useWorkflow } from "../store/workflow";
const tabs = [
  { id: "add", label: "Add Baby", icon: PlusCircle },
  { id: "view", label: "View Children", icon: UsersRound },
  { id: "lab", label: "Lab Requests", icon: FlaskConical },
] as const;
export function Admission() {
  const location = useLocation();
  return <AdmissionWorkspace key={location.key} />;
}
function AdmissionWorkspace() {
  const location = useLocation();
  const target = location.state as {
    motherId?: string;
    tab?: string;
    babyId?: string;
    requestId?: string;
  } | null;
  const [initial] = useState(() => admissionService.getWorkspaceSnapshot(target?.motherId ?? ""));
  const initialRequest =
    initial.requests.find((request) => request.id === target?.requestId) ?? null;
  const [highlightedChild, setHighlightedChild] = useState(
    target?.tab === "view" ? (target.babyId ?? "") : "",
  );
  const [editing, setEditing] = useState(false);
  const [visibleChildrenColumns, setVisibleChildrenColumns] =
    useState<readonly string[]>(defaultChildrenColumns);
  const [mother, setMother] = useState<MotherAdmission | null>(initial.mother);
  const [entries, setEntries] = useState<{ baby: Baby; requests: LabRequest[] }[]>(initial.entries);
  const babies = entries.map((entry) => entry.baby);
  const [targetRequest, setTargetRequest] = useState<LabRequest | null>(initialRequest);
  const [selectedBaby, setSelectedBaby] = useState<string | null>(initialRequest?.babyId ?? null);
  const [tab, setTab] = useState<string>(
    target?.tab === "view" || target?.tab === "lab" ? target.tab : "add",
  );
  const [count, setCount] = useState("1");
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [batch, setBatch] = useState(0);
  const [error, setError] = useState("");
  const loading = false;
  const [print, setPrint] = useState<Baby | "mother" | null>(null);
  const saving = useOperation((s) => s.saving);
  useEffect(() => {
    const done = () => setPrint(null);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);
  function printBracelet(target: Baby | "mother") {
    flushSync(() => setPrint(target));
    window.print();
  }
  function reset() {
    if (saving) return;
    setEditing(false);
    setHighlightedChild("");
    setMother(null);
    setEntries([]);
    setSelectedBaby(null);
    setTargetRequest(null);
    setTab("add");
    setCount("1");
    setConfirmed(null);
    setPrint(null);
    setError("");
    useWorkflow.getState().reset();
  }
  function select(m: MotherAdmission) {
    reset();
    if (m.status !== "Active") {
      setError("No active admission found. Please direct parents to reception.");
      return;
    }
    setMother(m);
    setEntries(admissionService.getWorkspaceSnapshot(m.id).entries);
  }
  function created(records: Baby[]) {
    setEntries((current) =>
      records.map((baby) => ({
        baby,
        requests: current.find((entry) => entry.baby.id === baby.id)?.requests ?? [],
      })),
    );
    setEditing(false);
    setConfirmed(null);
    setCount("1");
    setBatch((b) => b + 1);
    setTab("view");
  }
  if (!mother)
    return <AdmissionSearch saving={saving} error={error} onSelect={select} onError={setError} />;
  return (
    <div className="record-page admission-workspace">
      <MotherSummary
        mother={mother}
        saving={saving}
        onReset={reset}
        onPrint={() => printBracelet("mother")}
      />
      <div className="admission-body">
        <nav className="admission-nav" aria-label="Admission workflow">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "step" : undefined}
              disabled={saving || (id === "add" && mother.status !== "Active")}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div
          className={`admission-work-area ${tab === "add" && !confirmed && !babies.length ? "showing-count-setup" : ""} ${tab === "lab" ? "showing-lab-requests" : (tab === "add" && confirmed) || (tab === "view" && editing) ? "showing-newborn-form" : ""}`}
        >
          {error && (
            <>
              <ErrorState message={error} />
              <button
                className="secondary"
                onClick={() => {
                  setError("");
                  setEntries(admissionService.getWorkspaceSnapshot(mother.id).entries);
                }}
              >
                Retry loading admission data
              </button>
            </>
          )}
          <section hidden={tab !== "add"} aria-label="Add Baby">
            {babies.length > 0 ? (
              <div className="registered-children-message">
                <UsersRound size={28} />
                <h2>Children already registered</h2>
                <p>
                  {babies.length} {babies.length === 1 ? "child has" : "children have"} been
                  registered for case {mother.caseNumber}. To correct their details or the number of
                  children, use Edit children in View Children.
                </p>
                <button className="secondary" onClick={() => setTab("view")}>
                  Go to View Children
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {!confirmed && (
                  <>
                    <h2>Add Baby</h2>
                    <p>Enter the number of newborns and complete their information.</p>
                  </>
                )}
                {!confirmed ? (
                  <div className="baby-count-setup">
                    <svg
                      className="baby-count-art"
                      viewBox="0 0 800 220"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M0 220H800V20C720 20 734 120 620 125S520 65 430 120S290 210 180 220Z" />
                      <path d="M0 220H800V150C710 180 656 122 590 118S460 192 340 220Z" />
                    </svg>
                    <form
                      className="baby-count-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          Number.isInteger(Number(count)) &&
                          Number(count) > 0 &&
                          Number(count) <= 20
                        ) {
                          setConfirmed(Number(count));
                          setBatch((b) => b + 1);
                        }
                      }}
                    >
                      <div className="baby-count-controls">
                        <label>
                          Number of babies
                          <input
                            type="number"
                            min="1"
                            max="20"
                            step="1"
                            required
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                          />
                        </label>
                        <button className="primary">Confirm count</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <ChildEditor
                    key={`${mother.id}-${batch}`}
                    mother={mother}
                    batchCount={confirmed}
                    onCreated={created}
                    onBusyChange={useOperation.getState().setSaving}
                  />
                )}
              </>
            )}
          </section>
          <section hidden={tab !== "view"} aria-label="View Children">
            {editing ? (
              <ChildEditor
                key={`edit-${mother.id}`}
                mother={mother}
                batchCount={babies.length}
                existingChildren={babies}
                onCreated={created}
                onCancel={() => setEditing(false)}
                onBusyChange={useOperation.getState().setSaving}
              />
            ) : (
              <>
                <div className="children-view-heading">
                  <h2>View Children</h2>
                  {babies.length > 0 && (
                    <div className="children-view-actions">
                      <button
                        className="secondary"
                        disabled={saving || mother.status !== "Active"}
                        onClick={() => setEditing(true)}
                      >
                        <Pencil size={15} />
                        Edit children
                      </button>
                      <ChildrenColumns
                        selected={visibleChildrenColumns}
                        onChange={setVisibleChildrenColumns}
                      />
                    </div>
                  )}
                </div>
                {loading ? (
                  <p role="status">Loading children...</p>
                ) : !babies.length ? (
                  <AdmissionEmptyState
                    icon={BabyIcon}
                    title="No children registered yet"
                    description="Newborn details will appear here once children are added to this admission."
                  >
                    {mother.status === "Active"}
                  </AdmissionEmptyState>
                ) : (
                  <ChildrenTable
                    entries={entries}
                    columns={visibleChildrenColumns}
                    highlightedChild={highlightedChild}
                    saving={saving}
                    onPrint={printBracelet}
                    onOpenRequests={(babyId) => {
                      setSelectedBaby(babyId);
                      setTab("lab");
                    }}
                  />
                )}
              </>
            )}
          </section>
          <div hidden={tab !== "lab"}>
            <AdmissionLabRequests
              key={`${mother.id}-${location.key}`}
              initialRequest={targetRequest}
              entries={entries}
              selected={selectedBaby}
              onSelect={setSelectedBaby}
              loading={loading}
              onProceeded={(requestId) =>
                setEntries((current) =>
                  current.map((entry) => ({
                    ...entry,
                    requests: entry.requests.map((request) =>
                      request.id === requestId ? { ...request, status: "Ready" } : request,
                    ),
                  })),
                )
              }
            />
          </div>
        </div>
      </div>
      {print && <BraceletPanel mother={mother} baby={print === "mother" ? undefined : print} />}
    </div>
  );
}
