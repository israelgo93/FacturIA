export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		console.log('[facturIA] Server instrumentation registered');
	}
}
