'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { obtenerContextoEmpresa } from '../actions';
import PeriodoSelector from '@/components/reportes/PeriodoSelector';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

function AnalisisPageInner() {
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [empresa, setEmpresa] = useState(null);
	const messagesEnd = useRef(null);

	const { messages, input, setInput, handleSubmit, isLoading } = useChat({
		api: '/api/reportes/chat',
		body: {
			empresaId: empresa?.id,
			periodo: { anio: parseInt(anio), mes: parseInt(mes) },
		},
	});

	useEffect(() => {
		obtenerContextoEmpresa().then((result) => {
			if (result.data) setEmpresa(result.data);
		});
	}, []);

	useEffect(() => {
		messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const severityIcon = {
		error: <AlertCircle className="w-4 h-4 text-red-400" />,
		warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
		info: <Info className="w-4 h-4 text-blue-400" />,
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Análisis IA Tributario</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Chat con IA especializada en tributación ecuatoriana
					{empresa && ` — ${empresa.razon_social}`}
				</p>
			</div>

			<GlassCard className="p-4">
				<PeriodoSelector anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
			</GlassCard>

			<GlassCard className="p-0 overflow-hidden" hover={false}>
				<div className="h-[60vh] flex flex-col">
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.length === 0 && (
							<div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
								<Bot className="w-10 h-10 opacity-30" />
								<p className="text-sm text-center">
									Pregúntame sobre tus datos tributarios del período {mes}/{anio}.
									<br />
									<span className="text-xs">Ejemplo: ¿Cuánto debo pagar de IVA? ¿Tengo anomalías?</span>
								</p>
							</div>
						)}
						{messages.map((msg) => (
							<div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
								{msg.role !== 'user' && (
									<div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--glass-hover)' }}>
										<Bot className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
									</div>
								)}
								<div
									className={`rounded-xl px-4 py-2.5 max-w-[80%] text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'ml-auto' : ''}`}
									style={{
										background: msg.role === 'user' ? 'var(--glass-active)' : 'var(--glass-bg)',
										color: 'var(--text-primary)',
										border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
									}}
								>
									{msg.content}
								</div>
								{msg.role === 'user' && (
									<div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--glass-active)' }}>
										<User className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
									</div>
								)}
							</div>
						))}
						{isLoading && (
							<div className="flex gap-3">
								<div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--glass-hover)' }}>
									<Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
								</div>
								<div className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>Analizando...</div>
							</div>
						)}
						<div ref={messagesEnd} />
					</div>

					<form onSubmit={handleSubmit} className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
						<input
							value={input || ''}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Pregunta sobre tu situación tributaria..."
							className="flex-1 px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all duration-300 focus:outline-none"
							style={{
								background: 'var(--input-bg)',
								border: '1px solid var(--input-border)',
								color: 'var(--text-primary)',
							}}
						/>
						<GlassButton type="submit" disabled={isLoading || !(input || '').trim()} size="sm">
							<Send className="w-4 h-4" />
						</GlassButton>
					</form>
				</div>
			</GlassCard>
		</div>
	);
}

// Evitar pre-rendering estático - useChat requiere runtime
export default dynamic(() => Promise.resolve(AnalisisPageInner), { ssr: false });
