import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmpresaStore = create(
	persist(
		(set) => ({
			empresa: null,
			establecimiento: null,
			puntoEmision: null,
			setEmpresa: (empresa) => set({ empresa }),
			setEstablecimiento: (establecimiento) => set({ establecimiento }),
			setPuntoEmision: (puntoEmision) => set({ puntoEmision }),
			clearEmpresa: () => set({ empresa: null, establecimiento: null, puntoEmision: null }),
		}),
		{ name: 'facturia-empresa' }
	)
);
