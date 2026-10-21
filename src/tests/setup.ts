import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { repository } from "../repositories/mockRepository";
import { useWorkflow } from "../store/workflow";
beforeEach(() => {
  repository.reset();
  // Keep workflow fixtures independent of rolling dashboard demo records.
  repository.mothers = repository.mothers.filter((m) => !m.id.startsWith("demo-"));
  repository.babies = repository.babies.filter((b) => !b.id.startsWith("demo-"));
  repository.requests = repository.requests.filter((r) => !r.id.startsWith("LAB-DEMO-"));
  repository.persons = repository.persons.filter((p) => !p.babyId.startsWith("demo-"));
  repository.admissionRequests = repository.admissionRequests.filter(
    (r) => !r.labRequestId.startsWith("LAB-DEMO-"),
  );
  repository.delay = 0;
  useWorkflow.getState().reset();
});
afterEach(cleanup);
