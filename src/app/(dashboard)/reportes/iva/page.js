'use client';

import { useState } from 'react';
import { FileSpreadsheet, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerForm104, exportarForm104 } from '../actions';
import PeriodoSelector from '@/components/reportes/PeriodoSelector';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

function CasilleroRow({ numero, label, valor }) {
	return (
		<div className="flex items-center justify-between py-1.5 px-3 rounded" style={{ background: 'var(--glass-bg)' }}>
			<div className="flex items-center gap-2">
				<span className="text-xs font-mono w-8" style={{ color: 'var(--text-muted)' }}>{numero}</span>
				<span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
			</div>
			<span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>${(valor || 0).toFixed(2)}</span>
		</div>
	);
}

export default function IVAPage() {
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [loading, setLoading] = useState(false);
	const [datos, setDatos] = useState(null);

	const handleCalcular = async () => {
		setLoading(true);
		const result = await obtenerForm104(parseInt(anio), parseInt(mes));
		setLoading(false);
		if (result.success) {
			setDatos(result.data);
			toast.success('Formulario 104 calculado');
		} else {
			toast.error(result.error);
		}
	};

	const handleExportar = async () => {
		setLoading(true);
		const result = await exportarForm104(parseInt(anio), parseInt(mes));
		setLoading(false);
		if (result.success) {
			const link = document.createElement('a');
			link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.base64}`;
			link.download = result.data.filename;
			link.click();
		} else {
			toast.error(result.error);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Formulario 104 — Declaración IVA</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pre-llenado automático con datos de ventas y compras registradas</p>
			</div>

			<GlassCard className="p-6">
				<div className="flex items-end gap-4 flex-wrap">
					<PeriodoSelector anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
					<GlassButton onClick={handleCalcular} loading={loading}>
						<Calculator className="w-4 h-4 mr-1" /> Calcular
					</GlassButton>
				</div>
			</GlassCard>

			{datos && (
				<>
					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Ventas del Período</h2>
						<div className="space-y-1">
							<CasilleroRow numero="411" label="Ventas gravadas (diferente de 0%)" valor={datos.casillero_411} />
							<CasilleroRow numero="421" label="Ventas tarifa 0%" valor={datos.casillero_421} />
							<CasilleroRow numero="422" label="Ventas no objeto de IVA" valor={datos.casillero_422} />
							<CasilleroRow numero="423" label="Ventas exentas de IVA" valor={datos.casillero_423} />
							<CasilleroRow numero="480" label="Total transferencias" valor={datos.casillero_480} />
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Compras del Período</h2>
						<div className="space-y-1">
							<CasilleroRow numero="500" label="Adquisiciones gravadas (crédito tributario)" valor={datos.casillero_500} />
							<CasilleroRow numero="510" label="Adquisiciones tarifa 0%" valor={datos.casillero_510} />
							<CasilleroRow numero="520" label="Adquisiciones exentas" valor={datos.casillero_520} />
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Liquidación del IVA</h2>
						<div className="space-y-1">
							<CasilleroRow numero="601" label="IVA cobrado en ventas" valor={datos.casillero_601} />
							<CasilleroRow numero="602" label="IVA devuelto por NC" valor={datos.casillero_602} />
							<CasilleroRow numero="605" label="IVA cobrado neto" valor={datos.casillero_605} />
							<CasilleroRow numero="615" label="Crédito tributario (IVA pagado)" valor={datos.casillero_615} />
						</div>
						<div className="mt-4 p-3 rounded-lg" style={{ background: datos.impuesto_a_pagar > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									{datos.impuesto_a_pagar > 0 ? 'Impuesto a Pagar' : 'Crédito Próximo Mes'}
								</span>
								<span className="text-lg font-bold" style={{ color: datos.impuesto_a_pagar > 0 ? '#ef4444' : '#22c55e' }}>
									${(datos.impuesto_a_pagar > 0 ? datos.impuesto_a_pagar : datos.credito_proximo_mes).toFixed(2)}
								</span>
							</div>
						</div>
					</GlassCard>

					<div className="flex gap-3">
						<GlassButton onClick={handleExportar} variant="ghost" size="sm">
							<FileSpreadsheet className="w-4 h-4 mr-1" /> Exportar a Excel
						</GlassButton>
					</div>
				</>
			)}
		</div>
	);
}
