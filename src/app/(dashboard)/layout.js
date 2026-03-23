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
				<main className="flex-1 p-4 md:p-6 lg:p-8 pb-32 lg:pb-8 min-w-0 overflow-x-hidden">
					<div className="max-w-6xl mx-auto w-full min-w-0">
						{children}
					</div>
				</main>
			</div>

			{/* Bottom nav - solo mobile */}
			<BottomNav />
		</div>
	);
}
