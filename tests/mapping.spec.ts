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
  const check = page.getByRole("button", { name: "Check inventory values" });
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
  await expect(page.getByRole("status")).toContainText("4 rows need attention");
  await expect(
    page.getByText(
      "5 source rows = 1 passing inventory rules + 4 needing attention.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "REQUIRED_EMPTY" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "000123", exact: true }),
  ).toHaveCount(4);
  await expect(
    page
      .locator('[aria-label="Scrollable source table"]')
      .getByRole("cell", { name: "01/02/2026", exact: true }),
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
    page.getByRole("heading", { name: "Inventory validation results" }),
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
  await page.getByRole("button", { name: "Check inventory values" }).click();
  await expect(page.getByRole("status")).toContainText("1 rows need attention");
});

test("inventory validation reports every duplicate member, invalid dates and integer syntax without changing source", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose CSV").setInputFiles({
    name: "rules.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "asset_id,label,category,location,inspection_date,quantity\n0001,A,x,Hall,2026-02-30,1.5\n0001,B,x,Hall,2024-02-29,1\n1,C,x,Hall,2026-02-01,-2",
    ),
  });
  await page.getByRole("checkbox", { name: "I confirm the delimiter" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await page.getByRole("checkbox", { name: "I confirm all inventory" }).check();
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Check inventory values" }).click();
  await expect(page.getByRole("status")).toContainText("2 rows need attention");
  const issues = page.locator('[aria-label="Inventory issue examples"]');
  await expect(
    issues.getByRole("cell", { name: "DUPLICATE_ID", exact: true }),
  ).toHaveCount(2);
  await expect(
    issues.getByRole("cell", { name: "DATE_INVALID", exact: true }),
  ).toHaveCount(1);
  await expect(
    issues.getByRole("cell", { name: "INTEGER_FORMAT", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText(
      "3 source rows = 1 passing inventory rules + 2 needing attention.",
      { exact: false },
    ),
  ).toBeVisible();
  const original = page.locator('[aria-label="Scrollable source table"]');
  await expect(
    original.getByRole("cell", { name: "0001", exact: true }),
  ).toHaveCount(2);
  await expect(
    original.getByRole("cell", { name: "1.5", exact: true }),
  ).toBeVisible();
});
