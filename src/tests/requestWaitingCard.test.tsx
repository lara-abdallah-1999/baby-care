import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import { RequestWaitingCard } from "../components/RequestWaitingCard";
import { repository } from "../repositories/mockRepository";
import { chartDates } from "../hooks/useRegisters";

it("counts actual results for processed requests and excludes pending requests", () => {
  const template = repository.requests[0];
  const results = [{ test: "CBC", value: "12", unit: "g/dL" }];
  repository.requests = [
    { ...template, id: "with", status: "Ready", results },
    { ...template, id: "without", status: "Ready", results: [] },
    {
      ...template,
      id: "flag-only",
      status: "Ready",
      resultStatus: "Results available",
      results: undefined,
    },
    { ...template, id: "pending", status: "Pending", results },
  ];
  render(
    <MemoryRouter>
      <RequestWaitingCard />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Proceeded date")).toHaveValue(
    chartDates(1)[0].split("-").reverse().join("/"),
  );
  fireEvent.click(screen.getByRole("button", { name: "All dates" }));
  expect(
    screen.getByText("Total proceeded").parentElement?.querySelector("strong"),
  ).toHaveTextContent("3");
  expect(screen.getByText("With results").parentElement?.querySelector("strong")).toHaveTextContent(
    "1",
  );
  expect(
    screen.getByText("Without results").parentElement?.querySelector("strong"),
  ).toHaveTextContent("2");
  expect(screen.getByRole("link", { name: /With results/ })).toHaveAttribute(
    "href",
    "/lab-request-register?status=Proceeded&results=available",
  );
});

it("shows an empty state without invalid percentages", () => {
  repository.requests = [];
  render(
    <MemoryRouter>
      <RequestWaitingCard />
    </MemoryRouter>,
  );
  expect(screen.getByText("No processed requests yet")).toBeInTheDocument();
});

it("filters by proceeded date rather than request date and preserves that date in the table link", () => {
  const template = repository.requests[0];
  repository.requests = [
    {
      ...template,
      id: "selected",
      status: "Ready",
      requestedAt: "2026-10-20T10:00",
      proceededAt: "2026-10-22T12:00",
      results: [{ test: "CBC", value: "12" }],
    },
    {
      ...template,
      id: "other",
      status: "Ready",
      requestedAt: "2026-10-22T10:00",
      proceededAt: "2026-10-23T12:00",
      results: [],
    },
    { ...template, id: "unknown", status: "Ready", proceededAt: undefined, results: [] },
  ];
  render(
    <MemoryRouter>
      <RequestWaitingCard />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Proceeded date"), { target: { value: "2026-10-22" } });
  expect(
    screen.getByText("Total proceeded").parentElement?.querySelector("strong"),
  ).toHaveTextContent("1");
  expect(screen.getByRole("link", { name: /With results/ })).toHaveAttribute(
    "href",
    "/lab-request-register?status=Proceeded&dateField=proceeded&from=2026-10-22&to=2026-10-22&results=available",
  );
  expect(screen.getByRole("link", { name: /Without results/ })).toHaveAttribute(
    "href",
    "/lab-request-register?status=Proceeded&dateField=proceeded&from=2026-10-22&to=2026-10-22&results=unavailable",
  );
  fireEvent.click(screen.getByRole("button", { name: "All dates" }));
  expect(
    screen.getByText("Total proceeded").parentElement?.querySelector("strong"),
  ).toHaveTextContent("3");
});
