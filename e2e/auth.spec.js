import { test, expect } from '@playwright/test';

test.describe('Autenticacion', () => {
	test('redirige a login si no autenticado', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});

	test('pagina de login carga correctamente', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('login con credenciales invalidas muestra error', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="email"]', 'invalido@test.com');
		await page.fill('input[type="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');
		await expect(page.locator('text=Invalid login credentials').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 10000 });
	});

	test('pagina de registro carga correctamente', async ({ page }) => {
		await page.goto('/registro');
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});
});
