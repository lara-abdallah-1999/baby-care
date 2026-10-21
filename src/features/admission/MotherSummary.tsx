import {
  Printer,
  RotateCcw,
  UserRound,
  Phone,
  CalendarDays,
  ClipboardPlus,
  BedDouble,
  Droplet,
  Stethoscope,
  Building2,
} from "lucide-react";
import type { MotherAdmission } from "../../types";
import { motherFullName } from "../../lib/patientNames";
import { Badge, formatDate } from "../../components/common";
type Props = { mother: MotherAdmission; saving: boolean; onReset: () => void; onPrint: () => void };
export function MotherSummary({ mother, saving, onReset, onPrint }: Props) {
  const room = mother.room || mother.ward.match(/Room\s+[^/\u00b7]+/i)?.[0]?.trim();
  const ward = mother.ward.split(/Room/i)[0].replace(/[\s\u00b7\u00c2|-]+$/g, "");
  const roomAndBed = [room, mother.bed ? "Bed " + mother.bed : ""].filter(Boolean).join(" / ");
  const infoColumns = [
    [
      { label: "Phone", value: mother.phone, icon: Phone },
      { label: "Admitted", value: formatDate(mother.admittedAt), icon: CalendarDays },
    ],
    [
      { label: "Case number", value: mother.caseNumber, icon: ClipboardPlus },
      { label: "Ward", value: ward, icon: Building2 },
    ],
    [
      { label: "Physician Name", value: mother.doctorName, icon: Stethoscope },
      { label: "Room", value: roomAndBed, icon: BedDouble },
    ],
    [
      { label: "Blood type", value: mother.bloodType, icon: Droplet },
      { label: "Date of birth", value: mother.birthDate, icon: CalendarDays },
    ],
  ];

  return (
    <section className="mother-summary-reference" aria-label="Selected mother">
      <div className="mother-identity-block">
        <div className="mother-identity-top">
          <span className="eyebrow">SELECTED MOTHER</span>
        </div>
        <div className="mother-identity-main">
          <span className="patient-avatar">
            <UserRound size={21} />
          </span>
          <div>
            <h2>{motherFullName(mother)}</h2>
            <p>MRN {mother.patientId}</p>
          </div>
          <div className="mother-status-actions">
            <Badge tone="green">{mother.status}</Badge>
            <button
              className="quiet"
              disabled={saving}
              aria-label="Print Mother's bracelet"
              title="Print Mother's bracelet"
              onClick={onPrint}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="mother-info-strip">
        <div className="mother-info-columns">
          {infoColumns.map((column, i) => (
            <dl key={i} className="mother-info-column">
              {column.map(({ label, value, icon: Icon }) => (
                <div
                  className={
                    label === "Blood type" ? "mother-info-item blood-type" : "mother-info-item"
                  }
                  key={label}
                >
                  <span className="mother-info-icon" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.7} />
                  </span>
                  <div>
                    <dt>{label}</dt>
                    <dd>{value || "Not recorded"}</dd>
                  </div>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </div>
      <div className="mother-info-actions">
        <button
          className="mother-reset"
          title="Change Mother"
          aria-label="Change Mother"
          disabled={saving}
          onClick={onReset}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>
    </section>
  );
}
