'use client';

import { Bell, Menu, Building2, User } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Topbar() {
	const { setMobileMenuOpen } = useUIStore();

	return (
		<header
			className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 lg:px-6 backdrop-blur-2xl"
			style={{
				background: 'var(--topbar-bg)',
				borderBottom: '1px solid var(--divider)',
			}}
		>
			<div className="flex items-center gap-3">
				<button
					onClick={() => setMobileMenuOpen(true)}
					className="lg:hidden p-2 rounded-xl transition-colors duration-300"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
					onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
					aria-label="Abrir menú"
				>
					<Menu className="w-5 h-5" />
				</button>
				<Logo size="sm" className="lg:hidden" />
			</div>

			<div
				className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl"
				style={{
					background: 'var(--glass-bg)',
					border: '1px solid var(--glass-border)',
				}}
			>
				<Building2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
				<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Selecciona una empresa</span>
			</div>

			<div className="flex items-center gap-1">
				<ThemeToggle />
				<button
					className="relative p-2 rounded-xl transition-colors duration-300"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
					onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
					aria-label="Notificaciones"
				>
					<Bell className="w-[18px] h-[18px]" />
				</button>
				<button
					className="p-2 rounded-xl transition-colors duration-300"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
					onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
					aria-label="Perfil"
				>
					<User className="w-[18px] h-[18px]" />
				</button>
			</div>
		</header>
	);
}
