'use client';

import { useEffect } from 'react';
import { useEmpresaStore } from '@/stores/useEmpresaStore';
import { obtenerEmpresaActual } from '@/app/(dashboard)/dashboard/actions';

/**
 * Componente invisible que carga la empresa del usuario al montar el dashboard.
 * Popula el zustand store para que Topbar, Sidebar, etc. puedan leer la empresa.
 */
export default function DashboardInitializer() {
	const { empresa, setEmpresa } = useEmpresaStore();

	useEffect(() => {
		if (!empresa) {
			obtenerEmpresaActual().then((result) => {
				if (result.data) setEmpresa(result.data);
			});
		}
	}, [empresa, setEmpresa]);

	return null;
}
