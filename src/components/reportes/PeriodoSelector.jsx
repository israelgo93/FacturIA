'use client';

import GlassSelect from '@/components/ui/GlassSelect';

const MESES = [
	{ value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
	{ value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
	{ value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
	{ value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
	{ value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
	{ value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

const SEMESTRES = [
	{ value: '6', label: 'Primer Semestre (Ene-Jun)' },
	{ value: '12', label: 'Segundo Semestre (Jul-Dic)' },
];

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => ({
	value: String(currentYear - i),
	label: String(currentYear - i),
}));

/**
 * Selector de período reutilizable para reportes
 * @param {{ anio: string, mes: string, esSemestral: boolean, onChange: (anio, mes) => void, showSemestral: boolean }}
 */
export default function PeriodoSelector({ anio, mes, esSemestral = false, onChange, showSemestral = false }) {
	return (
		<div className="flex gap-3 items-end">
			<GlassSelect
				label="Año"
				value={anio}
				onChange={(e) => onChange(e.target.value, mes)}
				options={ANIOS}
			/>
			<GlassSelect
				label={esSemestral ? 'Semestre' : 'Mes'}
				value={mes}
				onChange={(e) => onChange(anio, e.target.value)}
				options={esSemestral ? SEMESTRES : MESES}
			/>
		</div>
	);
}

export { MESES, ANIOS, SEMESTRES };
