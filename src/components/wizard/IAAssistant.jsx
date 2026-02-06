'use client';

import { useChat } from '@ai-sdk/react';
import { useEmpresaStore } from '@/stores/useEmpresaStore';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { Bot, Send, Sparkles } from 'lucide-react';

export default function IAAssistant({ onSuggestion }) {
	const empresa = useEmpresaStore((s) => s.empresa);

	const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
		api: '/api/ia/factura-wizard',
		body: {
			context: { empresaId: empresa?.id },
		},
	});

	return (
		<GlassCard className="h-full flex flex-col" animate={false}>
			<div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
				<Sparkles className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
				<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
					Asistente IA
				</span>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{messages.length === 0 && (
					<div className="text-center py-8">
						<Bot className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
							Pregúntame sobre clientes,
						</p>
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
							productos o cálculos
						</p>
					</div>
				)}

				{messages.map((m) => (
					<div
						key={m.id}
						className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}
					>
						<div
							className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-xs`}
							style={{
								background: m.role === 'user' ? 'var(--glass-active)' : 'var(--glass-bg)',
								color: 'var(--text-primary)',
							}}
						>
							{m.content}
						</div>
					</div>
				))}

				{isLoading && (
					<div className="flex gap-1 px-3 py-2">
						<span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)' }} />
						<span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0.1s' }} />
						<span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0.2s' }} />
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit} className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--glass-border)' }}>
				<input
					value={input}
					onChange={handleInputChange}
					placeholder="Busca un cliente, producto..."
					className="flex-1 text-xs px-3 py-2 rounded-lg border"
					style={{
						background: 'var(--input-bg)',
						borderColor: 'var(--input-border)',
						color: 'var(--text-primary)',
					}}
				/>
				<GlassButton type="submit" size="sm" disabled={isLoading} variant="secondary">
					<Send className="w-3.5 h-3.5" />
				</GlassButton>
			</form>
		</GlassCard>
	);
}
