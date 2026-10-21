import { useSyncExternalStore } from "react";
import { directoryService } from "../services/workflows";
/** The mock repository is already loaded. Read it immediately and subscribe to writes. */
export function useWorkflowSummary() {
  useSyncExternalStore(directoryService.subscribe, directoryService.getRevision);
  return directoryService.getWorkflowSnapshot();
}
