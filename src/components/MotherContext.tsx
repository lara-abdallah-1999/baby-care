import { Baby as BabyIcon, UserRound } from "lucide-react";
import type { Baby, MotherAdmission } from "../types";
import { Badge, formatDate } from "./common";

export function MotherContext({
  mother,
  babies,
  loading,
  error,
  onRetry,
}: {
  mother: MotherAdmission;
  babies: Baby[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <>
      <section className="mother-context" aria-label="Mother admission summary">
        <div className="context-person">
          <span className="patient-avatar">
            <UserRound size={20} />
          </span>
          <div>
            <span className="eyebrow">SELECTED MOTHER</span>
            <h2>
              {mother.middleName
                ? mother.name.replace(/ (\S+)$/, ` ${mother.middleName} $1`)
                : mother.name}
            </h2>
            <span className="mother-mrn">MRN {mother.patientId}</span>
          </div>
          <Badge tone="green">{mother.status}</Badge>
        </div>
        <dl>
          <div>
            <dt>Phone</dt>
            <dd>{mother.phone || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Case number</dt>
            <dd>{mother.caseNumber}</dd>
          </div>
          <div>
            <dt>Admitted</dt>
            <dd>{formatDate(mother.admittedAt)}</dd>
          </div>
          <div>
            <dt>Ward</dt>
            <dd>{mother.ward}</dd>
          </div>
        </dl>
      </section>
      <section className="children-context" aria-label="Recorded children">
        <div className="children-context-heading">
          <h2>All Children / Babies</h2>
          <Badge>{babies.length}</Badge>
        </div>
        <div className="children-context-list" tabIndex={0} aria-label="Recorded children list">
          {loading ? (
            <p role="status">Loading child records…</p>
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <button className="secondary" onClick={onRetry}>
                Retry child records
              </button>
            </div>
          ) : babies.length ? (
            babies.map((baby) => (
              <article key={baby.id}>
                <span className="context-child-icon">
                  <BabyIcon size={18} />
                </span>
                <div>
                  <strong>
                    {[baby.firstName, baby.middleName, baby.lastName].filter(Boolean).join(" ") ||
                      baby.identifier}
                  </strong>
                  <span>
                    {baby.gender} · {baby.birthDate}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p>No previous child records found.</p>
          )}
        </div>
      </section>
    </>
  );
}
