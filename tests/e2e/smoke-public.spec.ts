import { test, expect } from '@playwright/test';

test.describe('Smoke public', () => {
  test('home répond', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('discover répond', async ({ page }) => {
    const res = await page.goto('/discover');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('login répond', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('demo répond', async ({ page }) => {
    const res = await page.goto('/demo');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('signup répond', async ({ page }) => {
    const res = await page.goto('/signup');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('/invite/:code redirige vers signup avec ref', async ({ page }) => {
    await page.goto('/invite/smokeabc');
    await expect(page).toHaveURL(/\/signup\?ref=SMOKEABC/);
  });

  test('dashboard-demo répond', async ({ page }) => {
    const res = await page.goto('/dashboard-demo');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });
});
