'use client';

import { motion } from 'framer-motion';
import { TrendingUp, FileText, Calendar, DollarSign, PieChart, AlertTriangle } from 'lucide-react';

const CHIPS = [
	{ text: '¿Cuánto vendí este mes?', icon: DollarSign },
	{ text: '¿Cuándo vence mi declaración?', icon: Calendar },
	{ text: 'Analiza mis retenciones', icon: FileText },
	{ text: '¿Hay anomalías en mis datos?', icon: AlertTriangle },
	{ text: 'Compara este mes vs anterior', icon: TrendingUp },
	{ text: 'Distribución de comprobantes', icon: PieChart },
];

export default function ChatSuggestionChips({ onSelect, disabled }) {
	return (
		<div className="flex flex-wrap gap-2">
			{CHIPS.slice(0, 4).map((chip, i) => (
				<motion.button
					key={chip.text}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: i * 0.05 }}
					onClick={() => !disabled && onSelect(chip.text)}
					disabled={disabled}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-150 active:scale-95 hover:brightness-95"
					style={{
						background: 'var(--glass-hover)',
						color: 'var(--text-secondary)',
						border: '1px solid var(--glass-border)',
						cursor: disabled ? 'not-allowed' : 'pointer',
						opacity: disabled ? 0.5 : 1,
					}}
				>
					<chip.icon className="w-3 h-3" />
					{chip.text}
				</motion.button>
			))}
		</div>
	);
}
