import { test, expect } from '@playwright/test';

test.describe('Suscripcion', () => {
	test('redirige a login si accede a suscripcion sin autenticacion', async ({ page }) => {
		await page.goto('/suscripcion');
		await expect(page).toHaveURL(/\/login/);
	});
});
