import { babies, mothers, requests } from "../mocks/data";
import type {
  AdmissionRequest,
  Baby,
  FailurePoint,
  LabBidiMessageQueueItem,
  LabRequest,
  MotherAdmission,
  Person,
} from "../types";
class MockRepository {
  private listeners = new Set<() => void>();
  revision = 0;
  updatedAt = Date.now();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  notify() {
    this.revision++;
    this.updatedAt = Date.now();
    this.listeners.forEach((listener) => listener());
  }
  mothers: MotherAdmission[] = [];
  babies: Baby[] = [];
  requests: LabRequest[] = [];
  persons: Person[] = [];
  admissionRequests: AdmissionRequest[] = [];
  queue: LabBidiMessageQueueItem[] = [];
  audit: string[] = [];
  failure: FailurePoint = "none";
  delay = 350;
  constructor() {
    this.reset();
  }
  reset() {
    this.mothers = structuredClone(mothers);
    this.babies = structuredClone(babies);
    this.requests = structuredClone(requests);
    this.persons = this.babies.map((b) => ({
      id: b.personId,
      babyId: b.id,
      name: b.identifier,
    }));
    this.admissionRequests = this.requests.map((r) => ({
      id: `admission-${r.id}`,
      labRequestId: r.id,
      NewBornSent: false,
    }));
    this.queue = [];
    this.audit = [];
    this.failure = "none";
    this.notify();
  }
  async wait(point: FailurePoint = "network") {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    if (this.failure === point || this.failure === "network") {
      this.failure = "none";
      throw new Error(
        point === "admission"
          ? "The request could not be finalized. The baby information is safely queued. Retry to complete this request."
          : "The operation could not be completed. Your selections are preserved. Please try again.",
      );
    }
  }
}
export const repository = new MockRepository();
