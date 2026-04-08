import { createClient } from '@/lib/supabase/server';
import { verificarAccesoFeature } from '@/lib/suscripciones/subscription-guard';
import FeatureGate from '@/components/suscripcion/FeatureGate';
import AnalisisClient from './AnalisisClient';

export default async function AnalisisPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return null;

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	const allowed = empresa ? await verificarAccesoFeature(empresa.id, 'reportes_ia') : false;

	return (
		<FeatureGate allowed={allowed} featureName="Reportes IA" planRequerido="Professional">
			<AnalisisClient />
		</FeatureGate>
	);
}
