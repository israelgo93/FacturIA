'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	LayoutDashboard, FileText, Users, Package,
	BarChart3, Settings, ChevronLeft, ChevronRight, LogOut,
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

export default function Sidebar() {
	const pathname = usePathname();
	const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

	return (
		<aside
			className={`
				hidden lg:flex flex-col h-screen sticky top-0
				bg-white/[0.02] border-r border-white/[0.05]
				transition-all duration-300
				${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}
			`}
		>
			<div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.05]">
				<Logo size={sidebarCollapsed ? 'sm' : 'md'} showText={!sidebarCollapsed} />
				{!sidebarCollapsed && (
					<button
						onClick={toggleSidebarCollapsed}
						className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors duration-300"
						aria-label="Colapsar sidebar"
					>
						<ChevronLeft className="w-4 h-4 text-white/20" />
					</button>
				)}
			</div>

			{sidebarCollapsed && (
				<div className="flex justify-center py-3 border-b border-white/[0.05]">
					<button
						onClick={toggleSidebarCollapsed}
						className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors duration-300"
						aria-label="Expandir sidebar"
					>
						<ChevronRight className="w-4 h-4 text-white/20" />
					</button>
				</div>
			)}

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
								flex items-center gap-3 px-3 py-2 rounded-xl
								transition-all duration-300 group
								${isActive
									? 'bg-white/[0.08] text-white'
									: 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
								}
							`}
							title={sidebarCollapsed ? item.label : undefined}
						>
							<Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-white/25 group-hover:text-white/50'}`} />
							{!sidebarCollapsed && (
								<span className="text-[13px] font-medium truncate">{item.label}</span>
							)}
						</Link>
					);
				})}
			</nav>

			<div className="px-2.5 py-3 border-t border-white/[0.05]">
				<button
					className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all duration-300"
					title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
				>
					<LogOut className="w-[18px] h-[18px] shrink-0" />
					{!sidebarCollapsed && <span className="text-[13px] font-medium">Cerrar sesión</span>}
				</button>
			</div>
		</aside>
	);
}
