'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const GlassSelect = forwardRef(function GlassSelect({
	label,
	options = [],
	placeholder = 'Seleccionar...',
	error,
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
				<select
					ref={ref}
					className={`
						w-full px-4 py-2.5 pr-10 rounded-xl appearance-none
						bg-white/[0.04] border border-white/[0.06]
						backdrop-blur-sm text-white
						transition-all duration-300
						focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15]
						disabled:opacity-40 disabled:cursor-not-allowed
						${error ? 'border-white/[0.20]' : ''}
					`.trim()}
					{...props}
				>
					<option value="" className="bg-[#18181b] text-white/40">
						{placeholder}
					</option>
					{options.map((opt) => (
						<option
							key={opt.value}
							value={opt.value}
							className="bg-[#18181b] text-white"
						>
							{opt.label}
						</option>
					))}
				</select>
				<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
			</div>
			{error && (
				<p className="mt-1.5 text-xs text-white/50">{error}</p>
			)}
		</div>
	);
});

export default GlassSelect;
