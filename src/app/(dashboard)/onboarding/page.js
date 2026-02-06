import { Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function OnboardingPage() {
	return (
		<div className="max-w-2xl mx-auto py-12">
			<GlassCard className="p-10 text-center" hover={false}>
				<div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center mx-auto mb-6">
					<Sparkles className="w-6 h-6 text-white/50" />
				</div>
				<h1 className="text-xl font-medium text-white/90 mb-2">Bienvenido a facturIA</h1>
				<p className="text-sm text-white/30 mb-10 max-w-sm mx-auto">
					Vamos a configurar tu empresa con ayuda de Inteligencia Artificial.
				</p>
				<div className="glass rounded-xl p-6 text-left">
					<p className="text-white/20 text-xs">
						El asistente de configuración con IA estará disponible en la Fase 2.
					</p>
				</div>
			</GlassCard>
		</div>
	);
}
