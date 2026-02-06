'use client';

import { Loader2 } from 'lucide-react';

const sizeClasses = {
	sm: 'w-4 h-4',
	md: 'w-6 h-6',
	lg: 'w-8 h-8',
	xl: 'w-12 h-12',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
	return (
		<Loader2
			className={`animate-spin text-white/40 ${sizeClasses[size] || sizeClasses.md} ${className}`}
		/>
	);
}
