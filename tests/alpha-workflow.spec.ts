import { test, expect } from '../playwright.config';

// Test the complete alpha workflow: CSV upload -> schema selection -> column mapping -> validation fixes -> export

test.describe('Alpha Workflow', () => {
  test('Main sample journey works end-to-end', async ({ page }) => {
    // Step 1: Upload a sample CSV file
    await page.goto('/');
    
    // Use the sample CSV from fixtures
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/sample-inventory.csv');
    
    // Verify we're on the mapping screen
    await expect(page).toHaveURL(/.*/map/);
    await expect(page.locator('h1')).toContainText('Map Columns');
    
    // Step 2: Confirm the detected delimiter and header row
    await expect(page.locator('text=Detected delimiter: comma')).toBeVisible();
    await expect(page.locator('text=Header row detected')).toBeVisible();
    await page.click('button:has-text("Continue")');
    
    // Step 3: Map columns to destination schema
    await expect(page.locator('h1')).toContainText('Map Columns');
    
    // Map asset_id
    const assetIdMapping = page.locator('text="asset_id" >> ..').locator('select');
    await assetIdMapping.selectOption('asset_id');
    
    // Map label
    const labelMapping = page.locator('text="label" >> ..').locator('select');
    await labelMapping.selectOption('label');
    
    // Map category
    const categoryMapping = page.locator('text="category" >> ..').locator('select');
    await categoryMapping.selectOption('category');
    
    // Map location
    const locationMapping = page.locator('text="location" >> ..').locator('select');
    await locationMapping.selectOption('location');
    
    // Map inspection_date
    const inspectionDateMapping = page.locator('text="inspection_date" >> ..').locator('select');
    await inspectionDateMapping.selectOption('inspection_date');
    
    // Map quantity
    const quantityMapping = page.locator('text="quantity" >> ..').locator('select');
    await quantityMapping.selectOption('quantity');
    
    // Continue to review
    await page.click('button:has-text("Continue to Review")');
    
    // Step 4: Review and fix validation issues
    await expect(page).toHaveURL(/.*/review/);
    await expect(page.locator('h1')).toContainText('Review Issues');
    
    // Check for validation issues
    const issuesList = page.locator('.issues-list');
    await expect(issuesList).toBeVisible();
    
    // Apply a fix for a specific issue type
    const fixButton = page.locator('button:has-text("Fix Selected")');
    if (await fixButton.isVisible()) {
      await fixButton.click();
      
      // Confirm the fix was applied
      await expect(page.locator('.toast')).toContainText('Fix applied successfully');
    }
    
    // Continue to export
    await page.click('button:has-text("Continue to Export")');
    
    // Step 5: Export the cleaned CSV
    await expect(page).toHaveURL(/.*/export/);
    await expect(page.locator('h1')).toContainText('Export Data');
    
    // Check export summary
    await expect(page.locator('.export-summary')).toBeVisible();
    
    // Download the cleaned CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Clean CSV")');
    const download = await downloadPromise;
    
    // Verify the download
    expect(download.suggestedFilename()).toMatch(/^cleaned-.*\.csv$/);
    
    // Verify we can navigate back to the main screen
    await page.click('button:has-text("New Import")');
    await expect(page).toHaveURL('/');
  });
});