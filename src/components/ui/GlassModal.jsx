'use client';

import { useEffect, useState } from 'react';
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
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 640);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

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
				<div className={`fixed inset-0 z-50 ${isMobile ? 'flex items-end' : 'flex items-center justify-center p-4'}`}>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 backdrop-blur-sm"
						style={{ background: 'var(--modal-overlay)' }}
						onClick={onClose}
					/>

					<motion.div
						initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 10 }}
						animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
						exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 10 }}
						transition={isMobile
							? { type: 'spring', damping: 30, stiffness: 300 }
							: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
						}
						className={`
							relative w-full backdrop-blur-2xl
							${isMobile
								? 'rounded-t-2xl max-h-[90vh]'
								: `${sizeClasses[size] || sizeClasses.md} rounded-2xl`
							}
							${className}
						`.trim()}
						style={{
							background: 'var(--modal-bg)',
							border: '1px solid var(--glass-border)',
							boxShadow: 'var(--shadow-glass-lg)',
						}}
					>
						{/* Drag handle for mobile */}
						{isMobile && (
							<div className="flex justify-center pt-3 pb-1">
								<div
									className="w-10 h-1 rounded-full"
									style={{ background: 'var(--text-disabled)' }}
								/>
							</div>
						)}

						{(title || showClose) && (
							<div
								className="flex items-center justify-between px-5 sm:px-6 py-4"
								style={{ borderBottom: '1px solid var(--glass-border)' }}
							>
								{title && (
									<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h2>
								)}
								{showClose && (
									<button
										onClick={onClose}
										className="p-2.5 -mr-1 rounded-xl transition-colors duration-300 touch-target"
										style={{ color: 'var(--text-muted)' }}
										onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
										onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
										aria-label="Cerrar"
									>
										<X className="w-5 h-5" />
									</button>
								)}
							</div>
						)}

						<div className={`px-5 sm:px-6 py-4 overflow-y-auto ${isMobile ? 'max-h-[75vh]' : 'max-h-[70vh]'} safe-area-bottom`}>
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
