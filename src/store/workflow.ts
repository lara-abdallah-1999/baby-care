import { create } from "zustand";
import type { Baby, LabRequest, MotherAdmission } from "../types";
type Selection =
  | { stage: "search" }
  | { stage: "baby"; mother: MotherAdmission }
  | { stage: "request"; mother: MotherAdmission; baby: Baby }
  | {
      stage: "review" | "processing" | "ready";
      mother: MotherAdmission;
      baby: Baby;
      request: LabRequest;
    };
interface WorkflowStore {
  selection: Selection;
  setMother: (mother: MotherAdmission) => void;
  setBaby: (baby: Baby) => void;
  setRequest: (request: LabRequest) => void;
  setStage: (stage: "processing" | "review" | "ready", request?: LabRequest) => void;
  reset: () => void;
}
export const useWorkflow = create<WorkflowStore>((set) => ({
  selection: { stage: "search" },
  setMother: (mother) => set({ selection: { stage: "baby", mother } }),
  setBaby: (baby) =>
    set((s) =>
      "mother" in s.selection && baby.motherId === s.selection.mother.id
        ? { selection: { stage: "request", mother: s.selection.mother, baby } }
        : {},
    ),
  setRequest: (request) =>
    set((s) =>
      "baby" in s.selection && request.babyId === s.selection.baby.id
        ? { selection: { ...s.selection, stage: "review", request } }
        : {},
    ),
  setStage: (stage, request) =>
    set((s) =>
      "request" in s.selection && (!request || request.id === s.selection.request.id)
        ? {
            selection: {
              ...s.selection,
              stage,
              request: request ?? s.selection.request,
            },
          }
        : {},
    ),
  reset: () => set({ selection: { stage: "search" } }),
}));
