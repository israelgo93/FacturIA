import { create } from 'zustand';

export const useUIStore = create((set) => ({
	sidebarOpen: true,
	sidebarCollapsed: false,
	mobileMenuOpen: false,
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
	toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
	setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
	closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));
