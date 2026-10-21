import { create } from "zustand";
export const useOperation = create<{
  saving: boolean;
  setSaving: (saving: boolean) => void;
}>((set) => ({ saving: false, setSaving: (saving) => set({ saving }) }));
