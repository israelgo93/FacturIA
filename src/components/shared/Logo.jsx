import { Zap } from 'lucide-react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
	const sizeConfig = {
		sm: { icon: 'w-4 h-4', text: 'text-lg', pad: 'p-1.5' },
		md: { icon: 'w-5 h-5', text: 'text-xl', pad: 'p-1.5' },
		lg: { icon: 'w-6 h-6', text: 'text-2xl', pad: 'p-2' },
	};

	const config = sizeConfig[size] || sizeConfig.md;

	return (
		<div className={`flex items-center gap-2.5 ${className}`}>
			<div className="relative">
				<div className="absolute inset-0 bg-white/10 rounded-lg blur-lg" />
				<div className={`relative bg-white ${config.pad} rounded-lg`}>
					<Zap className={`${config.icon} text-black`} />
				</div>
			</div>
			{showText && (
				<span className={`${config.text} font-semibold tracking-tight text-white/90`}>
					factur<span className="text-white">IA</span>
				</span>
			)}
		</div>
	);
}
