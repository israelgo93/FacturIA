'use client';

import { useEffect } from 'react';
import { useEmpresaStore } from '@/stores/useEmpresaStore';
import { obtenerEmpresaActual, obtenerPerfilPlataforma } from '@/app/(dashboard)/dashboard/actions';

export default function DashboardInitializer() {
	const { empresa, setEmpresa, setIsPlatformAdmin, setTrialInfo } = useEmpresaStore();

	useEffect(() => {
		if (!empresa) {
			obtenerEmpresaActual().then((result) => {
				if (result.data) setEmpresa(result.data);
			});
		}
		obtenerPerfilPlataforma().then((result) => {
			if (result.isPlatformAdmin !== undefined) {
				setIsPlatformAdmin(result.isPlatformAdmin);
			}
			if (result.trialInfo) {
				setTrialInfo(result.trialInfo);
			}
		});
	}, [empresa, setEmpresa, setIsPlatformAdmin, setTrialInfo]);

	return null;
}
