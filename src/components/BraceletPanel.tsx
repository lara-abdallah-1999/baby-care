import { createPortal } from "react-dom";
import type { Baby, MotherAdmission } from "../types";
import { babyFullName, motherFullName } from "../lib/patientNames";
export function BraceletPanel({ mother, baby }: { mother: MotherAdmission; baby?: Baby }) {
  const dateTime = baby ? `${baby.birthDate}T${baby.birthTime}` : mother.admittedAt;
  const [date, time] = dateTime.split("T");
  return createPortal(
    <div className="bracelet-direct-print">
      <div className="bracelet-print-area">
        <h3>{baby ? "Newborn bracelet" : "Mother bracelet"}</h3>
        <dl>
          {baby && (
            <div>
              <dt>Baby name</dt>
              <dd>{babyFullName(baby)}</dd>
            </div>
          )}
          <div>
            <dt>MRN</dt>
            <dd>{baby ? baby.mrn || "Not recorded" : mother.patientId}</dd>
          </div>
          <div>
            <dt>Mother's name</dt>
            <dd>{motherFullName(mother)}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{date?.split("-").reverse().join("/")}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{time?.slice(0, 5) || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Doctor</dt>
            <dd>{mother.doctorName || "Not recorded"}</dd>
          </div>
        </dl>
      </div>
    </div>,
    document.body,
  );
}
