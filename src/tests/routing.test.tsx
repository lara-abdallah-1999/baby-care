import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, it } from "vitest";
import { AppRoutes } from "../app";

function Location() {
  return <output data-testid="route">{useLocation().pathname}</output>;
}

it.each(["/baby-care/", "/baby-care/index.html"])(
  "opens the dashboard directly from %s",
  async (url) => {
    render(
      <MemoryRouter basename="/baby-care/" initialEntries={[url]}>
        <AppRoutes />
        <Location />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Welcome!" })).toBeInTheDocument();
    expect(screen.getByTestId("route")).toHaveTextContent(/^\/$/);
    expect(screen.queryByRole("heading", { name: "Page not found" })).not.toBeInTheDocument();
  },
);
