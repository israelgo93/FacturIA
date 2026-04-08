import { test, expect } from '@playwright/test';

test.describe('Trial', () => {
	test('landing page carga sin errores', async ({ page }) => {
		const response = await page.goto('/');
		expect(response.status()).toBeLessThan(500);
	});

	test('pagina de registro es accesible', async ({ page }) => {
		await page.goto('/registro');
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});
});
