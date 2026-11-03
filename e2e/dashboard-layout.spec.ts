import { expect, test } from "@playwright/test";

test("dashboard stretches across desktop heights and stacks on phones", async ({ page }) => {
  const heights: number[] = [];
  for (const height of [720, 1080]) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Processed request results" })).toBeVisible();
    const chart = await page.locator(".dashboard-chart").first().boundingBox();
    heights.push(chart!.height);
    const waiting = await page.locator(".request-waiting-card").boundingBox();
    expect(waiting!.y).toBeGreaterThanOrEqual(chart!.y + chart!.height);
  }
  expect(heights[1]).toBeGreaterThan(heights[0]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: /With results/ }).click();
  await expect(page).toHaveURL(/status=Proceeded/);
});

test("request row count follows available height and respects manual selection", async ({
  page,
}) => {
  const counts: number[] = [];
  for (const height of [720, 1080]) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto("/lab-request-register");
    const auto = page.getByRole("button", { name: /Rows per page Auto/ });
    await expect(auto).toBeVisible();
    counts.push(Number((await auto.innerText()).match(/Auto \((\d+)\)/)![1]));
    const footer = await page.locator(".register-pagination").boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(height);
  }
  expect(counts[1]).toBeGreaterThan(counts[0]);
  await page.getByRole("button", { name: /Rows per page Auto/ }).click();
  await page
    .getByRole("dialog", { name: "Rows per page" })
    .getByRole("button", { name: "5", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(page.getByRole("button", { name: "Rows per page 5", exact: true })).toBeVisible();
});
