'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
	LayoutDashboard, FileText, Users, Package,
	BarChart3, Settings, X, LogOut,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import Logo from '@/components/shared/Logo';

const navItems = [
	{ label: 'Dashboard', href: '/', icon: LayoutDashboard },
	{ label: 'Comprobantes', href: '/comprobantes', icon: FileText },
	{ label: 'Clientes', href: '/clientes', icon: Users },
	{ label: 'Productos', href: '/productos', icon: Package },
	{ label: 'Reportes', href: '/reportes', icon: BarChart3 },
	{ label: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function MobileMenu() {
	const pathname = usePathname();
	const { mobileMenuOpen, closeMobileMenu } = useUIStore();

	useEffect(() => {
		closeMobileMenu();
	}, [pathname, closeMobileMenu]);

	return (
		<AnimatePresence>
			{mobileMenuOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
						onClick={closeMobileMenu}
					/>

					<motion.aside
						initial={{ x: '-100%' }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{ type: 'spring', damping: 30, stiffness: 300 }}
						className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-[#0e0e10] border-r border-white/[0.05] flex flex-col lg:hidden"
					>
						<div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.05]">
							<Logo size="md" />
							<button
								onClick={closeMobileMenu}
								className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-300"
								aria-label="Cerrar menú"
							>
								<X className="w-4 h-4 text-white/30" />
							</button>
						</div>

						<nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
							{navItems.map((item) => {
								const isActive = item.href === '/'
									? pathname === '/'
									: pathname.startsWith(item.href);
								const Icon = item.icon;

								return (
									<Link
										key={item.href}
										href={item.href}
										className={`
											flex items-center gap-3 px-3 py-2.5 rounded-xl
											transition-all duration-300
											${isActive
												? 'bg-white/[0.08] text-white'
												: 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
											}
										`}
									>
										<Icon className="w-[18px] h-[18px]" />
										<span className="text-[13px] font-medium">{item.label}</span>
									</Link>
								);
							})}
						</nav>

						<div className="px-2.5 py-3 border-t border-white/[0.05]">
							<button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all duration-300">
								<LogOut className="w-[18px] h-[18px]" />
								<span className="text-[13px] font-medium">Cerrar sesión</span>
							</button>
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
}
