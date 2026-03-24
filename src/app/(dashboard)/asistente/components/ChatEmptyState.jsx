'use client';

import { motion } from 'framer-motion';
import { Sparkles, DollarSign, Calendar, FileText, TrendingUp } from 'lucide-react';

const SUGERENCIAS = [
	{ text: '¿Cuánto vendí este mes?', icon: DollarSign },
	{ text: '¿Cuándo vence mi declaración?', icon: Calendar },
	{ text: '¿Cuántas facturas emití este mes?', icon: FileText },
	{ text: 'Compara este mes vs anterior', icon: TrendingUp },
];

export default function ChatEmptyState({ empresa, kpis, onSuggestion, disabled }) {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-6 px-4">
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="w-16 h-16 rounded-2xl flex items-center justify-center"
				style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
			>
				<Sparkles className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
			</motion.div>

			<motion.div
				initial={{ y: 10, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
				className="text-center space-y-2"
			>
				<h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
					Asistente Tributario IA
				</h2>
				<p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
					Consulta sobre ventas, impuestos, retenciones y vencimientos.
					{empresa?.razon_social && (
						<span className="block mt-1 opacity-70">
							{empresa.razon_social}
						</span>
					)}
				</p>
			</motion.div>

			{kpis && (
				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.3, delay: 0.15 }}
					className="grid grid-cols-2 gap-3 w-full max-w-sm"
				>
					<div
						className="rounded-xl px-3 py-2.5 text-center"
						style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
					>
						<p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
							${parseFloat(kpis.ventas_mes || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
						</p>
						<p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Ventas del mes</p>
					</div>
					<div
						className="rounded-xl px-3 py-2.5 text-center"
						style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
					>
						<p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
							{kpis.total_comprobantes || 0}
						</p>
						<p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Comprobantes</p>
					</div>
				</motion.div>
			)}

			<motion.div
				initial={{ y: 10, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
				className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md"
			>
				{SUGERENCIAS.map((s, i) => (
					<motion.button
						key={s.text}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.25 + i * 0.05 }}
						onClick={() => !disabled && onSuggestion(s.text)}
						disabled={disabled}
						className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 active:scale-[0.98]"
						style={{
							background: 'var(--glass-bg)',
							border: '1px solid var(--glass-border)',
							color: 'var(--text-secondary)',
							cursor: disabled ? 'not-allowed' : 'pointer',
							opacity: disabled ? 0.5 : 1,
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
						<s.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
						{s.text}
					</motion.button>
				))}
			</motion.div>
		</div>
	);
}
