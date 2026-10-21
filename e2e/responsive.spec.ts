import { expect, test, type Page } from "@playwright/test";

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
}

for (const width of [320, 390, 768, 1440]) {
  test(`workspace remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
    const summaryFits = await page.locator(".overview-stats").evaluate((element) => {
      const banner = element.closest(".overview-banner")!.getBoundingClientRect();
      return element.getBoundingClientRect().bottom <= banner.bottom;
    });
    expect(summaryFits).toBe(true);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });

    await page
      .getByRole("link", { name: "Newborn Registration and Lab Requests", exact: true })
      .click();
    const search = page.locator("main").getByRole("combobox");
    await search.fill("CASE-2026-00127");
    await page.getByRole("option").first().click();
    await expect(page.getByRole("region", { name: "Selected mother" })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "View Children", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit children", exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `artifacts/children-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Edit children", exact: true }).click();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `artifacts/form-${width}.png`, fullPage: true });

    await page.getByRole("link", { name: "Lab Requests Register", exact: true }).click();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(page.getByRole("region", { name: "Register filters" })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `artifacts/register-${width}.png`, fullPage: true });
    await page.getByRole("switch", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectNoPageOverflow(page);
  });
}

test.describe("phone touch workflow", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("processes a request and opens results without losing actions", async ({ page }) => {
    await page.goto("/admission");
    await page.locator("main").getByRole("combobox").fill("CASE-2026-00127");
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Lab Requests", exact: true }).click();
    await page.getByRole("button", { name: /Maya Karim Haddad/ }).click();
    await page.getByRole("button", { name: /^LAB-260801/ }).click();
    await page.getByRole("button", { name: "Proceed LAB-260801", exact: true }).click();
    const confirmation = page.getByRole("dialog", { name: "Confirm request" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Confirm and proceed" }).click();
    await expect(page.getByRole("status")).toContainText("LAB-260801 proceeded");
    await page.getByRole("button", { name: /^LAB-260801/ }).click();
    await expect(page.getByRole("dialog", { name: "Lab request results" })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: "artifacts/results-phone.png", fullPage: true });
    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
