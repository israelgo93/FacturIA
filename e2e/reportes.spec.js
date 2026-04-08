import { test, expect } from '@playwright/test';

test.describe('Reportes', () => {
	test('hub de reportes requiere autenticacion', async ({ page }) => {
		await page.goto('/reportes');
		await expect(page).toHaveURL(/\/login/);
	});

	test('ATS requiere autenticacion', async ({ page }) => {
		await page.goto('/reportes/ats');
		await expect(page).toHaveURL(/\/login/);
	});

	test('RDEP requiere autenticacion', async ({ page }) => {
		await page.goto('/reportes/rdep');
		await expect(page).toHaveURL(/\/login/);
	});
});
