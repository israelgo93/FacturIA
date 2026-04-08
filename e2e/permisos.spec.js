import { test, expect } from '@playwright/test';

test.describe('Permisos', () => {
	test('configuracion requiere autenticacion', async ({ page }) => {
		await page.goto('/configuracion');
		await expect(page).toHaveURL(/\/login/);
	});

	test('equipo requiere autenticacion', async ({ page }) => {
		await page.goto('/equipo');
		await expect(page).toHaveURL(/\/login/);
	});

	test('onboarding requiere autenticacion', async ({ page }) => {
		await page.goto('/onboarding');
		await expect(page).toHaveURL(/\/login/);
	});
});
