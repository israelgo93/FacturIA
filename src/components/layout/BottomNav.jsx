'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Menu } from 'lucide-react';

const items = [
	{ label: 'Inicio', href: '/', icon: LayoutDashboard },
	{ label: 'Docs', href: '/comprobantes', icon: FileText },
	{ label: 'Nuevo', href: '/comprobantes/nueva-factura', icon: PlusCircle, isMain: true },
	{ label: 'Reportes', href: '/reportes', icon: BarChart3 },
	{ label: 'Más', href: '/configuracion', icon: Menu },
];

export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/90 border-t border-white/[0.05] backdrop-blur-2xl safe-area-inset-bottom">
			<div className="flex items-center justify-around h-14 px-2">
				{items.map((item) => {
					const isActive = item.href === '/'
						? pathname === '/'
						: pathname.startsWith(item.href);
					const Icon = item.icon;

					if (item.isMain) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-white shadow-[0_0_30px_rgba(255,255,255,0.08)]"
								aria-label={item.label}
							>
								<Icon className="w-5 h-5 text-black" />
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`
								flex flex-col items-center gap-0.5 px-3 py-1
								transition-all duration-300
								${isActive ? 'text-white' : 'text-white/25'}
							`}
						>
							<Icon className="w-[18px] h-[18px]" />
							<span className="text-[9px] font-medium tracking-wide">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
