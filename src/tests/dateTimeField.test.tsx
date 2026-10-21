import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, it } from "vitest";
import { DateTimeField } from "../components/DateTimeField";

beforeEach(() => {
  // jsdom does not implement the native dialog methods.
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
function Example({ kind }: { kind: "date" | "time" }) {
  const [value, setValue] = useState(kind === "date" ? "2026-10-06" : "09:12");
  return <DateTimeField kind={kind} value={value} onChange={setValue} onBlur={() => undefined} />;
}
it("selects a date from the calendar and closes it", async () => {
  const user = userEvent.setup();
  render(<Example kind="date" />);
  await user.click(screen.getByRole("button", { name: "Choose birth date" }));
  await user.click(screen.getByRole("button", { name: "2026-10-14" }));
  expect(screen.getByLabelText("Birth date")).toHaveValue("14/10/2026");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("applies precise hours and minutes from the time panel", async () => {
  const user = userEvent.setup();
  render(<Example kind="time" />);
  await user.click(screen.getByRole("button", { name: "Choose birth time" }));
  await user.clear(screen.getByLabelText("Hour"));
  await user.type(screen.getByLabelText("Hour"), "14");
  await user.clear(screen.getByLabelText("Minute"));
  await user.type(screen.getByLabelText("Minute"), "45");
  expect(screen.queryByRole("button", { name: /Set minutes/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Apply time" }));
  expect(screen.getByLabelText("Birth time")).toHaveValue("14:45");
});

it("uses day/month/year when typing and keeps the calendar date in sync", async () => {
  const user = userEvent.setup();
  render(<Example kind="date" />);
  const input = screen.getByLabelText("Birth date");
  expect(input).toHaveValue("06/10/2026");
  await user.clear(input);
  await user.type(input, "14/02/2026");
  expect(input).toHaveValue("14/02/2026");
  await user.click(screen.getByRole("button", { name: "Choose birth date" }));
  expect(screen.getByRole("button", { name: "2026-02-14" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
