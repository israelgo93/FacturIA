'use client';

import { useState } from 'react';
import { Download, FileCode, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generarATS, generarATSExcel } from '../actions';
import PeriodoSelector from '@/components/reportes/PeriodoSelector';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

function descargarArchivo(base64, filename, mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
	const link = document.createElement('a');
	link.href = `data:${mime};base64,${base64}`;
	link.download = filename;
	link.click();
}

function descargarXML(xml, filename) {
	const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export default function ATSPage() {
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [loading, setLoading] = useState(false);
	const [resultado, setResultado] = useState(null);

	const handleGenerar = async () => {
		setLoading(true);
		const result = await generarATS(parseInt(anio), parseInt(mes), false);
		setLoading(false);
		if (result.success) {
			setResultado(result.data);
			toast.success('ATS generado correctamente');
		} else {
			toast.error(result.error || 'Error al generar ATS');
		}
	};

	const handleDescargarXML = () => {
		if (resultado?.xml) {
			descargarXML(resultado.xml, `AT_${resultado.cabecera?.idInformante}_${anio}${mes.padStart(2, '0')}.xml`);
		}
	};

	const handleDescargarExcel = async () => {
		setLoading(true);
		const result = await generarATSExcel(parseInt(anio), parseInt(mes), false);
		setLoading(false);
		if (result.success) {
			descargarArchivo(result.data.base64, result.data.filename);
		} else {
			toast.error(result.error);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Anexo Transaccional Simplificado (ATS)</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Genera el XML del ATS para subir al DIMM / SRI en línea</p>
			</div>

			<GlassCard className="p-6">
				<div className="flex items-end gap-4 flex-wrap">
					<PeriodoSelector anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
					<GlassButton onClick={handleGenerar} loading={loading}>
						{loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileCode className="w-4 h-4 mr-1" />}
						Generar ATS
					</GlassButton>
				</div>
			</GlassCard>

			{resultado && (
				<GlassCard className="p-6">
					<h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Resultado</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Compras</p>
							<p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{resultado.resumen?.totalCompras || 0}</p>
						</div>
						<div>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Base Compras</p>
							<p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>${(resultado.resumen?.totalBaseCompras || 0).toFixed(2)}</p>
						</div>
						<div>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>IVA Compras</p>
							<p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>${(resultado.resumen?.totalIVACompras || 0).toFixed(2)}</p>
						</div>
						<div>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Ventas</p>
							<p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>${(resultado.resumen?.totalVentas || 0).toFixed(2)}</p>
						</div>
					</div>
					<div className="flex gap-3">
						<GlassButton onClick={handleDescargarXML} variant="ghost" size="sm">
							<Download className="w-4 h-4 mr-1" /> Descargar XML
						</GlassButton>
						<GlassButton onClick={handleDescargarExcel} variant="ghost" size="sm">
							<FileSpreadsheet className="w-4 h-4 mr-1" /> Descargar Excel
						</GlassButton>
					</div>
				</GlassCard>
			)}
		</div>
	);
}
