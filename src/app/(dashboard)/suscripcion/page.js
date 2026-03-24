import { obtenerSuscripcionActual } from '@/actions/suscripcion-actions';
import SuscripcionClient from './SuscripcionClient';

export default async function SuscripcionPage() {
	const r = await obtenerSuscripcionActual();

	if (r.error) {
		return (
			<p className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.error}</p>
		);
	}

	return <SuscripcionClient suscripcion={r.data} />;
}
