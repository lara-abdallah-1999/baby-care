import { useRef } from "react";
import { ArrowRight, Printer } from "lucide-react";
import { allChildrenColumns, childrenColumns } from "../../components/ChildrenColumns";
import { babyFullName } from "../../lib/patientNames";
import type { Baby, LabRequest } from "../../types";

interface Props {
  entries: { baby: Baby; requests: LabRequest[] }[];
  columns: readonly string[];
  highlightedChild: string;
  saving: boolean;
  onPrint: (baby: Baby) => void;
  onOpenRequests: (babyId: string) => void;
}

function childValues(baby: Baby) {
  return {
    "Full name": babyFullName(baby),
    MRN: baby.mrn || "Not recorded",
    Gender: baby.gender,
    "Birth date": baby.birthDate,
    "Birth time": baby.birthTime,
    Weight: `${baby.weight} kg`,
    Height: baby.height ? `${baby.height} cm` : "Not recorded",
    "Head circumference": baby.headCircumference ? `${baby.headCircumference} cm` : "Not recorded",
    Maturity: baby.maturityStatus || "Not recorded",
  };
}

export function ChildrenTable({
  entries,
  columns,
  highlightedChild,
  saving,
  onPrint,
  onOpenRequests,
}: Props) {
  const scrolledChild = useRef<string | null>(null);
  const visibleColumns = childrenColumns.filter((column) => columns.includes(column));
  return (
    <div className="children-table-wrap" role="region" aria-label="Children records" tabIndex={0}>
      <table className="children-table">
        <thead>
          <tr>
            {allChildrenColumns
              .filter((column) => columns.includes(column))
              .map((column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(({ baby, requests }) => {
            const values = childValues(baby);
            const highlighted = highlightedChild === baby.id;
            return (
              <tr
                key={baby.id}
                className={highlighted ? "child-highlight" : ""}
                aria-current={highlighted ? "true" : undefined}
                ref={(element) => {
                  if (element && highlighted && scrolledChild.current !== baby.id) {
                    element.scrollIntoView?.({ block: "nearest" });
                    scrolledChild.current = baby.id;
                  }
                }}
              >
                {visibleColumns.map((column) => (
                  <td key={column} title={column === "Maturity" ? baby.maturityNotes : undefined}>
                    {values[column]}
                  </td>
                ))}
                {columns.includes("Bracelet") && (
                  <td>
                    <button
                      className="quiet"
                      aria-label={`Print bracelet for ${babyFullName(baby)}`}
                      onClick={() => onPrint(baby)}
                    >
                      <Printer size={17} />
                    </button>
                  </td>
                )}
                {columns.includes("Requests") && (
                  <td>
                    {requests.length > 0 && (
                      <button
                        className="secondary child-requests-button"
                        disabled={saving}
                        aria-label={`Lab requests for ${babyFullName(baby)}`}
                        onClick={() => onOpenRequests(baby.id)}
                      >
                        Requests
                        <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
