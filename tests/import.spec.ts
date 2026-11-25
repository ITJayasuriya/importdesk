import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("explicit sample confirmation preserves source, keyboard controls and privacy", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Try inventory sample" }).click();
  const importButton = page.getByRole("button", {
    name: "Import source preview",
  });
  await expect(importButton).toBeDisabled();
  await page.getByRole("checkbox", { name: "I confirm" }).focus();
  await page.keyboard.press("Space");
  // macOS WebKit uses Option-Tab to include native buttons in keyboard navigation.
  await page.keyboard.press(
    browserName === "webkit" && process.platform === "darwin"
      ? "Alt+Tab"
      : "Tab",
  );
  await expect(importButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("5 source rows ready");
  await expect(
    page.getByRole("cell", { name: "000123", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("cell", { name: "01/02/2026", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "(empty)", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: /^=HYPERLINK/ })).toBeVisible();
  expect(
    requests.filter(
      (url) =>
        !url.startsWith("http://127.0.0.1:4171/") && !url.startsWith("blob:"),
    ),
  ).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/source-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/source-mobile.png",
    fullPage: true,
  });
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Try inventory sample" }).click();
  await page.getByRole("checkbox", { name: "I confirm" }).check();
  await importButton.click();
  await expect(page.getByRole("status")).toContainText("5 source rows ready");
});

test("pagination and recoverable errors keep confirmed source", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose CSV").setInputFiles({
    name: "paged.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id\n" +
        Array.from({ length: 101 }, (_, i) => String(i).padStart(6, "0")).join(
          "\n",
        ),
    ),
  });
  await page.getByRole("checkbox", { name: "I confirm" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await expect(page.getByRole("status")).toContainText("101 source rows ready");
  await expect(page.locator("tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("cell", { name: "000100" })).toBeVisible();
  await page.getByLabel("Choose CSV").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([255]),
  });
  await page.getByRole("checkbox", { name: "I confirm" }).check();
  await page.getByRole("button", { name: "Import source preview" }).click();
  await expect(page.getByRole("alert")).toContainText("UTF-8");
  await expect(page.getByRole("alert")).toBeFocused();
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(50);
});
