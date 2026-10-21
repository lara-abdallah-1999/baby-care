import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { DashboardCharts } from "../components/DashboardCharts";
import { repository } from "../repositories/mockRepository";
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-12T12:00:00"));
});
afterEach(() => vi.useRealTimers());
it("filters each chart independently without navigating", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DashboardCharts />
      <Location />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: "Newborn Registrations range" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Last 3 days" }));
  expect(screen.queryByRole("link", { name: "Oct 6: 6 admissions" })).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: /8 total requests/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Lab Requests range" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Last 3 days" }));
  expect(screen.getByRole("img", { name: /0 total requests/ })).toBeInTheDocument();
  expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
});
it("links a daily point to exactly that admission date", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DashboardCharts />
      <Location />
    </MemoryRouter>,
  );
  const point = screen.getByRole("link", { name: "Oct 6: 6 admissions" });
  await user.hover(point);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Newborn registrations: 6");
  await user.click(point);
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/admission?from=2026-10-06&to=2026-10-06&dateField=admission",
  );
});
it("links request segments and legends to the selected status and date range", async () => {
  repository.requests[0].status = "Ready";
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DashboardCharts />
      <Location />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("img", { name: "8 total requests: Pending 7, Proceeded 1" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Pending: 7" }));
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/lab-request-register?from=2026-10-06&to=2026-10-12&status=Pending",
  );
  screen.getByRole("link", { name: "View Proceeded requests" }).focus();
  await user.keyboard("{Enter}");
  expect(screen.getByTestId("location")).toHaveTextContent("status=Proceeded");
});
it("removes the records card and opens registration from its chart", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DashboardCharts />
      <Location />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("heading", { name: "Newborn Records" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("heading", { name: "Newborn Registrations" }));
  expect(screen.getByTestId("location")).toHaveTextContent("/admission");
});
