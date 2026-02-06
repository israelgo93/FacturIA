'use client';

import { useState, useEffect } from 'react';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { TIPOS_IDENTIFICACION } from '@/lib/utils/sri-catalogs';
import { Search, User, Building } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StepCliente({ wizard, establecimientos, puntosEmision }) {
	const [busqueda, setBusqueda] = useState('');
	const [clientesBusqueda, setClientesBusqueda] = useState([]);
	const [buscando, setBuscando] = useState(false);

	const buscarClientes = async (termino) => {
		if (termino.length < 2) {
			setClientesBusqueda([]);
			return;
		}
		setBuscando(true);
		const supabase = createClient();
		const { data } = await supabase
			.from('clientes')
			.select('id, razon_social, identificacion, tipo_identificacion, email, direccion, telefono')
			.or(`razon_social.ilike.%${termino}%,identificacion.ilike.%${termino}%`)
			.eq('activo', true)
			.limit(5);
		setClientesBusqueda(data || []);
		setBuscando(false);
	};

	const seleccionarCliente = (cli) => {
		wizard.setCliente({
			clienteId: cli.id,
			tipoIdentificacionComprador: cli.tipo_identificacion,
			identificacionComprador: cli.identificacion,
			razonSocialComprador: cli.razon_social,
			direccionComprador: cli.direccion || '',
			emailComprador: cli.email || '',
			telefonoComprador: cli.telefono || '',
		});
		setBusqueda('');
		setClientesBusqueda([]);
	};

	// Filtrar puntos de emisión por establecimiento seleccionado
	const ptosFiltered = puntosEmision.filter(
		(p) => p.establecimiento_id === wizard.establecimientoId
	);

	return (
		<div className="space-y-6">
			{/* Establecimiento y punto de emisión */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<GlassSelect
					label="Establecimiento"
					required
					value={wizard.establecimientoId || ''}
					onChange={(e) => {
						wizard.setEstablecimiento(e.target.value);
						wizard.setPuntoEmision(null);
					}}
				>
					<option value="">Seleccione...</option>
					{establecimientos.map((est) => (
						<option key={est.id} value={est.id}>
							{est.codigo} - {est.direccion}
						</option>
					))}
				</GlassSelect>

				<GlassSelect
					label="Punto de Emisión"
					required
					value={wizard.puntoEmisionId || ''}
					onChange={(e) => wizard.setPuntoEmision(e.target.value)}
					disabled={!wizard.establecimientoId}
				>
					<option value="">Seleccione...</option>
					{ptosFiltered.map((pto) => (
						<option key={pto.id} value={pto.id}>
							{pto.codigo} {pto.descripcion ? `- ${pto.descripcion}` : ''}
						</option>
					))}
				</GlassSelect>
			</div>

			{/* Búsqueda de cliente */}
			<div className="relative">
				<GlassInput
					label="Buscar cliente existente"
					icon={Search}
					placeholder="Buscar por nombre, RUC o cédula..."
					value={busqueda}
					onChange={(e) => {
						setBusqueda(e.target.value);
						buscarClientes(e.target.value);
					}}
				/>
				{clientesBusqueda.length > 0 && (
					<div
						className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden border"
						style={{
							background: 'var(--modal-bg)',
							borderColor: 'var(--glass-border)',
						}}
					>
						{clientesBusqueda.map((cli) => (
							<button
								key={cli.id}
								className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3"
								style={{ color: 'var(--text-primary)' }}
								onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
								onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
								onClick={() => seleccionarCliente(cli)}
							>
								<User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
								<div>
									<div className="font-medium">{cli.razon_social}</div>
									<div className="text-xs" style={{ color: 'var(--text-muted)' }}>
										{cli.identificacion}
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			<div
				className="h-px w-full"
				style={{ background: 'var(--glass-border)' }}
			/>

			{/* Datos del comprador */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<GlassSelect
					label="Tipo Identificación"
					required
					value={wizard.cliente.tipoIdentificacionComprador}
					onChange={(e) => wizard.setCliente({ tipoIdentificacionComprador: e.target.value })}
				>
					{TIPOS_IDENTIFICACION.map((tipo) => (
						<option key={tipo.value} value={tipo.value}>
							{tipo.label}
						</option>
					))}
				</GlassSelect>

				<GlassInput
					label="Identificación"
					required
					placeholder="RUC / Cédula / Pasaporte"
					value={wizard.cliente.identificacionComprador}
					onChange={(e) => wizard.setCliente({ identificacionComprador: e.target.value })}
				/>

				<GlassInput
					label="Razón Social"
					required
					className="sm:col-span-2"
					placeholder="Nombre o razón social del comprador"
					value={wizard.cliente.razonSocialComprador}
					onChange={(e) => wizard.setCliente({ razonSocialComprador: e.target.value })}
				/>

				<GlassInput
					label="Dirección"
					placeholder="Dirección del comprador"
					value={wizard.cliente.direccionComprador}
					onChange={(e) => wizard.setCliente({ direccionComprador: e.target.value })}
				/>

				<GlassInput
					label="Email"
					type="email"
					placeholder="email@ejemplo.com"
					value={wizard.cliente.emailComprador}
					onChange={(e) => wizard.setCliente({ emailComprador: e.target.value })}
				/>
			</div>
		</div>
	);
}
