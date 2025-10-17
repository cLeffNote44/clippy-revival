import { test, expect } from '@playwright/test';

// Basic E2E sanity test for the renderer

test.describe('Dashboard', () => {
  test('loads dashboard page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Clippy Revival/i);

    // Check navigation elements exist (adjust selectors to your UI)
    const settingsLink = page.locator('a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
  });
});
