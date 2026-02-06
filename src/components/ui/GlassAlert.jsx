'use client';

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const typeConfig = {
	success: { icon: CheckCircle, opacityVar: '--alert-icon-success' },
	error: { icon: AlertCircle, opacityVar: '--alert-icon-error' },
	warning: { icon: AlertTriangle, opacityVar: '--alert-icon-warning' },
	info: { icon: Info, opacityVar: '--alert-icon-info' },
};

export default function GlassAlert({
	type = 'info',
	message,
	title,
	onClose,
	className = '',
}) {
	const config = typeConfig[type] || typeConfig.info;
	const Icon = config.icon;

	return (
		<div
			className={`
				flex items-start gap-3 p-4 rounded-xl
				backdrop-blur-sm
				${className}
			`.trim()}
			style={{
				background: 'var(--alert-bg)',
				border: '1px solid var(--alert-border)',
			}}
			role="alert"
		>
			<Icon
				className="w-4 h-4 shrink-0 mt-0.5"
				style={{ opacity: `var(${config.opacityVar})`, color: 'var(--text-primary)' }}
			/>
			<div className="flex-1 min-w-0">
				{title && <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--alert-title)' }}>{title}</p>}
				<p className="text-sm" style={{ color: 'var(--alert-message)' }}>{message}</p>
			</div>
			{onClose && (
				<button
					onClick={onClose}
					className="shrink-0 p-1 rounded-lg transition-colors duration-300"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
					onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
					aria-label="Cerrar alerta"
				>
					<X className="w-3.5 h-3.5" />
				</button>
			)}
		</div>
	);
}
