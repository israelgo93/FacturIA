'use client';

import { forwardRef } from 'react';

const GlassInput = forwardRef(function GlassInput({
	label,
	error,
	icon: Icon,
	type = 'text',
	className = '',
	required = false,
	...props
}, ref) {
	return (
		<div className={`w-full ${className}`}>
			{label && (
				<label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
					{label}
					{required && <span className="text-white/60 ml-1">*</span>}
				</label>
			)}
			<div className="relative">
				{Icon && (
					<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
						<Icon className="w-4 h-4" />
					</div>
				)}
				<input
					ref={ref}
					type={type}
					className={`
						w-full px-4 py-2.5 rounded-xl
						bg-white/[0.04] border border-white/[0.06]
						backdrop-blur-sm text-white placeholder-white/20
						transition-all duration-300
						focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15]
						disabled:opacity-40 disabled:cursor-not-allowed
						${Icon ? 'pl-10' : ''}
						${error ? 'border-white/[0.20]' : ''}
					`.trim()}
					{...props}
				/>
			</div>
			{error && (
				<p className="mt-1.5 text-xs text-white/50">{error}</p>
			)}
		</div>
	);
});

export default GlassInput;
