'use client';

import { motion } from 'framer-motion';

const variants = {
	default: '',
	solid: 'glass-solid',
	ghost: 'glass-ghost',
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
	const variantClass = variants[variant] || '';

	const baseClasses = `
		backdrop-blur-2xl rounded-2xl border
		bg-[var(--glass-bg)] border-[var(--glass-border)]
		shadow-[var(--shadow-glass)]
		${variant === 'solid' ? 'bg-[var(--glass-hover)] border-[var(--glass-active)]' : ''}
		${variant === 'ghost' ? 'bg-transparent border-transparent shadow-none' : ''}
		${hover ? 'transition-all duration-300 hover:bg-[var(--glass-hover)] hover:border-[var(--glass-active)]' : ''}
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
