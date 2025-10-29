import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage to simulate first-time user
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('completes full onboarding flow', async ({ page }) => {
    await page.goto('/');

    // Should redirect to onboarding if not completed
    await expect(page).toHaveURL(/onboarding/);

    // Step 1: Welcome
    await expect(page.getByRole('heading', { name: /Welcome to Clippy Revival/i })).toBeVisible();
    await expect(page.getByText(/AI-Powered Assistance/i)).toBeVisible();

    // Click Next to go to System Check
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: System Check
    await expect(page.getByRole('heading', { name: /System Check/i })).toBeVisible();

    // Wait for checks to complete (look for success or error icons)
    await page.waitForSelector('[data-testid="backend-status"]', { timeout: 10000 }).catch(() => {
      // Fallback if data-testid not present
      return page.waitForTimeout(3000);
    });

    // Click Next to go to AI Setup
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: AI Setup
    await expect(page.getByRole('heading', { name: /AI Setup/i })).toBeVisible();

    // Click Next to go to Complete
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Complete
    await expect(page.getByRole('heading', { name: /You're All Set!/i })).toBeVisible();

    // Click Get Started
    await page.getByRole('button', { name: /get started/i }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Verify onboarding completion is saved
    const onboardingCompleted = await page.evaluate(() =>
      localStorage.getItem('onboardingCompleted')
    );
    expect(onboardingCompleted).toBe('true');
  });

  test('allows skipping onboarding', async ({ page }) => {
    await page.goto('/onboarding');

    // Click Skip button
    await page.getByRole('button', { name: /skip setup/i }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Verify onboarding completion is saved
    const onboardingCompleted = await page.evaluate(() =>
      localStorage.getItem('onboardingCompleted')
    );
    expect(onboardingCompleted).toBe('true');
  });

  test('allows going back through steps', async ({ page }) => {
    await page.goto('/onboarding');

    // Go forward to step 2
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('heading', { name: /System Check/i })).toBeVisible();

    // Go back to step 1
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome to Clippy Revival/i })).toBeVisible();

    // Back button should be disabled on first step
    const backButton = page.getByRole('button', { name: /back/i });
    await expect(backButton).toBeDisabled();
  });

  test('disables skip button on final step', async ({ page }) => {
    await page.goto('/onboarding');

    // Navigate to final step
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(500);
    }

    // Skip button should be disabled
    const skipButton = page.getByRole('button', { name: /skip setup/i });
    await expect(skipButton).toBeDisabled();
  });

  test('shows system check progress indicators', async ({ page }) => {
    await page.goto('/onboarding');

    // Navigate to System Check
    await page.getByRole('button', { name: /next/i }).click();

    // Should show checking indicators
    await expect(page.getByText(/Backend Service/i)).toBeVisible();
    await expect(page.getByText(/Ollama/i)).toBeVisible();
    await expect(page.getByText(/AI Models/i)).toBeVisible();
  });
});

test.describe('Onboarding Completed State', () => {
  test.beforeEach(async ({ page }) => {
    // Set onboarding as completed
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('onboardingCompleted', 'true');
    });
  });

  test('does not redirect to onboarding when completed', async ({ page }) => {
    await page.goto('/');

    // Should stay on dashboard or homepage, not redirect to onboarding
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).not.toContain('onboarding');
  });

  test('can access onboarding manually via URL', async ({ page }) => {
    await page.goto('/onboarding');

    // Should still be able to view onboarding page
    await expect(page.getByRole('heading', { name: /Welcome to Clippy Revival/i })).toBeVisible();
  });
});
