'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, FileCode, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { generarRDEP } from '../actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassSelect from '@/components/ui/GlassSelect';

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => ({
	value: String(currentYear - i),
	label: String(currentYear - i),
}));

export default function RDEPPage() {
	const [anio, setAnio] = useState(String(currentYear));
	const [loading, setLoading] = useState(false);
	const [xml, setXml] = useState(null);

	const handleGenerar = async () => {
		setLoading(true);
		const result = await generarRDEP(parseInt(anio));
		setLoading(false);
		if (result.success) {
			setXml(result.data.xml);
			toast.success('RDEP generado correctamente');
		} else {
			toast.error(result.error || 'Error al generar RDEP');
		}
	};

	const handleDescargar = () => {
		if (!xml) return;
		const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `RDEP_${anio}.xml`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link href="/reportes">
					<GlassButton variant="ghost" size="sm" icon={ArrowLeft} />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>RDEP - Relación de Dependencia</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Genera el XML anual de retenciones en relación de dependencia</p>
				</div>
			</div>

			<GlassCard className="p-6">
				<div className="flex items-end gap-4">
					<GlassSelect label="Año Fiscal" value={anio} onChange={(e) => setAnio(e.target.value)} options={ANIOS} />
					<GlassButton onClick={handleGenerar} loading={loading}>
						{loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileCode className="w-4 h-4 mr-1" />}
						Generar RDEP
					</GlassButton>
				</div>
			</GlassCard>

			{xml && (
				<GlassCard className="p-6">
					<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>XML generado</h2>
					<pre className="text-xs p-3 rounded-lg overflow-x-auto max-h-60" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
						{xml.substring(0, 2000)}{xml.length > 2000 ? '\n...(truncado)' : ''}
					</pre>
					<div className="mt-4">
						<GlassButton onClick={handleDescargar} variant="secondary" size="sm">
							<Download className="w-4 h-4 mr-1" /> Descargar XML
						</GlassButton>
					</div>
				</GlassCard>
			)}
		</div>
	);
}
