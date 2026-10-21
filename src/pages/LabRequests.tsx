import { PageHeader } from "../components/common";
import { NewbornRequests } from "../features/labRequests/NewbornRequests";
export function LabRequests() {
  return (
    <>
      <PageHeader
        eyebrow="02 / LABORATORY"
        title="Newborn Lab Requests"
        description="Find the mother's admission and prepare her newborn's pending lab request."
      />
      <NewbornRequests />
    </>
  );
}
