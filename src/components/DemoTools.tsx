import { useState } from "react";
import { repository } from "../repositories/mockRepository";
import type { FailurePoint } from "../types";
export function DemoTools() {
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<FailurePoint>("none");
  return (
    <div className="demo-tools">
      <button className="text-button" onClick={() => setOpen(!open)} aria-expanded={open}>
        Demo tools
      </button>
      {open && (
        <section className="demo-popover" aria-label="Demo tools">
          <h3>Demo controls</h3>
          <p>Fictional data. Changes last until the page reloads.</p>
          <label htmlFor="failure">Fail the next operation</label>
          <select
            id="failure"
            value={failure}
            onChange={(e) => {
              const value = e.target.value as FailurePoint;
              setFailure(value);
              repository.failure = value;
            }}
          >
            <option value="none">No failure</option>
            <option value="network">Network request</option>
            <option value="creation">Child creation</option>
            <option value="queue">Lab queue update</option>
            <option value="admission">Admission request update</option>
          </select>
          <p>Failures occur once. Retry normally to recover.</p>
          <button className="secondary" onClick={() => window.location.assign("/")}>
            Reset demo data
          </button>
          <details>
            <summary>Service operation log</summary>
            <ul>
              {repository.audit.map((entry, i) => (
                <li key={i}>{entry}</li>
              ))}
            </ul>
            <p>
              {repository.queue.length} queued ·{" "}
              {repository.admissionRequests.filter((r) => r.NewBornSent).length} marked sent
            </p>
          </details>
        </section>
      )}
    </div>
  );
}
