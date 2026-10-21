import { formatDate } from "../../components/common";
import type { LabRequest } from "../../types";
import { ClipboardList } from "lucide-react";
export function RequestList({
  requests,
  selectedId,
  highlightedId,
  onSelect,
  onProceed,
  disabled = false,
  retry = false,
  showIcon = false,
}: {
  showIcon?: boolean;
  requests: LabRequest[];
  selectedId?: string;
  highlightedId?: string;
  onSelect: (request: LabRequest) => void;
  onProceed: () => void;
  disabled?: boolean;
  retry?: boolean;
}) {
  return (
    <div className="request-list" role="group" aria-label="Pending requests">
      {requests.map((request) => (
        <div
          key={request.id}
          className={`request-row request-choice-row ${selectedId === request.id ? "selected" : ""} ${highlightedId === request.id ? "request-highlight" : ""}`}
        >
          <button
            type="button"
            className="request-select"
            disabled={disabled}
            aria-pressed={selectedId === request.id}
            onClick={() => onSelect(request)}
          >
            <span className="radio-dot" aria-hidden="true" />
            {showIcon && (
              <span className="lab-request-icon" aria-hidden="true">
                <ClipboardList size={21} />
              </span>
            )}
            <span className="request-main">
              <strong>{request.id}</strong>
              <span className="request-meta">{formatDate(request.requestedAt)}</span>
            </span>
          </button>
          <button
            type="button"
            className="primary request-proceed"
            disabled={disabled || selectedId !== request.id}
            onClick={onProceed}
            aria-label={`${retry && selectedId === request.id ? "Retry Proceed" : "Proceed"} ${request.id}`}
          >
            {disabled && selectedId === request.id
              ? "Processing…"
              : retry && selectedId === request.id
                ? "Retry Proceed"
                : "Proceed"}
          </button>
        </div>
      ))}
    </div>
  );
}
