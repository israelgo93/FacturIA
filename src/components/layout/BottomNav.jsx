'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Menu } from 'lucide-react';

const items = [
	{ label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Docs', href: '/comprobantes', icon: FileText },
	{ label: 'Nuevo', href: '/comprobantes/nuevo', icon: PlusCircle, isMain: true },
	{ label: 'Reportes', href: '/reportes', icon: BarChart3 },
	{ label: 'Más', href: '/configuracion', icon: Menu },
];

export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav
			className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl safe-area-bottom"
			style={{
				background: 'var(--bottomnav-bg)',
				borderTop: '1px solid var(--divider)',
			}}
		>
			<div className="flex items-center justify-around h-16 px-2">
				{items.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
					const Icon = item.icon;

					if (item.isMain) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center justify-center -mt-5 w-14 h-14 rounded-2xl active:scale-95 transition-transform"
								style={{
									background: 'var(--btn-primary-bg)',
									color: 'var(--btn-primary-text)',
									boxShadow: '0 0 30px var(--glass-hover)',
								}}
								aria-label={item.label}
							>
								<Icon className="w-5 h-5" />
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1 transition-all duration-300 active:scale-95"
							style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
						>
							<Icon className="w-5 h-5" />
							<span className="text-[10px] font-medium tracking-wide">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
