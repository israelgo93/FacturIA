import { test, expect } from '@playwright/test';

test.describe('Chat IA', () => {
	test('redirige a login si accede al asistente sin autenticacion', async ({ page }) => {
		await page.goto('/asistente');
		await expect(page).toHaveURL(/\/login/);
	});

	test('redirige a login si accede a analisis sin autenticacion', async ({ page }) => {
		await page.goto('/reportes/analisis');
		await expect(page).toHaveURL(/\/login/);
	});
});
