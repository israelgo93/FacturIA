/**
 * Punto de extension para cron / edge (Fase 7). En Fase 6 las alertas se disparan
 * desde sincronizarAlertasAutomaticas al abrir el panel de notificaciones.
 */
export async function programarRevisionVencimientos() {
	return { ok: true, message: 'Usar sincronizarAlertasAutomaticas desde notification-engine' };
}
