import { createClient } from '@supabase/supabase-js';
import { consultarEstadoComprobante } from '../src/lib/sri/soap-client.js';
import {
	esRespuestaVigenciaConcluyente,
	mapearVigenciaAEstadoInterno,
} from '../src/lib/sri/estado-comprobante.js';

const ambienteArg = process.argv.find((argumento) => argumento.startsWith('--ambiente='));
const ambiente = ambienteArg?.split('=')[1] || '2';
const limiteArg = process.argv.find((argumento) => argumento.startsWith('--limite='));
const limite = Math.min(Math.max(Number(limiteArg?.split('=')[1] || 20), 1), 100);

if (!['1', '2'].includes(ambiente)) {
	throw new Error('El ambiente debe ser 1 (pruebas) o 2 (produccion).');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
	throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
	auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
	.from('comprobantes')
	.select('id, clave_acceso, estado, ambiente')
	.eq('ambiente', Number(ambiente))
	.in('estado', ['sent', 'PPR', 'AUT', 'NAT', 'PAN', 'ANU'])
	.not('clave_acceso', 'is', null)
	.order('fecha_emision', { ascending: false })
	.limit(limite);

if (error) throw new Error(error.message);

const comprobantes = data || [];
const resultados = [];

for (let indice = 0; indice < comprobantes.length; indice += 3) {
	const lote = comprobantes.slice(indice, indice + 3);
	const respuestas = await Promise.all(lote.map(async (comprobante) => {
		const respuesta = await consultarEstadoComprobante(comprobante.clave_acceso, ambiente);
		const estadoDetectado = mapearVigenciaAEstadoInterno(respuesta.estadoAutorizacion);
		return {
			id: comprobante.id,
			estadoActual: comprobante.estado,
			estadoDetectado: esRespuestaVigenciaConcluyente(respuesta) ? estadoDetectado : null,
			estadoConsulta: respuesta.estadoConsulta,
			codigo: respuesta.codigo || respuesta.mensajes?.[0]?.codigo || null,
		};
	}));
	resultados.push(...respuestas);
}

const diferencias = resultados.filter((resultado) => (
	resultado.estadoDetectado && resultado.estadoDetectado !== resultado.estadoActual
));
const concluyentes = resultados.filter((resultado) => resultado.estadoDetectado);

console.log(JSON.stringify({
	ambiente,
	consultados: resultados.length,
	concluyentes: concluyentes.length,
	inconclusos: resultados.length - concluyentes.length,
	diferencias,
}, null, 2));
