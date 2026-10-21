import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { continueWithMedpointFlow } from "../../services/workflows";
import { ErrorState, errorMessage } from "../../components/common";
import type { LabRequest } from "../../types";
export function MedpointButton({ request }: { request: LabRequest }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function next() {
    setBusy(true);
    setError("");
    try {
      const result = await continueWithMedpointFlow(request);
      navigate("/medpoint", { state: result });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {error && <ErrorState message={error} />}
      <button className="primary" disabled={busy} onClick={next}>
        {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}
        Continue with Medpoint Flow
      </button>
    </div>
  );
}
