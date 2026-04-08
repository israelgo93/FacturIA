import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmpresaStore = create(
	persist(
		(set) => ({
			empresa: null,
			establecimiento: null,
			puntoEmision: null,
			isPlatformAdmin: false,
			trialInfo: null,
			setEmpresa: (empresa) => set({ empresa }),
			setEstablecimiento: (establecimiento) => set({ establecimiento }),
			setPuntoEmision: (puntoEmision) => set({ puntoEmision }),
			setIsPlatformAdmin: (isPlatformAdmin) => set({ isPlatformAdmin }),
			setTrialInfo: (trialInfo) => set({ trialInfo }),
			clearEmpresa: () => set({
				empresa: null, establecimiento: null, puntoEmision: null,
				isPlatformAdmin: false, trialInfo: null,
			}),
		}),
		{ name: 'facturia-empresa' }
	)
);
