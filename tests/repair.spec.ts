import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("keyboard repair previews exact values offline and retains originals across revisions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try inventory sample" }).click();
  await page.getByRole("checkbox", { name: "I confirm the delimiter" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await expect(page.getByRole("status")).toContainText("5 source rows ready");
  await page.getByRole("checkbox", { name: "I confirm all inventory" }).check();
  await page.getByRole("button", { name: "Check required fields" }).click();
  await expect(page.getByRole("status")).toContainText("1 rows need attention");
  await page.context().setOffline(true);
  await page.getByLabel("Replacement value").fill("Spare stool");
  await page.getByRole("button", { name: "Preview replacement" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("1 cells will change");
  const preview = page.getByRole("region", { name: "Repair preview examples" });
  await expect(
    preview.getByRole("cell", { name: "(empty)", exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("cell", { name: "Spare stool", exact: true }),
  ).toBeVisible();
  // Editing a preview requires another preview before mutation.
  await page.getByLabel("Replacement value").fill("Replacement stool");
  await expect(
    page.getByRole("button", { name: "Apply 1 replacements" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Preview replacement" }).click();
  const apply = page.getByRole("button", { name: "Apply 1 replacements" });
  await apply.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Repair applied. 0 rows",
  );
  await expect(
    page.getByRole("heading", { name: "4. Fill missing values" }),
  ).toBeFocused();
  await expect(
    page.getByText("1 repair steps applied.", { exact: false }),
  ).toBeVisible();
  const original = page.getByRole("region", {
    name: "Scrollable source table",
  });
  await expect(
    original.getByRole("cell", { name: "Replacement stool", exact: true }),
  ).toHaveCount(0);
  await expect(
    original.getByRole("cell", { name: "000123", exact: true }),
  ).toHaveCount(2);
  await expect(
    original.getByRole("cell", { name: "01/02/2026", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview replacement" }).click();
  await expect(page.getByRole("status")).toContainText("0 cells will change");
  await expect(
    page.getByRole("button", { name: "Apply 0 replacements" }),
  ).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/repair-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/repair-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
