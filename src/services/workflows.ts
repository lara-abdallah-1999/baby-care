import { z } from "zod";
import { repository as db } from "../repositories/mockRepository";
import type { Baby, ChildInput, LabRequest } from "../types";
export const childSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name").max(60, "Use 60 characters or fewer"),
  middleName: z.string().trim().max(60, "Use 60 characters or fewer").optional(),
  lastName: z.string().trim().max(60, "Use 60 characters or fewer").optional(),
  bloodType: z.enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  height: z.number().positive("Enter a positive height").optional(),
  headCircumference: z.number().positive("Enter a positive head circumference").optional(),
  maturityStatus: z.enum(["", "Term", "Preterm", "Post-term", "Not assessed"]).optional(),
  maturityNotes: z.string().trim().max(1000).optional(),
  gender: z.enum(["Female", "Male"], { error: "Select Male or Female" }),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a birth date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a birth time"),
  weight: z.number().positive("Enter a positive weight").max(10, "Check the weight in kilograms"),
});
export const admissionService = {
  getWorkspaceSnapshot(motherId: string) {
    const mother = db.mothers.find((record) => record.id === motherId) ?? null;
    const requests = db.requests.filter((request) => request.motherId === motherId);
    const entries = db.babies
      .filter((baby) => baby.motherId === motherId)
      .sort((a, b) => a.number - b.number)
      .map((baby) => ({
        baby,
        requests: requests.filter((request) => request.babyId === baby.id),
      }));
    return structuredClone({ mother, entries, requests });
  },
  async updateChildren(
    motherId: string,
    children: (ChildInput & { id?: string })[],
    expectedIds: string[],
  ) {
    await db.wait("creation");
    if (!db.mothers.some((mother) => mother.id === motherId && mother.status === "Active"))
      throw new Error("An active admission is required to edit children.");
    const existing = db.babies.filter((baby) => baby.motherId === motherId);
    if (
      !existing.length ||
      existing.length !== expectedIds.length ||
      existing.some((baby) => !expectedIds.includes(baby.id))
    )
      throw new Error("The child records have changed. Reopen the edit form and try again.");
    if (!children.length || children.length > 20) throw new Error("Enter between 1 and 20 babies.");
    const ids = children.flatMap((child) => (child.id ? [child.id] : []));
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existing.some((baby) => baby.id === id))
    )
      throw new Error("The children do not match this admission.");
    const parsed = children.map((child) => childSchema.parse(child));
    const removed = existing.filter((baby) => !ids.includes(baby.id));
    if (
      removed.some(
        (baby) =>
          db.requests.some((request) => request.babyId === baby.id) ||
          db.queue.some((item) => item.baby.id === baby.id),
      )
    )
      throw new Error(
        "Cannot reduce the count by removing a child with linked lab requests. Keep that child and correct their details instead.",
      );
    const records: Baby[] = parsed.map((child, index) => {
      const original = existing.find((baby) => baby.id === children[index].id);
      const id = original?.id ?? crypto.randomUUID();
      return {
        ...original,
        ...child,
        id,
        motherId,
        personId: original?.personId ?? "person-" + id,
        mrn: original?.mrn ?? "NB-" + id,
        number: index + 1,
        identifier: [child.firstName, child.middleName, child.lastName].join(" "),
      };
    });
    db.babies = [...db.babies.filter((baby) => baby.motherId !== motherId), ...records];
    db.persons = [
      ...db.persons.filter((person) => !existing.some((baby) => baby.personId === person.id)),
      ...records.map((baby) => ({ id: baby.personId, babyId: baby.id, name: baby.identifier })),
    ];
    db.audit.push(
      "Correct child records for admission " +
        motherId +
        "; count " +
        existing.length +
        " to " +
        records.length,
    );
    db.notify();
    return structuredClone(records);
  },
  async getMotherAdmission(id: string) {
    await db.wait();
    return structuredClone(db.mothers.find((m) => m.id === id) ?? null);
  },
  async searchMotherAdmission(query: string, caseOnly = false) {
    await db.wait();
    const q = query.trim().toLowerCase();
    return q
      ? structuredClone(
          db.mothers.filter((m) =>
            caseOnly
              ? m.caseNumber.toLowerCase().includes(q)
              : [
                  m.name,
                  m.middleName ?? "",
                  m.middleName ? m.name.replace(/ (\S+)$/, ` ${m.middleName} $1`) : m.name,
                  m.caseNumber,
                  m.admissionNumber,
                  m.patientId,
                ].some((v) => v.toLowerCase().includes(q)) ||
                (q.replace(/\D/g, "").length >= 3 &&
                  !!m.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, ""))),
          ),
        )
      : [];
  },
  async searchMotherByCaseNumber(query: string) {
    await db.wait();
    return structuredClone(
      db.mothers.find((m) => m.caseNumber.toLowerCase() === query.trim().toLowerCase()) ?? null,
    );
  },
  async getBabiesForMother(motherId: string) {
    await db.wait();
    return structuredClone(db.babies.filter((b) => b.motherId === motherId));
  },
  async createSingleChild(motherId: string, child: ChildInput) {
    return createChildren(motherId, [child]);
  },
  async createMultipleChildren(motherId: string, children: ChildInput[]) {
    if (children.length < 2) throw new Error("Multiple births require at least two babies.");
    return createChildren(motherId, children);
  },
};
async function createChildren(motherId: string, children: ChildInput[]) {
  await db.wait("creation");
  if (!db.mothers.some((m) => m.id === motherId && m.status === "Active"))
    throw new Error("An active admission is required.");
  if (db.babies.some((baby) => baby.motherId === motherId))
    throw new Error(
      "Children are already registered for this admission. Edit the existing children from View Children.",
    );
  if (children.length > 20) throw new Error("Enter between 1 and 20 babies.");
  const parsed = children.map((c) => childSchema.parse(c));
  if (!parsed.length) throw new Error("Add at least one baby.");
  const offset = db.babies.filter((b) => b.motherId === motherId).length;
  const records: Baby[] = parsed.map((c, i) => {
    const id = crypto.randomUUID();
    return {
      ...c,
      id,
      motherId,
      personId: `person-${id}`,
      mrn: `NB-${id}`,
      number: offset + i + 1,
      identifier:
        [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ") ||
        `Baby ${offset + i + 1}`,
    };
  });
  db.persons.push(
    ...records.map((b) => ({
      id: b.personId,
      babyId: b.id,
      name: b.identifier,
    })),
  );
  db.babies.push(...records);
  db.notify();
  db.audit.push("Create child records in New Born and Person tables");
  return structuredClone(records);
}
function validateRequest(requestId: string, babyId: string) {
  const r = db.requests.find((r) => r.id === requestId);
  const baby = db.babies.find((b) => b.id === babyId);
  if (!r || !baby || r.babyId !== baby.id || r.motherId !== baby.motherId || r.status !== "Pending")
    throw new Error(
      "This request is no longer pending or does not belong to the selected baby. Refresh the search.",
    );
  return { r, baby };
}
export const labRequestService = {
  async getRequest(id: string) {
    await db.wait();
    return structuredClone(db.requests.find((request) => request.id === id) ?? null);
  },
  async getRequestsForMother(motherId: string) {
    await db.wait();
    const requestsByBaby = new Map<string, LabRequest[]>();
    for (const request of db.requests) {
      if (request.motherId !== motherId || !request.babyId) continue;
      const requests = requestsByBaby.get(request.babyId) ?? [];
      requests.push(request);
      requestsByBaby.set(request.babyId, requests);
    }
    return structuredClone(
      db.babies
        .filter((baby) => baby.motherId === motherId)
        .map((baby) => ({ baby, requests: requestsByBaby.get(baby.id) ?? [] })),
    );
  },
  async getPendingRequestsForBaby(babyId: string) {
    await db.wait();
    return structuredClone(
      db.requests.filter((r) => r.babyId === babyId && r.status === "Pending"),
    );
  },
  async updateLabBidiMessageQueue(requestId: string, babyId: string) {
    await db.wait("queue");
    const { baby } = validateRequest(requestId, babyId);
    if (!db.queue.some((q) => q.requestId === requestId)) {
      db.queue.push({
        requestId,
        baby: structuredClone(baby),
        queuedAt: new Date().toISOString(),
      });
      db.audit.push("Update LabBidiMessageQueue with the baby's info");
    }
  },
};
export const admissionRequestService = {
  async markNewBornSent(requestId: string, babyId: string) {
    await db.wait("admission");
    const { r } = validateRequest(requestId, babyId);
    if (!db.queue.some((q) => q.requestId === requestId && q.baby.id === babyId))
      throw new Error("Baby information must be queued first.");
    const admission = db.admissionRequests.find((a) => a.labRequestId === requestId);
    if (!admission) throw new Error("Admission request not found.");
    admission.NewBornSent = true;
    r.status = "Ready";
    db.notify();
    db.audit.push("Update NewBornSent Field in AdmissionRequest to True");
    return structuredClone(r);
  },
};
export async function processNewbornRequest(requestId: string, babyId: string) {
  await labRequestService.updateLabBidiMessageQueue(requestId, babyId);
  return admissionRequestService.markNewBornSent(requestId, babyId);
}
export async function continueWithMedpointFlow(request: LabRequest) {
  await db.wait();
  const current = db.requests.find((r) => r.id === request.id);
  if (
    !current ||
    !current.babyId ||
    current.status !== "Ready" ||
    !db.admissionRequests.some((a) => a.labRequestId === current.id && a.NewBornSent)
  )
    throw new Error("This request is not available for Medpoint.");
  return { requestId: current.id };
}
export const directoryService = {
  subscribe: db.subscribe,
  getRevision: () => db.revision,
  getWorkflowSnapshot() {
    return {
      activeAdmissions: db.mothers.filter((m) => m.status === "Active").length,
      newbornRecords: db.babies.length,
      readyNewbornRequests: db.requests.filter((r) => r.babyId && r.status === "Ready").length,
      pendingNewbornRequests: db.requests.filter((r) => r.babyId && r.status === "Pending").length,
      urgentNewbornRequests: db.requests.filter(
        (r) => r.babyId && r.status === "Pending" && r.priority === "Urgent",
      ).length,
      updatedAt: db.updatedAt,
    };
  },
  async getWorkflowSummary() {
    await db.wait();
    return this.getWorkflowSnapshot();
  },
  async listAdmissions() {
    await db.wait();
    return structuredClone(db.mothers);
  },
};
