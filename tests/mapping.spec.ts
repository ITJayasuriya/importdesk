import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("inventory mapping is confirmed, invalidated on edit and checks original values offline", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try inventory sample" }).click();
  await page.getByRole("checkbox", { name: "I confirm the delimiter" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await expect(page.getByRole("status")).toContainText("5 source rows ready");
  const check = page.getByRole("button", { name: "Check required fields" });
  await expect(check).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Asset ID", exact: true }),
  ).toHaveValue("0");
  await page
    .getByRole("combobox", { name: "Label", exact: true })
    .selectOption("0");
  await expect(
    page.getByText("Label: source column is mapped more than once."),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "I confirm all inventory" }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Label", exact: true })
    .selectOption("1");
  await page.getByRole("checkbox", { name: "I confirm all inventory" }).check();
  await page.context().setOffline(true);
  await check.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("1 rows need attention");
  await expect(
    page.getByText(
      "5 source rows = 4 with required values + 1 needing attention.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "REQUIRED_EMPTY" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "000123", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("cell", { name: "01/02/2026", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/mapping-desktop.png",
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
    path: "test-results/mapping-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("combobox", { name: "Label", exact: true })
    .selectOption("2");
  await expect(
    page.getByRole("heading", { name: "Required-field results" }),
  ).toHaveCount(0);
  await expect(check).toBeDisabled();
});

test("duplicate headers require a deliberate positional choice; extra columns are disclosed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose CSV").setInputFiles({
    name: "duplicate.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "asset_id,asset_id,label,category,location,inspection_date,quantity,extra\n0001,0002,Chair,furniture,Hall,01/02/2026,1,keep",
    ),
  });
  await page.getByRole("checkbox", { name: "I confirm the delimiter" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await expect(page.getByRole("status")).toContainText("1 source rows ready");
  await expect(
    page.getByRole("combobox", { name: "Asset ID", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByText("Asset ID: choose a source column."),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Asset ID", exact: true })
    .selectOption("1");
  await expect(page.getByText(/Unmapped source columns:/)).toContainText(
    "extra (#8)",
  );
  await page.getByRole("checkbox", { name: "I confirm all inventory" }).check();
  await page.getByRole("button", { name: "Check required fields" }).click();
  await expect(page.getByRole("status")).toContainText("0 rows need attention");
});
