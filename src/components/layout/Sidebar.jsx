'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	LayoutDashboard, FileText, Users, Package,
	BarChart3, Settings, ChevronLeft, ChevronRight, LogOut,
	ShoppingCart, UserCheck,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import Logo from '@/components/shared/Logo';

const navItems = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Comprobantes', href: '/comprobantes', icon: FileText },
	{ label: 'Clientes', href: '/clientes', icon: Users },
	{ label: 'Productos', href: '/productos', icon: Package },
	{ label: 'Compras', href: '/compras', icon: ShoppingCart },
	{ label: 'Empleados', href: '/empleados', icon: UserCheck },
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
				transition-all duration-300
				${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}
			`}
			style={{
				background: 'var(--sidebar-bg)',
				borderRight: '1px solid var(--divider)',
			}}
		>
			<div
				className="flex items-center justify-between px-4 h-16"
				style={{ borderBottom: '1px solid var(--divider)' }}
			>
				<Logo size={sidebarCollapsed ? 'sm' : 'md'} showText={!sidebarCollapsed} />
				{!sidebarCollapsed && (
					<button
						onClick={toggleSidebarCollapsed}
						className="p-1.5 rounded-lg transition-colors duration-300"
						style={{ color: 'var(--text-muted)' }}
						onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
						onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
						aria-label="Colapsar sidebar"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
				)}
			</div>

			{sidebarCollapsed && (
				<div
					className="flex justify-center py-3"
					style={{ borderBottom: '1px solid var(--divider)' }}
				>
					<button
						onClick={toggleSidebarCollapsed}
						className="p-1.5 rounded-lg transition-colors duration-300"
						style={{ color: 'var(--text-muted)' }}
						onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
						onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
						aria-label="Expandir sidebar"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			)}

			<nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
				{navItems.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
							style={{
								background: isActive ? 'var(--glass-hover)' : 'transparent',
								color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
							}}
							onMouseEnter={(e) => {
								if (!isActive) {
									e.currentTarget.style.background = 'var(--glass-bg)';
									e.currentTarget.style.color = 'var(--text-secondary)';
								}
							}}
							onMouseLeave={(e) => {
								if (!isActive) {
									e.currentTarget.style.background = 'transparent';
									e.currentTarget.style.color = 'var(--text-muted)';
								}
							}}
							title={sidebarCollapsed ? item.label : undefined}
						>
							<Icon className="w-[18px] h-[18px] shrink-0" />
							{!sidebarCollapsed && (
								<span className="text-[13px] font-medium truncate">{item.label}</span>
							)}
						</Link>
					);
				})}
			</nav>

			<div className="px-2.5 py-3" style={{ borderTop: '1px solid var(--divider)' }}>
				<button
					className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-300"
					style={{ color: 'var(--text-muted)' }}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = 'var(--text-secondary)';
						e.currentTarget.style.background = 'var(--glass-bg)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = 'var(--text-muted)';
						e.currentTarget.style.background = 'transparent';
					}}
					title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
				>
					<LogOut className="w-[18px] h-[18px] shrink-0" />
					{!sidebarCollapsed && <span className="text-[13px] font-medium">Cerrar sesión</span>}
				</button>
			</div>
		</aside>
	);
}
