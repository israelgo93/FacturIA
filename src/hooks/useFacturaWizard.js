'use client';

import { useCallback } from 'react';
import { useComprobanteStore } from '@/stores/useComprobanteStore';
import { crearBorrador, procesarComprobante } from '@/app/(dashboard)/comprobantes/actions';
import { toast } from 'sonner';

/**
 * Hook para manejar la lógica del wizard de factura
 */
export function useFacturaWizard() {
	const store = useComprobanteStore();

	const validarPasoActual = useCallback(() => {
		const { paso, cliente, detalles, pagos, establecimientoId, puntoEmisionId } = store;

		switch (paso) {
			case 0: // Establecimiento
				if (!establecimientoId || !puntoEmisionId) {
					toast.error('Seleccione establecimiento y punto de emisión');
					return false;
				}
				return true;

			case 1: // Cliente
				if (!cliente.tipoIdentificacionComprador || !cliente.identificacionComprador || !cliente.razonSocialComprador) {
					toast.error('Complete los datos del comprador');
					return false;
				}
				return true;

			case 2: // Detalles
				if (detalles.length === 0) {
					toast.error('Agregue al menos un producto o servicio');
					return false;
				}
				return true;

			case 3: // Pagos
				if (pagos.length === 0) {
					toast.error('Agregue al menos una forma de pago');
					return false;
				}
				return true;

			default:
				return true;
		}
	}, [store]);

	const avanzar = useCallback(() => {
		if (validarPasoActual()) {
			store.siguientePaso();
		}
	}, [validarPasoActual, store]);

	const retroceder = useCallback(() => {
		store.anteriorPaso();
	}, [store]);

	const enviarFactura = useCallback(async () => {
		store.setProcesando(true);
		try {
			// Actualizar total en pagos
			const totales = store.getTotales();
			const pagosActualizados = store.pagos.map((p, i) => ({
				...p,
				total: i === 0 ? totales.importeTotal : p.total,
			}));

			// Crear borrador
			const resultado = await crearBorrador({
				establecimientoId: store.establecimientoId,
				puntoEmisionId: store.puntoEmisionId,
				...store.cliente,
				detalles: store.detalles,
				pagos: pagosActualizados,
				observaciones: store.observaciones,
				infoAdicional: store.infoAdicional,
			});

			if (resultado.error) {
				toast.error(resultado.error);
				store.setProcesando(false);
				return null;
			}

			toast.success(`Factura ${resultado.data.numeroCompleto} creada como borrador`);

			// Procesar (firmar + enviar + autorizar)
			const procesamiento = await procesarComprobante(resultado.data.id);
			if (procesamiento.error) {
				toast.error(`Error al procesar: ${procesamiento.error}`);
				store.setResultado({ ...resultado.data, estado: 'draft', error: procesamiento.error });
			} else {
				const estado = procesamiento.data?.estado;
				if (estado === 'AUT') {
					toast.success('Factura autorizada por el SRI');
				} else if (estado === 'NAT') {
					toast.error('Factura no autorizada por el SRI');
				} else if (estado === 'PPR') {
					toast.info('Factura en procesamiento por el SRI');
				} else if (estado === 'DEV') {
					toast.error('Factura devuelta por el SRI');
				}
				store.setResultado({ ...resultado.data, ...procesamiento.data });
			}

			return resultado.data;
		} catch (error) {
			toast.error('Error inesperado: ' + error.message);
			return null;
		} finally {
			store.setProcesando(false);
		}
	}, [store]);

	return {
		...store,
		validarPasoActual,
		avanzar,
		retroceder,
		enviarFactura,
	};
}
