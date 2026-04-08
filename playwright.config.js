import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30000,
	expect: { timeout: 5000 },
	fullyParallel: false,
	retries: 1,
	workers: 1,
	reporter: 'html',
	use: {
		baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	webServer: process.env.CI
		? undefined
		: {
			command: 'npm run dev',
			url: 'http://localhost:3000',
			reuseExistingServer: true,
			timeout: 60000,
		},
});
