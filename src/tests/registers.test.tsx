import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { Registers } from "../pages/Registers";
import { repository } from "../repositories/mockRepository";
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
function open(kind: "babies" | "requests", url = "/") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Registers kind={kind} />
    </MemoryRouter>,
  );
  return userEvent.setup();
}
it("paginates, sorts and resets pagination when filters change", async () => {
  const user = open("babies");
  expect(screen.getByRole("status")).toHaveTextContent("1-5 of 6 records");
  await user.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByRole("status")).toHaveTextContent("6-6 of 6 records");
  await user.click(screen.getByRole("button", { name: /^Filters/ }));
  await user.click(screen.getByRole("button", { name: "Gender All" }));
  await user.click(
    within(screen.getByRole("dialog", { name: "Gender" })).getByRole("button", { name: "Female" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("1-4 of 4 records");
  await user.click(screen.getByRole("button", { name: "Baby name" }));
  expect(within(screen.getAllByRole("row")[1]).getByText("Lea Samir Khoury")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(screen.getByRole("status")).toHaveTextContent("of 6 records");
});
it("combines linked baby, priority, status and request date filters from the URL", () => {
  open("requests", "/?babyId=b1&priority=Urgent&status=Pending&from=2026-10-06&to=2026-10-06");
  expect(screen.getByRole("status")).toHaveTextContent("1-1 of 1 records");
  expect(screen.getByRole("table")).toHaveTextContent("LAB-260802");
  expect(screen.getByRole("table")).not.toHaveTextContent("LAB-260801");
});
it("shows proceeded requests and searches records", async () => {
  repository.requests[0].status = "Ready";
  const user = open("requests", "/?status=Proceeded");
  expect(screen.getByRole("status")).toHaveTextContent("1-1 of 1 records");
  await user.type(screen.getByRole("searchbox"), "missing");
  expect(screen.getByText(/No records match/)).toBeInTheDocument();
});
it("reports reversed dates and returns no matching rows", () => {
  open("babies", "/?from=2026-10-12&to=2026-10-06");
  expect(screen.getByRole("alert")).toHaveTextContent("From date must be on or before To date");
  expect(screen.getByRole("status")).toHaveTextContent("0 of 0 records");
});

it("toggles filters and lets users choose and restore columns", async () => {
  const user = open("babies");
  expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("region", { name: "Register filters" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("region", { name: "Register filters" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.queryByRole("region", { name: "Register filters" })).not.toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: "Blood type" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Columns" }));
  await user.click(screen.getByRole("checkbox", { name: "Blood type" }));
  expect(screen.getByRole("columnheader", { name: "Blood type" })).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: "Mother" }));
  expect(screen.queryByRole("columnheader", { name: "Mother" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Default columns" }));
  expect(screen.getByRole("columnheader", { name: "Mother" })).toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: "Blood type" })).not.toBeInTheDocument();
});

it("opens proceeded request status by mouse and available results by keyboard", async () => {
  repository.requests[0].status = "Ready";
  const user = open("requests", "/?status=Proceeded");
  await user.click(screen.getByRole("row", { name: "Open request LAB-260801" }));
  expect(screen.getByRole("dialog", { name: "Lab request results" })).toHaveTextContent(
    "Awaiting results",
  );
  await user.click(screen.getByRole("button", { name: "Close panel" }));
  repository.requests[0].results = [
    { test: "Test result", value: "12", unit: "units", referenceRange: "10?15" },
  ];
  repository.notify();
  screen.getByRole("row", { name: "Open request LAB-260801" }).focus();
  await user.keyboard("{Enter}");
  const dialog = screen.getByRole("dialog", { name: "Lab request results" });
  expect(dialog).toHaveTextContent("Maya Karim Haddad");
  expect(dialog).toHaveTextContent("NB-260001");
  expect(dialog).toHaveTextContent("3.2 kg");
  expect(dialog).toHaveTextContent("Results available");
  expect(dialog).toHaveTextContent("12");
  expect(dialog).toHaveTextContent("10?15");
});
