'use client';

import { motion } from 'framer-motion';

const variants = {
	default: 'bg-white/[0.03] border-white/[0.06]',
	solid: 'bg-white/[0.06] border-white/[0.10]',
	ghost: 'bg-transparent border-transparent',
};

export default function GlassCard({
	children,
	variant = 'default',
	hover = true,
	className = '',
	animate = true,
	onClick,
	...props
}) {
	const baseClasses = `
		backdrop-blur-2xl rounded-2xl border
		shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]
		${variants[variant] || variants.default}
		${hover ? 'transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.10]' : ''}
		${onClick ? 'cursor-pointer' : ''}
		${className}
	`.trim();

	if (animate) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
				className={baseClasses}
				onClick={onClick}
				{...props}
			>
				{children}
			</motion.div>
		);
	}

	return (
		<div className={baseClasses} onClick={onClick} {...props}>
			{children}
		</div>
	);
}
