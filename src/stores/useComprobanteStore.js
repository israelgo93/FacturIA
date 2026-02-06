import { create } from 'zustand';

/**
 * Store para el estado del wizard de factura y comprobantes
 */
export const useComprobanteStore = create((set, get) => ({
	// Estado del wizard
	paso: 0,
	maxPasos: 5,

	// Datos del wizard
	establecimientoId: null,
	puntoEmisionId: null,

	// Paso 1: Cliente
	cliente: {
		clienteId: null,
		tipoIdentificacionComprador: '05',
		identificacionComprador: '',
		razonSocialComprador: '',
		direccionComprador: '',
		emailComprador: '',
		telefonoComprador: '',
	},

	// Paso 2: Detalles
	detalles: [],

	// Paso 3: Pagos
	pagos: [{ formaPago: '01', total: 0, plazo: null, unidadTiempo: 'dias' }],

	// Paso 4: Info adicional
	observaciones: '',
	infoAdicional: [],

	// Estado de procesamiento
	procesando: false,
	resultado: null,

	// Acciones del wizard
	setPaso: (paso) => set({ paso }),
	siguientePaso: () => set((s) => ({ paso: Math.min(s.paso + 1, s.maxPasos - 1) })),
	anteriorPaso: () => set((s) => ({ paso: Math.max(s.paso - 1, 0) })),

	setEstablecimiento: (id) => set({ establecimientoId: id }),
	setPuntoEmision: (id) => set({ puntoEmisionId: id }),

	setCliente: (clienteData) => set((s) => ({
		cliente: { ...s.cliente, ...clienteData },
	})),

	// Detalles
	agregarDetalle: (detalle) => set((s) => ({
		detalles: [...s.detalles, detalle],
	})),

	actualizarDetalle: (index, detalle) => set((s) => ({
		detalles: s.detalles.map((d, i) => (i === index ? { ...d, ...detalle } : d)),
	})),

	eliminarDetalle: (index) => set((s) => ({
		detalles: s.detalles.filter((_, i) => i !== index),
	})),

	// Pagos
	setPagos: (pagos) => set({ pagos }),

	agregarPago: (pago) => set((s) => ({
		pagos: [...s.pagos, pago],
	})),

	eliminarPago: (index) => set((s) => ({
		pagos: s.pagos.filter((_, i) => i !== index),
	})),

	// Info adicional
	setObservaciones: (observaciones) => set({ observaciones }),
	setInfoAdicional: (infoAdicional) => set({ infoAdicional }),

	// Procesamiento
	setProcesando: (procesando) => set({ procesando }),
	setResultado: (resultado) => set({ resultado }),

	// Obtener totales calculados
	getTotales: () => {
		const { detalles } = get();
		let subtotalSinImpuestos = 0;
		let totalDescuento = 0;
		let totalIva = 0;

		for (const det of detalles) {
			subtotalSinImpuestos += Number(det.precioTotalSinImpuesto || 0);
			totalDescuento += Number(det.descuento || 0);
			for (const imp of (det.impuestos || [])) {
				if (imp.codigo === '2') totalIva += Number(imp.valor || 0);
			}
		}

		return {
			subtotalSinImpuestos,
			totalDescuento,
			totalIva,
			importeTotal: subtotalSinImpuestos + totalIva,
		};
	},

	// Reset
	resetWizard: () => set({
		paso: 0,
		establecimientoId: null,
		puntoEmisionId: null,
		cliente: {
			clienteId: null,
			tipoIdentificacionComprador: '05',
			identificacionComprador: '',
			razonSocialComprador: '',
			direccionComprador: '',
			emailComprador: '',
			telefonoComprador: '',
		},
		detalles: [],
		pagos: [{ formaPago: '01', total: 0, plazo: null, unidadTiempo: 'dias' }],
		observaciones: '',
		infoAdicional: [],
		procesando: false,
		resultado: null,
	}),
}));
