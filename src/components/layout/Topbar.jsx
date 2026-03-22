'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Building2, User, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useEmpresaStore } from '@/stores/useEmpresaStore';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Topbar() {
	const { setMobileMenuOpen } = useUIStore();
	const { empresa } = useEmpresaStore();
	const [profileOpen, setProfileOpen] = useState(false);
	const profileRef = useRef(null);
	const router = useRouter();

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (profileRef.current && !profileRef.current.contains(event.target)) {
				setProfileOpen(false);
			}
		}
		if (profileOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [profileOpen]);

	const handleSignOut = async () => {
		setProfileOpen(false);
		const supabase = createClient();
		await supabase.auth.signOut();
		// Clear all FacturIA data from localStorage
		useEmpresaStore.getState().clearEmpresa();
		useEmpresaStore.persist.clearStorage();
		router.push('/login');
	};

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
					className="lg:hidden p-2.5 rounded-xl transition-colors duration-300 touch-target flex items-center justify-center"
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
				<Building2 className="w-3.5 h-3.5" style={{ color: empresa ? 'var(--text-secondary)' : 'var(--text-muted)' }} />
				<span className="text-xs font-medium" style={{ color: empresa ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
					{empresa ? (empresa.nombre_comercial || empresa.razon_social) : 'Cargando...'}
				</span>
				{empresa?.ruc && (
					<span className="text-[10px] ml-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
						{empresa.ruc}
					</span>
				)}
			</div>

			<div className="flex items-center gap-1">
				<ThemeToggle />
				<button
					className="relative p-2.5 rounded-xl transition-colors duration-300 touch-target flex items-center justify-center"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
					onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
					aria-label="Notificaciones"
				>
					<Bell className="w-5 h-5" />
				</button>

				{/* Profile dropdown */}
				<div className="relative" ref={profileRef}>
					<button
						onClick={() => setProfileOpen((prev) => !prev)}
						className="p-2.5 rounded-xl transition-colors duration-300 touch-target flex items-center justify-center"
						style={{
							color: profileOpen ? 'var(--text-primary)' : 'var(--text-muted)',
							background: profileOpen ? 'var(--glass-hover)' : 'transparent',
						}}
						onMouseEnter={(e) => { if (!profileOpen) e.currentTarget.style.background = 'var(--glass-hover)'; }}
						onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.background = 'transparent'; }}
						aria-label="Perfil"
						aria-expanded={profileOpen}
						aria-haspopup="true"
					>
						<User className="w-5 h-5" />
					</button>

					{profileOpen && (
						<div
							className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 shadow-xl"
							style={{
								background: 'var(--sidebar-bg)',
								border: '1px solid var(--divider)',
								zIndex: 9999,
							}}
						>
							<button
								onClick={handleSignOut}
								className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors duration-200"
								style={{ color: 'var(--text-muted)' }}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'var(--glass-hover)';
									e.currentTarget.style.color = 'var(--text-primary)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent';
									e.currentTarget.style.color = 'var(--text-muted)';
								}}
							>
								<LogOut className="w-4 h-4" />
								<span className="text-[13px] font-medium">Cerrar sesión</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
