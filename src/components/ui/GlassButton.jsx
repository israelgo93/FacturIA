'use client';

import { Loader2 } from 'lucide-react';

const variantStyles = {
	primary: {
		bg: 'var(--btn-primary-bg)',
		text: 'var(--btn-primary-text)',
		hoverBg: 'var(--btn-primary-hover)',
		border: 'transparent',
	},
	secondary: {
		bg: 'var(--btn-secondary-bg)',
		text: 'var(--btn-secondary-text)',
		hoverBg: 'var(--btn-secondary-hover)',
		border: 'var(--btn-secondary-border)',
	},
	ghost: {
		bg: 'transparent',
		text: 'var(--btn-ghost-text)',
		hoverBg: 'var(--btn-ghost-hover)',
		border: 'transparent',
	},
	danger: {
		bg: 'var(--btn-secondary-bg)',
		text: 'var(--text-secondary)',
		hoverBg: 'var(--btn-secondary-hover)',
		border: 'var(--btn-secondary-border)',
	},
	accent: {
		bg: 'var(--glass-active)',
		text: 'var(--text-primary)',
		hoverBg: 'var(--glass-hover)',
		border: 'var(--glass-active)',
	},
};

const sizes = {
	sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
	md: 'px-4 py-2 text-sm rounded-xl gap-2',
	lg: 'px-6 py-2.5 text-sm rounded-xl gap-2',
};

export { GlassButton };
export default function GlassButton({
	children,
	variant = 'primary',
	size = 'md',
	loading = false,
	disabled = false,
	icon: Icon,
	iconRight: IconRight,
	className = '',
	type = 'button',
	...props
}) {
	const style = variantStyles[variant] || variantStyles.primary;

	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={`
				inline-flex items-center justify-center font-medium
				border backdrop-blur-sm
				transition-all duration-300
				disabled:opacity-40 disabled:cursor-not-allowed
				${sizes[size] || sizes.md}
				${className}
			`.trim()}
			style={{
				background: style.bg,
				color: style.text,
				borderColor: style.border,
				'--hover-bg': style.hoverBg,
			}}
			onMouseEnter={(e) => {
				if (!disabled && !loading) {
					e.currentTarget.style.background = style.hoverBg;
				}
			}}
			onMouseLeave={(e) => {
				if (!disabled && !loading) {
					e.currentTarget.style.background = style.bg;
				}
			}}
			{...props}
		>
			{loading ? (
				<Loader2 className="w-4 h-4 animate-spin" />
			) : Icon ? (
				<Icon className="w-4 h-4" />
			) : null}
			{children}
			{IconRight && !loading && <IconRight className="w-4 h-4" />}
		</button>
	);
}
