import { ClipboardPlus, Baby as BabyIcon, Heart, FileText, UsersRound } from "lucide-react";
import type { MotherAdmission } from "../../types";
import { PatientSearch } from "../../components/PatientSearch";
import { ErrorState } from "../../components/common";
type Props = {
  saving: boolean;
  error: string;
  onSelect: (mother: MotherAdmission) => void;
  onError: (message: string) => void;
};
export function AdmissionSearch({ saving, error, onSelect, onError }: Props) {
  return (
    <div className="record-page admission-search-page admission-welcome">
      <div className="admission-backdrop" aria-hidden="true">
        <svg className="admission-backdrop-lines" viewBox="0 0 1200 700" preserveAspectRatio="none">
          <path d="M-70 540 C160 300 180 700 470 560 S880 260 1270 420" />
          <path d="M-80 565 C170 325 180 725 480 585 S900 290 1270 445" />
          <circle cx="1050" cy="120" r="175" />
          <circle cx="1050" cy="120" r="145" />
          <circle cx="90" cy="620" r="130" />
        </svg>
        <span className="admission-backdrop-dots dots-top" />
        <span className="admission-backdrop-dots dots-bottom" />
      </div>
      <section className="patient-search-card admission-start admission-search-hero">
        <div className="admission-search-copy">
          <div className="admission-card-top">
            <div className="admission-care-graphic" aria-hidden="true">
              <span className="admission-graphic-record">
                <ClipboardPlus size={24} strokeWidth={1.6} />
              </span>
              <span className="admission-graphic-connector" />
              <span className="admission-graphic-baby">
                <BabyIcon size={23} strokeWidth={1.6} />
                <Heart className="admission-graphic-heart" size={12} />
              </span>
            </div>
            <span className="admission-step">Step 1 / Select Mother</span>
          </div>
          <h2>Newborn Registration and Lab Requests</h2>
          <p>Enter the case number and select the mother from the suggestions.</p>
          <PatientSearch
            caseOnly
            onSelect={onSelect}
            onEmpty={() =>
              onError("No active admission found. Please direct parents to reception.")
            }
            onClear={() => onError("")}
            disabled={saving}
          />
          <div className="admission-search-hints">
            <span>
              <FileText size={18} />
              Search by case number only
            </span>
            <span>
              <UsersRound size={18} />
              Select the mother from suggestions
            </span>
          </div>
          {error && <ErrorState message={error} />}
        </div>
      </section>
    </div>
  );
}
