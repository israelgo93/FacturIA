'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, Loader2, Sparkles, ArrowLeft, MessageSquare, User } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { obtenerContextoEmpresa } from '../actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

const SUGERENCIAS = [
	'¿Cuánto debo pagar de IVA este mes?',
	'¿Cuántas facturas emití este mes?',
	'¿Cuál es mi crédito tributario?',
	'¿Cuándo vence mi declaración?',
];

function AnalisisPageInner() {
	const [empresa, setEmpresa] = useState(null);
	const [input, setInput] = useState('');
	const messagesEnd = useRef(null);
	const inputRef = useRef(null);

	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			api: '/api/reportes/chat',
			body: { empresaId: empresa?.id },
		}),
	});

	const isLoading = status === 'streaming' || status === 'submitted';

	useEffect(() => {
		obtenerContextoEmpresa().then((result) => {
			if (result.data) setEmpresa(result.data);
		});
	}, []);

	useEffect(() => {
		messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		sendMessage({ text: input });
		setInput('');
	};

	const handleSugerencia = (texto) => {
		sendMessage({ text: texto });
	};

	const getTextContent = (msg) => {
		if (msg.parts && msg.parts.length > 0) {
			return msg.parts
				.filter((part) => part.type === 'text')
				.map((part) => part.text)
				.join('');
		}
		return msg.content || '';
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<Link href="/reportes">
					<GlassButton variant="ghost" size="sm" icon={ArrowLeft} />
				</Link>
				<div className="flex-1">
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
						Asistente Tributario IA
					</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
						Pregunta lo que necesites sobre tu situacion fiscal
						{empresa && <span className="opacity-70"> — {empresa.razon_social}</span>}
					</p>
				</div>
			</div>

			<GlassCard className="p-0 overflow-hidden" hover={false}>
				<div className="h-[calc(100vh-200px)] min-h-[400px] flex flex-col">
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.length === 0 && (
							<div className="flex flex-col items-center justify-center h-full gap-5">
								<div
									className="w-14 h-14 rounded-2xl flex items-center justify-center"
									style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
								>
									<Sparkles className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
								</div>
								<div className="text-center space-y-1.5">
									<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
										Hola, soy tu asistente tributario
									</p>
									<p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
										Consulta sobre tus ventas, impuestos, retenciones, vencimientos y mas.
										Tengo acceso a tus datos en tiempo real.
									</p>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md px-4">
									{SUGERENCIAS.map((s) => (
										<button
											key={s}
											onClick={() => handleSugerencia(s)}
											className="text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200"
											style={{
												background: 'var(--glass-bg)',
												border: '1px solid var(--glass-border)',
												color: 'var(--text-secondary)',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = 'var(--glass-hover)';
												e.currentTarget.style.borderColor = 'var(--accent-primary)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = 'var(--glass-bg)';
												e.currentTarget.style.borderColor = 'var(--glass-border)';
											}}
										>
											<MessageSquare className="w-3 h-3 inline-block mr-1.5 opacity-40" />
											{s}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((msg) => (
							<div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
								{msg.role !== 'user' && (
									<div
										className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
										style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
									>
										<Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
									</div>
								)}
								<div
									className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'ml-auto' : ''}`}
									style={{
										background: msg.role === 'user' ? 'var(--glass-active)' : 'var(--glass-bg)',
										color: 'var(--text-primary)',
										border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
									}}
								>
									{getTextContent(msg)}
								</div>
								{msg.role === 'user' && (
									<div
										className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
										style={{ background: 'var(--glass-active)' }}
									>
										<User className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
									</div>
								)}
							</div>
						))}

						{isLoading && (
							<div className="flex gap-3">
								<div
									className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
									style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
								>
									<Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
								</div>
								<div
									className="rounded-2xl px-4 py-2.5 text-xs"
									style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
								>
									Consultando datos...
								</div>
							</div>
						)}
						<div ref={messagesEnd} />
					</div>

					<form
						onSubmit={handleSubmit}
						className="p-3 flex gap-2"
						style={{ borderTop: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}
					>
						<input
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Escribe tu consulta..."
							className="flex-1 px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all duration-300 focus:outline-none text-sm"
							style={{
								background: 'var(--input-bg)',
								border: '1px solid var(--input-border)',
								color: 'var(--text-primary)',
							}}
							onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
							onBlur={(e) => e.currentTarget.style.borderColor = 'var(--input-border)'}
						/>
						<GlassButton type="submit" disabled={isLoading || !input.trim()} size="sm">
							<Send className="w-4 h-4" />
						</GlassButton>
					</form>
				</div>
			</GlassCard>
		</div>
	);
}

export default dynamic(() => Promise.resolve(AnalisisPageInner), { ssr: false });
