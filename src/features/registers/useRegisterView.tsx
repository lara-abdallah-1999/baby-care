import { useSearchParams, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Badge } from "../../components/common";
import { inDateRange, useRegisters } from "../../hooks/useRegisters";
type Column = { key: string; label: string; render?: (row: Row) => ReactNode };
export type Row = { id: string; [key: string]: string | number | undefined };

export function useRegisterView(isBabies: boolean, data: ReturnType<typeof useRegisters>) {
  const [params, setParams] = useSearchParams();
  const get = (key: string) => params.get(key) ?? "";
  function update(key: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }
  const rows: Row[] = isBabies
    ? data.babies.map((b) => ({ ...b }))
    : data.requests.map((r) => ({
        id: r.id,
        motherId: r.motherId,
        babyId: r.babyId ?? "",
        name: r.name,
        mrn: r.mrn,
        motherName: r.motherName,
        caseNumber: r.caseNumber,
        procedures: r.procedures,
        requestedBy: r.requestedBy,
        requestedAt: r.requestedAt,
        priority: r.priority,
        status: r.displayStatus,
      }));
  const dateField = isBabies
    ? get("dateField") === "birth"
      ? "birthDate"
      : "admittedAt"
    : "requestedAt";
  const from = get("from"),
    to = get("to"),
    invalidRange = !!from && !!to && from > to;
  const query = get("q").trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (
      query &&
      !Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      )
    )
      return false;
    if (invalidRange || !inDateRange(String(row[dateField] ?? ""), from, to)) return false;
    if (get("status") && row[isBabies ? "admissionStatus" : "status"] !== get("status"))
      return false;
    if (isBabies) {
      if (get("gender") && row.gender !== get("gender")) return false;
      if (get("bloodType") && (row.bloodType || "Unknown") !== get("bloodType")) return false;
    } else {
      if (get("priority") && row.priority !== get("priority")) return false;
      if (get("requestedBy") && row.requestedBy !== get("requestedBy")) return false;
      if (get("babyId") && row.babyId !== get("babyId")) return false;
      if ((get("linked") === "yes" && !row.babyId) || (get("linked") === "no" && !!row.babyId))
        return false;
    }
    return true;
  });
  const columns: Column[] = isBabies
    ? [
        { key: "name", label: "Baby name" },
        { key: "mrn", label: "MRN" },
        { key: "motherName", label: "Mother" },
        { key: "caseNumber", label: "Case number" },
        { key: "gender", label: "Gender" },
        { key: "birthDate", label: "Birth date" },
        { key: "birthTime", label: "Birth time" },
        { key: "bloodType", label: "Blood type" },
        { key: "weight", label: "Weight (kg)" },
        { key: "admittedAt", label: "Admitted" },
        {
          key: "admissionStatus",
          label: "Admission status",
          render: (r) => (
            <Badge tone={r.admissionStatus === "Active" ? "green" : "blue"}>
              {r.admissionStatus}
            </Badge>
          ),
        },
        { key: "ward", label: "Ward" },
        { key: "doctor", label: "Physician" },
        {
          key: "requestCount",
          label: "Lab requests",
          render: (r) => (
            <Link to={`/lab-request-register?babyId=${encodeURIComponent(r.id)}`}>
              {r.requestCount} requests
            </Link>
          ),
        },
      ]
    : [
        { key: "id", label: "Request" },
        { key: "name", label: "Baby name" },
        { key: "mrn", label: "MRN" },
        { key: "motherName", label: "Mother" },
        { key: "caseNumber", label: "Case number" },
        { key: "procedures", label: "Procedures" },
        { key: "requestedAt", label: "Requested" },
        { key: "requestedBy", label: "Requested by" },
        {
          key: "priority",
          label: "Priority",
          render: (r) => (
            <Badge tone={r.priority === "Urgent" ? "amber" : "blue"}>{r.priority}</Badge>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (r) => (
            <Badge tone={r.status === "Pending" ? "amber" : "green"}>{r.status}</Badge>
          ),
        },
      ];
  const defaults = isBabies
    ? ["name", "mrn", "motherName", "gender", "birthDate", "admissionStatus"]
    : ["id", "name", "procedures", "requestedAt", "priority", "status"];
  const requestedColumns = params.has("columns") ? get("columns").split(",") : defaults;
  const chosen = columns.filter((column) => requestedColumns.includes(column.key));
  const visibleColumns = chosen.length
    ? chosen
    : columns.filter((column) => defaults.includes(column.key));
  const filterKeys = [
    "from",
    "to",
    "status",
    "gender",
    "bloodType",
    "priority",
    "requestedBy",
    "babyId",
    "linked",
  ];
  const activeFilters = filterKeys.filter((key) => get(key)).length;
  function resetFilters() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      [...filterKeys, "q", "dateField", "page"].forEach((key) => next.delete(key));
      return next;
    });
  }
  function toggleColumn(key: string) {
    const keys = visibleColumns.map((column) => column.key);
    update(
      "columns",
      keys.includes(key)
        ? keys.filter((value) => value !== key).join(",")
        : [...keys, key].join(","),
    );
  }
  const sort = columns.some((c) => c.key === get("sort")) ? get("sort") : dateField;
  const direction = get("direction") === "asc" ? "asc" : "desc";
  const sorted = [...filtered].sort((a, b) => {
    const left = a[sort] ?? "",
      right = b[sort] ?? "";
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true });
    return (direction === "asc" ? comparison : -comparison) || a.id.localeCompare(b.id);
  });
  const size = [5, 10, 25, 50].includes(Number(get("size"))) ? Number(get("size")) : 5;
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(get("page"))) || 1));
  const visible = sorted.slice((page - 1) * size, page * size);
  function sortBy(key: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sort", key);
      next.set("direction", sort === key && direction === "asc" ? "desc" : "asc");
      next.delete("page");
      return next;
    });
  }

  return {
    get,
    update,
    filtered,
    columns,
    visibleColumns,
    activeFilters,
    resetFilters,
    toggleColumn,
    sort,
    direction,
    size,
    pages,
    page,
    visible,
    sortBy,
    from,
    to,
    invalidRange,
    rows,
  };
}
