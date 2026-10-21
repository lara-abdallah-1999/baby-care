import { useMemo, useSyncExternalStore } from "react";
import { repository } from "../repositories/mockRepository";
import { babyFullName, motherFullName } from "../lib/patientNames";

export function useRegisters() {
  const revision = useSyncExternalStore(repository.subscribe, () => repository.revision);
  return useMemo(() => {
    const mothers = new Map(repository.mothers.map((mother) => [mother.id, mother]));
    const babies = repository.babies.map((baby) => {
      const mother = mothers.get(baby.motherId);
      return {
        ...baby,
        name: babyFullName(baby),
        motherName: mother ? motherFullName(mother) : "Unknown",
        caseNumber: mother?.caseNumber ?? "",
        admittedAt: mother?.admittedAt ?? "",
        admissionStatus: mother?.status ?? "Unknown",
        ward: mother?.ward ?? "",
        doctor: mother?.doctorName ?? "",
        requestCount: repository.requests.filter((r) => r.babyId === baby.id).length,
      };
    });
    const byId = new Map(babies.map((baby) => [baby.id, baby]));
    const requests = repository.requests.map((request) => {
      const mother = mothers.get(request.motherId);
      const baby = request.babyId ? byId.get(request.babyId) : undefined;
      return {
        ...request,
        name: baby?.name ?? "Not linked to a baby",
        mrn: baby?.mrn ?? "",
        motherName: mother ? motherFullName(mother) : "Unknown",
        caseNumber: mother?.caseNumber ?? "",
        procedures: (request.tests?.length ? request.tests : [request.test]).join(", "),
        displayStatus: request.status === "Ready" ? "Proceeded" : "Pending",
      };
    });
    return { babies, requests, mothers: repository.mothers, revision };
  }, [revision]);
}
export function inDateRange(value: string, from: string, to: string) {
  const date = value.slice(0, 10);
  return (!from || date >= from) && (!to || date <= to);
}
export function chartDates(range: number) {
  const today = new Date();
  return Array.from({ length: range }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - range + i + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}
export function registerLink(
  kind: "admission" | "birth" | "requests",
  from: string,
  to: string,
  status = "",
) {
  const params = new URLSearchParams({ from, to });
  if (kind !== "requests") params.set("dateField", kind);
  if (status) params.set("status", status);
  return `${kind === "requests" ? "/lab-request-register" : "/admission"}?${params}`;
}
