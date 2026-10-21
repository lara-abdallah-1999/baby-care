import { Link, useLocation } from "react-router-dom";
import { SuccessState } from "../components/common";
export function Medpoint() {
  const { state } = useLocation();
  const requestId =
    typeof state === "object" &&
    state !== null &&
    "requestId" in state &&
    typeof state.requestId === "string"
      ? state.requestId
      : null;
  return (
    <>
      <SuccessState title={requestId ? "Request Proceeded" : "No request selected"}>
        {requestId
          ? `Request ${requestId} is now moving to action.`
          : "Select a pending request from the patient workspace to proceed."}
      </SuccessState>
      <div className="center-action">
        <Link className="secondary" to="/admission">
          Back to patient workspace
        </Link>
      </div>
    </>
  );
}
