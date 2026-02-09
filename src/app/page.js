import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/pages/LandingPage';

export const metadata = {
	title: 'facturIA — Facturación Electrónica con IA',
	description: 'Plataforma SaaS de facturación electrónica para Ecuador con Inteligencia Artificial.',
};

export default async function Page() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (user) {
		// Verificar si tiene empresa y si completó el onboarding
		const { data: empresa } = await supabase
			.from('empresas')
			.select('onboarding_completado')
			.eq('user_id', user.id)
			.maybeSingle();

		if (!empresa || !empresa.onboarding_completado) {
			redirect('/onboarding');
		}

		redirect('/dashboard');
	}

	return <LandingPage />;
}
