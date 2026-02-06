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
				<label
					className="block text-xs font-medium uppercase tracking-wider mb-2"
					style={{ color: 'var(--text-muted)' }}
				>
					{label}
					{required && <span style={{ color: 'var(--text-secondary)' }} className="ml-1">*</span>}
				</label>
			)}
			<div className="relative">
				{Icon && (
					<div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
						<Icon className="w-4 h-4" />
					</div>
				)}
				<input
					ref={ref}
					type={type}
					className={`
						w-full px-4 py-2.5 rounded-xl
						backdrop-blur-sm
						transition-all duration-300
						focus:outline-none
						disabled:opacity-40 disabled:cursor-not-allowed
						${Icon ? 'pl-10' : ''}
					`.trim()}
					style={{
						background: 'var(--input-bg)',
						border: `1px solid ${error ? 'var(--input-error-border)' : 'var(--input-border)'}`,
						color: 'var(--text-primary)',
						'--tw-placeholder-opacity': 1,
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
				/>
			</div>
			{error && (
				<p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</p>
			)}
		</div>
	);
});

export { GlassInput };
export default GlassInput;
