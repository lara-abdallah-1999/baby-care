import { babyFullName, motherFullName } from "../../lib/patientNames";
import { Clock3, FlaskConical, CheckCircle2, HeartPulse } from "lucide-react";
import type { Baby, MotherAdmission, LabRequest } from "../../types";
import { Badge, formatDate } from "../../components/common";

export function RequestResults({
  request,
  baby,
  mother,
}: {
  request: LabRequest;
  baby?: Baby;
  mother?: MotherAdmission;
}) {
  const results = request.results ?? [];
  const status = results.length
    ? "Results available"
    : request.resultStatus === "Results available"
      ? "Awaiting results"
      : (request.resultStatus ?? "Awaiting results");
  const procedures = request.tests?.length ? request.tests : [request.test];
  return (
    <section className="lab-result-details" aria-label="Lab results">
      <section className="result-baby-summary" aria-label="Baby and request details">
        <div className="result-summary-heading">
          <div className="result-patient-identity">
            <span className="result-patient-icon" aria-hidden="true">
              <HeartPulse size={24} strokeWidth={1.6} />
            </span>
            <div>
              <span className="eyebrow">BABY & REQUEST DETAILS</span>
              <h3>{baby ? babyFullName(baby) : "Baby not linked"}</h3>
            </div>
          </div>
          <span className={`results-available-tag ${results.length ? "" : "results-pending-tag"}`}>
            {results.length ? (
              <CheckCircle2 size={14} aria-hidden="true" />
            ) : (
              <Clock3 size={14} aria-hidden="true" />
            )}
            {status}
          </span>
        </div>
        <dl>
          {baby ? (
            <>
              <div>
                <dt>MRN</dt>
                <dd>{baby.mrn || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Mother</dt>
                <dd>{mother ? motherFullName(mother) : "Not recorded"}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{baby.gender}</dd>
              </div>
              <div>
                <dt>Birth date / time</dt>
                <dd>
                  {baby.birthDate} / {baby.birthTime}
                </dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{baby.weight} kg</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>{baby.height ? `${baby.height} cm` : "Not recorded"}</dd>
              </div>
              <div>
                <dt>Head circumference</dt>
                <dd>{baby.headCircumference ? `${baby.headCircumference} cm` : "Not recorded"}</dd>
              </div>
              <div>
                <dt>Maturity</dt>
                <dd>{baby.maturityStatus || "Not recorded"}</dd>
              </div>
            </>
          ) : (
            <div>
              <dt>Baby</dt>
              <dd>No linked baby record</dd>
            </div>
          )}
          <div>
            <dt>Request</dt>
            <dd>{request.id}</dd>
          </div>
          <div>
            <dt>Requested by</dt>
            <dd>{request.requestedBy}</dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>{formatDate(request.requestedAt)}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>
              <Badge tone={request.priority === "Urgent" ? "amber" : "blue"}>
                {request.priority}
              </Badge>
            </dd>
          </div>
        </dl>
        {baby?.maturityNotes && <p>Clinical notes: {baby.maturityNotes}</p>}
      </section>
      <section className="request-results-card" aria-label={`Results for ${request.id}`}>
        <div className="request-results-heading">
          <span className="request-results-icon" aria-hidden="true">
            <FlaskConical size={21} strokeWidth={1.7} />
          </span>
          <h3>{request.id}</h3>
        </div>
        <div
          className="lab-results-table-scroll"
          role="region"
          aria-label="Scrollable results"
          tabIndex={0}
        >
          <table className="lab-results-table" aria-label="Procedure results">
            <thead>
              <tr>
                <th scope="col">Procedure / test</th>
                <th scope="col">Result</th>
                <th scope="col">Unit</th>
                <th scope="col">Reference range</th>
                <th scope="col">Reported</th>
              </tr>
            </thead>
            <tbody>
              {results.length
                ? results.map((result, i) => (
                    <tr key={i}>
                      <th scope="row">{result.test}</th>
                      <td className="result-value">{result.value}</td>
                      <td>{result.unit || "\u2014"}</td>
                      <td>{result.referenceRange || "Not provided"}</td>
                      <td>{result.reportedAt ? formatDate(result.reportedAt) : "Not recorded"}</td>
                    </tr>
                  ))
                : procedures.map((test, i) => (
                    <tr key={i}>
                      <th scope="row">{test}</th>
                      <td className="result-pending">
                        <span className="result-pending-status">
                          <Clock3 size={15} aria-hidden="true" />
                          {status}
                        </span>
                      </td>
                      <td className="result-placeholder">&mdash;</td>
                      <td className="result-placeholder">&mdash;</td>
                      <td className="result-placeholder">&mdash;</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
