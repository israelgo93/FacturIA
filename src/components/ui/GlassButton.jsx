'use client';

import { Loader2 } from 'lucide-react';

const variants = {
	primary: 'bg-white text-black hover:bg-white/90 border-transparent',
	secondary: 'bg-white/[0.06] hover:bg-white/[0.10] text-white/80 border-white/[0.08]',
	ghost: 'bg-transparent hover:bg-white/[0.05] text-white/60 border-transparent',
	danger: 'bg-white/[0.06] hover:bg-white/[0.10] text-white/60 border-white/[0.08]',
	accent: 'bg-white/[0.10] hover:bg-white/[0.15] text-white border-white/[0.12]',
};

const sizes = {
	sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
	md: 'px-4 py-2 text-sm rounded-xl gap-2',
	lg: 'px-6 py-2.5 text-sm rounded-xl gap-2',
};

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
	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={`
				inline-flex items-center justify-center font-medium
				border backdrop-blur-sm
				transition-all duration-300
				disabled:opacity-40 disabled:cursor-not-allowed
				${variants[variant] || variants.primary}
				${sizes[size] || sizes.md}
				${className}
			`.trim()}
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
