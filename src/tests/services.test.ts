import { describe, expect, it } from "vitest";
import { repository as db } from "../repositories/mockRepository";
import {
  admissionService,
  admissionRequestService,
  continueWithMedpointFlow,
  processNewbornRequest,
} from "../services/workflows";
import type { ChildInput } from "../types";
import { useWorkflow } from "../store/workflow";
const child: ChildInput = {
  gender: "Female",
  birthDate: "2026-10-06",
  birthTime: "09:42",
  weight: 3.2,
  firstName: "baby of Layla",
  middleName: "Karim",
  lastName: "Haddad",
};
describe("Admission records", () => {
  it("finds admissions by name, admission number, and case; unknown cases return no results", async () => {
    for (const q of ["Layla", "ADM-260641", "CASE-2026-00127"])
      expect(await admissionService.searchMotherAdmission(q)).toHaveLength(1);
    expect(await admissionService.searchMotherAdmission("missing")).toEqual([]);
  });
  it("creates a single child in both tables with linked identities", async () => {
    const [baby] = await admissionService.createSingleChild("m5", child);
    expect(db.babies.find((b) => b.id === baby.id)).toBeDefined();
    expect(db.persons.find((p) => p.id === baby.personId)?.babyId).toBe(baby.id);
  });
  it("creates multiple children and rejects fewer than two", async () => {
    const babies = await admissionService.createMultipleChildren("m5", [child, child, child]);
    expect(babies).toHaveLength(3);
    for (const baby of babies) expect(db.persons.some((p) => p.babyId === baby.id)).toBe(true);
    await expect(admissionService.createMultipleChildren("m5", [])).rejects.toThrow();
    await expect(admissionService.createMultipleChildren("m5", [child])).rejects.toThrow();
  });
  it("has no partial records after failed creation and blocks inactive admissions", async () => {
    db.failure = "creation";
    await expect(admissionService.createSingleChild("m5", child)).rejects.toThrow();
    expect(db.babies).toHaveLength(6);
    expect(db.persons).toHaveLength(6);
    await expect(admissionService.createSingleChild("m4", child)).rejects.toThrow(
      "active admission",
    );
  });
});
describe("Lab processing consistency", () => {
  it("updates the queue before marking NewBornSent and enables Medpoint", async () => {
    const ready = await processNewbornRequest("LAB-260801", "b1");
    expect(db.audit).toEqual([
      "Update LabBidiMessageQueue with the baby's info",
      "Update NewBornSent Field in AdmissionRequest to True",
    ]);
    expect(db.admissionRequests.find((a) => a.labRequestId === ready.id)?.NewBornSent).toBe(true);
    expect(await continueWithMedpointFlow(ready)).toEqual({
      requestId: ready.id,
    });
  });
  it("cannot mark sent without a queue update or process the wrong baby", async () => {
    await expect(admissionRequestService.markNewBornSent("LAB-260801", "b1")).rejects.toThrow();
    await expect(processNewbornRequest("LAB-260801", "b2")).rejects.toThrow();
    expect(db.queue).toHaveLength(0);
  });
  it("recovers partial failure without duplicating the queue", async () => {
    db.failure = "admission";
    await expect(processNewbornRequest("LAB-260801", "b1")).rejects.toThrow("safely queued");
    expect(db.queue).toHaveLength(1);
    expect(db.admissionRequests[0].NewBornSent).toBe(false);
    await expect(continueWithMedpointFlow(db.requests[0])).rejects.toThrow();
    await processNewbornRequest("LAB-260801", "b1");
    expect(db.queue).toHaveLength(1);
    expect(db.admissionRequests[0].NewBornSent).toBe(true);
  });
  it("queue failure leaves the admission request unchanged", async () => {
    db.failure = "queue";
    await expect(processNewbornRequest("LAB-260801", "b1")).rejects.toThrow();
    expect(db.queue).toHaveLength(0);
    expect(db.admissionRequests[0].NewBornSent).toBe(false);
  });
  it("rejects disappeared and already processed requests", async () => {
    await expect(processNewbornRequest("missing", "b1")).rejects.toThrow();
    await processNewbornRequest("LAB-260801", "b1");
    await expect(processNewbornRequest("LAB-260801", "b1")).rejects.toThrow("no longer pending");
  });
  it("clears dependent selections when the mother changes", () => {
    const store = useWorkflow.getState();
    store.setMother(db.mothers[0]);
    store.setBaby(db.babies[0]);
    store.setRequest(db.requests[0]);
    expect(useWorkflow.getState().selection.stage).toBe("review");
    store.setMother(db.mothers[1]);
    expect(useWorkflow.getState().selection).toEqual({
      stage: "baby",
      mother: db.mothers[1],
    });
    store.setBaby(db.babies[0]);
    expect(useWorkflow.getState().selection.stage).toBe("baby");
  });
});

describe("Required child details", () => {
  it("rejects whitespace-only names without creating partial records", async () => {
    for (const key of ["firstName"] as const) {
      await expect(
        admissionService.createSingleChild("m5", { ...child, [key]: "  " }),
      ).rejects.toThrow();
    }
    expect(db.babies).toHaveLength(6);
    expect(db.persons).toHaveLength(6);
  });
  it("persists a baby's chosen blood type", async () => {
    const [baby] = await admissionService.createSingleChild("m5", { ...child, bloodType: "AB-" });
    expect(baby.bloodType).toBe("AB-");
    expect(db.babies.find((record) => record.id === baby.id)?.bloodType).toBe("AB-");
  });
});
describe("One registration per admission and corrections", () => {
  it("rejects another registration for an admission with children", async () => {
    await expect(admissionService.createSingleChild("m1", child)).rejects.toThrow(
      "already registered",
    );
    expect(db.babies).toHaveLength(6);
  });
  it("keeps newborn, person, MRN and request identities when correcting details", async () => {
    const original = db.babies[0];
    const [updated] = await admissionService.updateChildren(
      "m1",
      [{ ...original, firstName: "Corrected", weight: 3.4 }],
      [original.id],
    );
    expect(updated.id).toBe(original.id);
    expect(updated.personId).toBe(original.personId);
    expect(updated.mrn).toBe(original.mrn);
    expect(db.persons.find((person) => person.id === original.personId)?.name).toContain(
      "Corrected",
    );
    expect(db.requests[0].babyId).toBe(original.id);
    expect(db.babies).toHaveLength(6);
  });
  it("corrects the count while keeping retained child identities", async () => {
    const records = await admissionService.createMultipleChildren("m5", [child, child]);
    const reduced = await admissionService.updateChildren(
      "m5",
      [records[0]],
      records.map((record) => record.id),
    );
    expect(reduced).toHaveLength(1);
    expect(reduced[0].id).toBe(records[0].id);
    expect(db.persons.some((person) => person.id === records[1].personId)).toBe(false);
    const increased = await admissionService.updateChildren(
      "m5",
      [reduced[0], child],
      [reduced[0].id],
    );
    expect(increased).toHaveLength(2);
    expect(increased[0].id).toBe(records[0].id);
    expect(increased[1].id).not.toBe(records[0].id);
  });
  it("rejects count corrections that orphan requests without changing records", async () => {
    const originals = db.babies.filter((baby) => baby.motherId === "m3");
    await expect(
      admissionService.updateChildren(
        "m3",
        [originals[0]],
        originals.map((baby) => baby.id),
      ),
    ).rejects.toThrow("linked lab requests");
    expect(db.babies.filter((baby) => baby.motherId === "m3")).toEqual(originals);
  });
});
