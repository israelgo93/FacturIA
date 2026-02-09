import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import MobileMenu from '@/components/layout/MobileMenu';
import DashboardInitializer from '@/components/layout/DashboardInitializer';

export default function DashboardLayout({ children }) {
	return (
		<div className="flex min-h-screen">
			{/* Inicializador: carga empresa en zustand store */}
			<DashboardInitializer />

			{/* Sidebar - solo desktop */}
			<Sidebar />

			{/* Mobile menu drawer */}
			<MobileMenu />

			{/* Contenido principal */}
			<div className="flex-1 flex flex-col min-w-0">
				<Topbar />
				<main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
					{children}
				</main>
			</div>

			{/* Bottom nav - solo mobile */}
			<BottomNav />
		</div>
	);
}
