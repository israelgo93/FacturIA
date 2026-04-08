import { test, expect } from '@playwright/test';

test.describe('Admin', () => {
	test('redirige a login si accede a admin sin autenticacion', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login/);
	});

	test('redirige a login en admin/empresas sin autenticacion', async ({ page }) => {
		await page.goto('/admin/empresas');
		await expect(page).toHaveURL(/\/login/);
	});

	test('redirige a login en admin/suscripciones sin autenticacion', async ({ page }) => {
		await page.goto('/admin/suscripciones');
		await expect(page).toHaveURL(/\/login/);
	});

	test('API admin metricas retorna 403 sin autenticacion', async ({ request }) => {
		const response = await request.get('/api/admin/metricas');
		expect(response.status()).toBe(403);
	});
});
