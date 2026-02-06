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
				<label
					className="block text-xs font-medium uppercase tracking-wider mb-2"
					style={{ color: 'var(--text-muted)' }}
				>
					{label}
					{required && <span style={{ color: 'var(--text-secondary)' }} className="ml-1">*</span>}
				</label>
			)}
			<div className="relative">
				<select
					ref={ref}
					className={`
						w-full px-4 py-2.5 pr-10 rounded-xl appearance-none
						backdrop-blur-sm
						transition-all duration-300
						focus:outline-none
						disabled:opacity-40 disabled:cursor-not-allowed
					`.trim()}
					style={{
						background: 'var(--input-bg)',
						border: `1px solid ${error ? 'var(--input-error-border)' : 'var(--input-border)'}`,
						color: 'var(--text-primary)',
					}}
					onFocus={(e) => {
						e.target.style.background = 'var(--input-focus-bg)';
						e.target.style.borderColor = 'var(--input-focus-border)';
					}}
					onBlur={(e) => {
						e.target.style.background = 'var(--input-bg)';
						e.target.style.borderColor = error ? 'var(--input-error-border)' : 'var(--input-border)';
					}}
					{...props}
				>
					<option value="" style={{ background: 'var(--option-bg)', color: 'var(--option-text-muted)' }}>
						{placeholder}
					</option>
					{options.map((opt) => (
						<option
							key={opt.value}
							value={opt.value}
							style={{ background: 'var(--option-bg)', color: 'var(--option-text)' }}
						>
							{opt.label}
						</option>
					))}
				</select>
				<ChevronDown
					className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
					style={{ color: 'var(--text-muted)' }}
				/>
			</div>
			{error && (
				<p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</p>
			)}
		</div>
	);
});

export default GlassSelect;
