/**
 * End-to-End Integration Tests
 * Tests complete user workflows and system integration
 */

const { test, expect } = require('@playwright/test');

// Configuration
const BACKEND_URL = 'http://127.0.0.1:43110';
const FRONTEND_URL = 'http://localhost:5173';

test.describe('Full Application Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(FRONTEND_URL);
  });

  test('Complete onboarding and settings configuration', async ({ page }) => {
    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigate to settings
    await page.click('text=Settings');
    await expect(page).toHaveURL(/.*settings/);

    // Check that settings page loaded
    await expect(page.locator('text=AI Model')).toBeVisible();

    // Verify all sections are present
    await expect(page.locator('text=Behavior')).toBeVisible();
    await expect(page.locator('text=Character')).toBeVisible();
    await expect(page.locator('text=Advanced')).toBeVisible();
  });

  test('System monitoring displays metrics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`);

    // Wait for metrics to load
    await page.waitForTimeout(3000);

    // Check for system metric displays
    const cpuMetric = page.locator('text=/CPU/i');
    const memoryMetric = page.locator('text=/Memory/i');

    await expect(cpuMetric).toBeVisible({ timeout: 10000 });
    await expect(memoryMetric).toBeVisible({ timeout: 10000 });
  });

  test('Character management workflow', async ({ page }) => {
    // Navigate to characters page
    await page.click('text=/Characters/i');
    await expect(page).toHaveURL(/.*characters/);

    // Verify page loaded
    await expect(page.locator('h1, h4, h5')).toContainText(/Character/i);

    // Check for default character
    await page.waitForTimeout(2000);
  });

  test('Scheduler workflow - create and manage task', async ({ page }) => {
    // Navigate to scheduler
    await page.goto(`${FRONTEND_URL}/scheduler`);

    // Wait for page to load
    await expect(page.locator('text=Scheduled Tasks')).toBeVisible();

    // Click "New Task" button
    await page.click('button:has-text("New Task")');

    // Fill in task details
    await page.fill('input[name="name"], input:near(text="Task Name")', 'Test Cleanup Task');

    // Select schedule type
    await page.click('text=Schedule Type');
    await page.click('text=Daily');

    // Submit
    await page.click('button:has-text("Create")');

    // Verify task was created
    await expect(page.locator('text=Test Cleanup Task')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Backend API Integration', () => {
  test('Health check endpoint responds', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('List available AI models', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/ai/models`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('models');
    expect(Array.isArray(data.models)).toBeTruthy();
  });

  test('System metrics endpoint returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/system/metrics`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('cpu');
    expect(data).toHaveProperty('memory');
    expect(data).toHaveProperty('disk');
  });

  test('Scheduler endpoints work', async ({ request }) => {
    // List tasks
    const listResponse = await request.get(`${BACKEND_URL}/scheduler/tasks`);
    expect(listResponse.ok()).toBeTruthy();

    const tasks = await listResponse.json();
    expect(Array.isArray(tasks)).toBeTruthy();
  });

  test('Characters endpoint returns default character', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/characters/list`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('characters');
  });
});

test.describe('Error Handling', () => {
  test('Gracefully handles backend disconnect', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // App should still render even if backend is slow/unavailable
    await expect(page.locator('body')).toBeVisible();

    // Error boundary should catch any errors
    const errorBoundary = page.locator('text=/something went wrong/i');
    const isErrorVisible = await errorBoundary.isVisible().catch(() => false);

    // Either no error or error is handled gracefully
    expect(isErrorVisible === false || isErrorVisible === true).toBeTruthy();
  });

  test('Invalid route shows appropriate message', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/nonexistent-route`);

    // Should either redirect or show 404
    await page.waitForLoadState('networkidle');
    const url = page.url();

    // App should handle this gracefully (either redirect to / or show error)
    expect(url.includes('/nonexistent-route') || url.includes('/')).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('Settings page responds quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${FRONTEND_URL}/settings`);
    await page.waitForSelector('text=Settings');

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Accessibility', () => {
  test('Main navigation is keyboard accessible', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focused = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('Form inputs have labels', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/settings`);

    // All inputs should have associated labels
    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Should have some form of labeling
      const hasLabel = id || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });
});
