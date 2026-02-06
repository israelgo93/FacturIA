'use client';

import { Bell, Menu, Building2, User } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import Logo from '@/components/shared/Logo';

export default function Topbar() {
	const { setMobileMenuOpen } = useUIStore();

	return (
		<header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 lg:px-6 bg-[#09090b]/80 border-b border-white/[0.05] backdrop-blur-2xl">
			<div className="flex items-center gap-3">
				<button
					onClick={() => setMobileMenuOpen(true)}
					className="lg:hidden p-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-300"
					aria-label="Abrir menú"
				>
					<Menu className="w-5 h-5 text-white/40" />
				</button>
				<Logo size="sm" className="lg:hidden" />
			</div>

			<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
				<Building2 className="w-3.5 h-3.5 text-white/25" />
				<span className="text-xs text-white/35">Selecciona una empresa</span>
			</div>

			<div className="flex items-center gap-1">
				<button
					className="relative p-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-300"
					aria-label="Notificaciones"
				>
					<Bell className="w-[18px] h-[18px] text-white/30" />
				</button>
				<button
					className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-300"
					aria-label="Perfil"
				>
					<User className="w-[18px] h-[18px] text-white/30" />
				</button>
			</div>
		</header>
	);
}
