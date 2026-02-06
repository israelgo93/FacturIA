'use client';

import { Check } from 'lucide-react';

const steps = [
	{ label: 'Empresa' },
	{ label: 'Establecimiento' },
	{ label: 'Punto Emisión' },
	{ label: 'Certificado' },
	{ label: 'Resumen' },
];

export default function OnboardingProgress({ currentStep = 0 }) {
	return (
		<div className="flex items-center justify-between mb-8">
			{steps.map((step, index) => {
				const isCompleted = index < currentStep;
				const isCurrent = index === currentStep;

				return (
					<div key={step.label} className="flex items-center flex-1">
						<div className="flex flex-col items-center">
							<div
								className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300"
								style={{
									background: isCompleted || isCurrent ? 'var(--btn-primary-bg)' : 'var(--glass-bg)',
									color: isCompleted || isCurrent ? 'var(--btn-primary-text)' : 'var(--text-muted)',
									border: `1px solid ${isCompleted || isCurrent ? 'transparent' : 'var(--glass-border)'}`,
								}}
							>
								{isCompleted ? <Check className="w-4 h-4" /> : index + 1}
							</div>
							<span
								className="text-[10px] mt-1.5 hidden sm:block"
								style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}
							>
								{step.label}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className="flex-1 h-px mx-2"
								style={{ background: isCompleted ? 'var(--text-muted)' : 'var(--glass-border)' }}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
