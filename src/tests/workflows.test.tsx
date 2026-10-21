import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AppRoutes } from "../app";
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
function open() {
  render(
    <MemoryRouter initialEntries={["/admission"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return userEvent.setup();
}
async function select(user: ReturnType<typeof open>, code = "CASE-2026-00127") {
  await user.type(screen.getByRole("combobox", { name: "Case number" }), code);
  await user.click(await screen.findByRole("option", { name: /Layla Haddad/ }));
}
it("searches by case only, hides search, and resets when changing mother", async () => {
  const user = open();
  await user.type(screen.getByRole("combobox", { name: "Case number" }), "Layla");
  expect(await screen.findByText(/No matching admission/)).toBeInTheDocument();
  await user.clear(screen.getByRole("combobox", { name: "Case number" }));
  await select(user);
  expect(screen.queryByRole("combobox", { name: "Case number" })).not.toBeInTheDocument();
  expect(screen.getByText("Room 204 / Bed 204-A")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Change Mother" }));
  expect(screen.getByRole("combobox", { name: "Case number" })).toHaveValue("");
});
async function selectEmpty(user: ReturnType<typeof open>) {
  await user.type(screen.getByRole("combobox", { name: "Case number" }), "CASE-2026-00131");
  await user.click(await screen.findByRole("option", { name: /Rana Nasser/ }));
}
it("confirms two baby forms, creates both, and opens the child table", async () => {
  const user = open();
  await selectEmpty(user);
  await user.clear(screen.getByLabelText("Number of babies"));
  await user.type(screen.getByLabelText("Number of babies"), "2");
  await user.click(screen.getByRole("button", { name: "Confirm count" }));
  for (let i = 1; i <= 2; i++) {
    const group = within(screen.getByRole("group", { name: `Baby ${i}` }));
    await user.clear(group.getByLabelText("First Name"));
    await user.type(group.getByLabelText("First Name"), `Child ${i}`);
    expect(group.getByLabelText("Height (cm)")).toHaveValue(0);
    expect(group.getByLabelText("Head circumference (cm)")).toHaveValue(0);
    await user.clear(group.getByLabelText("Height (cm)"));
    await user.type(group.getByLabelText("Height (cm)"), "50");
    await user.clear(group.getByLabelText("Head circumference (cm)"));
    await user.type(group.getByLabelText("Head circumference (cm)"), "34");
    await user.click(group.getByRole("button", { name: "Maturity status Not assessed" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Maturity status" })).getByRole("button", {
        name: "Term",
      }),
    );
    await user.click(group.getByRole("radio", { name: "Female" }));
    await user.type(group.getByLabelText("Birth time"), "10:20");
    await user.clear(group.getByLabelText("Weight (kg)"));
    await user.type(group.getByLabelText("Weight (kg)"), "3.1");
  }
  await user.click(screen.getAllByRole("button", { name: "Add Baby" }).at(-1)!);
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(repository.babies).toHaveLength(8);
  expect(repository.persons).toHaveLength(8);
  expect(repository.babies.at(-1)).toMatchObject({
    height: 50,
    headCircumference: 34,
    maturityStatus: "Term",
  });
  expect(screen.getByText("Child 1")).toBeInTheDocument();
});
it("prints mother and child bracelets directly without a preview modal", async () => {
  const user = open();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  await select(user);
  await user.click(screen.getByRole("button", { name: "Print Mother's bracelet" }));
  expect(print).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.querySelector(".bracelet-direct-print")).toHaveTextContent("PT-10482");
  await user.click(screen.getByRole("button", { name: "View Children" }));
  await user.click(await screen.findByRole("button", { name: /Print bracelet for Maya/ }));
  expect(print).toHaveBeenCalledTimes(2);
  expect(document.querySelector(".bracelet-direct-print")).toHaveTextContent("NB-260001");
  print.mockRestore();
});
it("requires confirmation, allows cancel, and retries partial processing safely", async () => {
  const user = open();
  await select(user);
  await user.click(screen.getByRole("button", { name: "Lab Requests" }));
  await user.click(await screen.findByRole("button", { name: /Maya Karim Haddad/ }));
  await user.click(screen.getByRole("button", { name: /^LAB-260801/ }));
  await user.click(screen.getByRole("button", { name: "Proceed LAB-260801" }));
  expect(repository.queue).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(repository.queue).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Proceed LAB-260801" }));
  repository.failure = "admission";
  await user.click(screen.getByRole("button", { name: "Confirm and proceed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("safely queued");
  await user.click(screen.getByRole("button", { name: "Retry Proceed" }));
  expect(await screen.findByRole("status")).toHaveTextContent("LAB-260801 proceeded");
  expect(repository.queue).toHaveLength(1);
});

it("pauses forms while editing the count and preserves entered details on confirmation", async () => {
  const user = open();
  await selectEmpty(user);
  await user.click(screen.getByRole("button", { name: "Confirm count" }));
  expect(screen.queryByLabelText("Middle Name")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Last Name")).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText("First Name"));
  await user.type(screen.getByLabelText("First Name"), "Lina");
  await user.click(screen.getByLabelText("Number of babies"));
  expect(screen.getByLabelText("First Name")).toBeDisabled();
  expect(screen.getAllByRole("button", { name: "Add Baby" }).at(-1)!).toBeDisabled();
  await user.clear(screen.getByLabelText("Number of babies"));
  await user.type(screen.getByLabelText("Number of babies"), "2");
  await user.click(screen.getByRole("button", { name: "Confirm count" }));
  expect(screen.getAllByLabelText("First Name")[0]).toHaveValue("Lina");
  expect(screen.getAllByLabelText("First Name")[0]).toBeEnabled();
  expect(screen.getAllByRole("group", { name: /^Baby [12]$/ })).toHaveLength(2);
});

it("numbers default names when the birth count changes and makes all names required", async () => {
  const user = open();
  await selectEmpty(user);
  await user.click(screen.getByRole("button", { name: "Confirm count" }));
  expect(screen.getByLabelText("First Name")).toHaveValue("baby of Rana");
  for (const label of ["First Name"]) expect(screen.getByLabelText(label)).toBeRequired();
  expect(screen.queryByRole("button", { name: /Remove Baby/ })).not.toBeInTheDocument();
  await user.click(screen.getByLabelText("Number of babies"));
  await user.clear(screen.getByLabelText("Number of babies"));
  await user.type(screen.getByLabelText("Number of babies"), "2");
  await user.click(screen.getByRole("button", { name: "Confirm count" }));
  expect(
    screen.getAllByLabelText("First Name").map((input) => (input as HTMLInputElement).value),
  ).toEqual(["baby1 of Rana", "baby2 of Rana"]);
  expect(screen.queryByRole("button", { name: /Blood type Unknown/ })).not.toBeInTheDocument();
});
it("opens the child's requests directly and reuses data when switching tabs", async () => {
  const load = vi.spyOn(repository, "wait");
  const user = open();
  await select(user);
  await user.click(screen.getByRole("button", { name: "View Children" }));
  const shortcut = await screen.findByRole("button", {
    name: "Lab requests for Maya Karim Haddad",
  });
  const calls = load.mock.calls.length;
  await user.click(shortcut);
  expect(screen.getByRole("button", { name: /Maya Karim Haddad/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: /^LAB-260801/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "View Children" }));
  await user.click(screen.getByRole("button", { name: "Lab Requests" }));
  expect(load).toHaveBeenCalledTimes(calls);
  load.mockRestore();
});
it("redirects the removed babies register to registration", () => {
  render(
    <MemoryRouter initialEntries={["/baby-admissions"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Newborn Registration and Lab Requests" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Admitted Babies" })).not.toBeInTheDocument();
});
it("opens a lab register row with the correct child and a glowing selected request", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/lab-request-register"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  const row = screen.getByText("LAB-260802").closest("tr")!;
  await user.click(within(row).getByRole("link"));
  expect(await screen.findByRole("button", { name: "Lab Requests" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  const request = await screen.findByRole("button", { name: /^LAB-260802/ });
  expect(request).toHaveAttribute("aria-pressed", "true");
  expect(request.closest(".request-row")).toHaveClass("request-highlight");
  expect(screen.getByRole("button", { name: /Maya Karim Haddad/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
it("shows an unlinked request without selecting an unrelated baby", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/lab-request-register?q=LAB-260806"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  await user.click(within(screen.getByRole("table")).getByRole("link"));
  expect(await screen.findByText("This request is not linked to a child yet.")).toBeInTheDocument();
  expect(screen.getByText("LAB-260806").closest(".request-row")).toHaveClass("request-highlight");
});
it("opens a register record immediately without flashing the admission search", () => {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/admission", state: { motherId: "m1", tab: "view" } }]}
    >
      <AppRoutes />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole("heading", { name: "Newborn Registration and Lab Requests" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Print bracelet for Maya Karim Haddad" }),
  ).toBeInTheDocument();
});
it("blocks another registration and allows correcting existing children", async () => {
  const user = open();
  await select(user);
  expect(screen.getByRole("heading", { name: "Children already registered" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Confirm count" })).not.toBeInTheDocument();
  await user.click(screen.getAllByRole("button", { name: "View Children" })[0]);
  await user.click(screen.getByRole("button", { name: "Edit children" }));
  expect(screen.getByLabelText("First Name")).toHaveValue("Maya");
  expect(screen.getByLabelText("Number of babies")).toHaveValue(1);
  const id = repository.babies[0].id;
  await user.clear(screen.getByLabelText("First Name"));
  await user.type(screen.getByLabelText("First Name"), "Maya corrected");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    await screen.findByRole("button", { name: "Print bracelet for Maya corrected Karim Haddad" }),
  ).toBeInTheDocument();
  expect(
    repository.babies[0].id === id ||
      repository.babies.some((baby) => baby.id === id && baby.firstName === "Maya corrected"),
  ).toBe(true);
  expect(repository.babies).toHaveLength(6);
});
