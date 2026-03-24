'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const cambiarPlanSchema = z.object({
	planNombre: z.enum(['starter', 'professional', 'enterprise']),
});

export async function obtenerSuscripcionActual() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { data: sub, error } = await supabase
		.from('suscripciones')
		.select('*, planes ( id, nombre, precio_mensual, limite_comprobantes_mes, tiene_reportes_ia, tiene_rdep )')
		.eq('empresa_id', empresa.id)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data: sub, empresaId: empresa.id };
}

export async function cambiarPlan(prevState, formData) {
	const parsed = cambiarPlanSchema.safeParse({
		planNombre: formData.get('planNombre'),
	});

	if (!parsed.success) {
		return { error: 'Plan invalido' };
	}

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { data: planRow } = await supabase
		.from('planes')
		.select('id')
		.eq('nombre', parsed.data.planNombre)
		.single();

	if (!planRow) return { error: 'Plan no encontrado' };

	const { error } = await supabase
		.from('suscripciones')
		.update({
			plan_id: planRow.id,
			estado: 'activa',
			fecha_inicio: new Date().toISOString(),
			trial_ends_at: null,
			updated_at: new Date().toISOString(),
		})
		.eq('empresa_id', empresa.id);

	if (error) return { error: error.message };

	await supabase.from('notificaciones').insert({
		empresa_id: empresa.id,
		tipo: 'suscripcion',
		titulo: 'Plan actualizado',
		mensaje: `Tu plan se cambio a ${parsed.data.planNombre}.`,
		metadata: { plan: parsed.data.planNombre },
	});

	revalidatePath('/suscripcion');
	revalidatePath('/dashboard');
	return { success: true };
}
