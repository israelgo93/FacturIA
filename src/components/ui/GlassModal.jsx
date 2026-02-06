'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const sizeClasses = {
	sm: 'max-w-md',
	md: 'max-w-lg',
	lg: 'max-w-2xl',
	xl: 'max-w-4xl',
	full: 'max-w-[95vw]',
};

export default function GlassModal({
	isOpen,
	onClose,
	title,
	children,
	size = 'md',
	showClose = true,
	className = '',
}) {
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') onClose?.();
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEsc);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleEsc);
			document.body.style.overflow = '';
		};
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/80 backdrop-blur-sm"
						onClick={onClose}
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.97, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.97, y: 10 }}
						transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
						className={`
							relative w-full ${sizeClasses[size] || sizeClasses.md}
							bg-[#111113]/95 backdrop-blur-2xl
							border border-white/[0.06] rounded-2xl
							shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]
							${className}
						`.trim()}
					>
						{(title || showClose) && (
							<div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
								{title && (
									<h2 className="text-base font-medium text-white/90">{title}</h2>
								)}
								{showClose && (
									<button
										onClick={onClose}
										className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors duration-300"
										aria-label="Cerrar"
									>
										<X className="w-4 h-4 text-white/30" />
									</button>
								)}
							</div>
						)}

						<div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
