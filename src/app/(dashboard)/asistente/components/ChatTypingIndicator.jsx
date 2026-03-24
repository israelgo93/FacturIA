'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ChatTypingIndicator() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex gap-3 justify-start"
		>
			<div
				className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
				style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
			>
				<Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'var(--text-secondary)' }} />
			</div>
			<div
				className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5"
				style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
			>
				{[0, 1, 2].map((i) => (
					<motion.span
						key={i}
						className="w-1.5 h-1.5 rounded-full"
						style={{ background: 'var(--text-muted)' }}
						animate={{ opacity: [0.3, 1, 0.3] }}
						transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
					/>
				))}
			</div>
		</motion.div>
	);
}
