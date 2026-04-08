import { createClient } from '@/lib/supabase/server';
import { verificarAccesoFeature } from '@/lib/suscripciones/subscription-guard';
import FeatureGate from '@/components/suscripcion/FeatureGate';
import RDEPClient from './RDEPClient';

export default async function RDEPPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return null;

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	const allowed = empresa ? await verificarAccesoFeature(empresa.id, 'rdep') : false;

	return (
		<FeatureGate allowed={allowed} featureName="RDEP" planRequerido="Professional">
			<RDEPClient />
		</FeatureGate>
	);
}
