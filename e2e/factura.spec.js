import { test, expect } from '@playwright/test';

test.describe('Comprobantes', () => {
	test('redirige a login si accede a comprobantes sin autenticacion', async ({ page }) => {
		await page.goto('/comprobantes');
		await expect(page).toHaveURL(/\/login/);
	});

	test('redirige a login si accede a nuevo comprobante sin autenticacion', async ({ page }) => {
		await page.goto('/comprobantes/nuevo');
		await expect(page).toHaveURL(/\/login/);
	});
});
