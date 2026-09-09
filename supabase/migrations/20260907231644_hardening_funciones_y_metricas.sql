-- Reduce la superficie de funciones publicas y hace que los RPC de negocio
-- respeten las politicas RLS del usuario que los invoca.

alter view public.v_admin_metricas_globales set (security_invoker = true);
revoke all on public.v_admin_metricas_globales from public, anon, authenticated;
grant select on public.v_admin_metricas_globales to service_role;

-- Los RPC llamados por la aplicacion deben ejecutarse como invocador para que
-- un usuario no pueda consultar o modificar otra empresa pasando otro UUID.
alter function public.calcular_metricas_dashboard(uuid, text) security invoker;
alter function public.calcular_total_ventas_periodo(uuid, date, date) security invoker;
alter function public.contar_comprobantes_mes(uuid, text) security invoker;
alter function public.contar_documentos_anio(uuid, integer) security invoker;
alter function public.crear_suscripcion_trial(uuid) security invoker;
alter function public.next_secuencial(uuid, uuid, uuid, text) security invoker;
alter function public.verificar_estado_trial(uuid) security invoker;
alter function public.verificar_limite_plan(uuid) security invoker;

revoke all on function public.calcular_metricas_dashboard(uuid, text) from public, anon;
revoke all on function public.calcular_total_ventas_periodo(uuid, date, date) from public, anon;
revoke all on function public.contar_comprobantes_mes(uuid, text) from public, anon;
revoke all on function public.contar_documentos_anio(uuid, integer) from public, anon;
revoke all on function public.crear_suscripcion_trial(uuid) from public, anon;
revoke all on function public.next_secuencial(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.verificar_estado_trial(uuid) from public, anon;
revoke all on function public.verificar_limite_plan(uuid) from public, anon;

grant execute on function public.calcular_metricas_dashboard(uuid, text) to authenticated, service_role;
grant execute on function public.calcular_total_ventas_periodo(uuid, date, date) to authenticated, service_role;
grant execute on function public.contar_comprobantes_mes(uuid, text) to authenticated, service_role;
grant execute on function public.contar_documentos_anio(uuid, integer) to authenticated, service_role;
grant execute on function public.crear_suscripcion_trial(uuid) to authenticated, service_role;
grant execute on function public.next_secuencial(uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.verificar_estado_trial(uuid) to authenticated, service_role;
grant execute on function public.verificar_limite_plan(uuid) to authenticated, service_role;

-- Helpers de RLS: conservan SECURITY DEFINER para evitar recursion, pero no
-- pueden ser invocados por usuarios anonimos.
revoke all on function public.user_empresa_ids() from public, anon;
revoke all on function public.user_has_empresa_access(uuid) from public, anon;
grant execute on function public.user_empresa_ids() to authenticated, service_role;
grant execute on function public.user_has_empresa_access(uuid) to authenticated, service_role;

-- Funciones internas o heredadas sin uso directo desde la aplicacion.
revoke all on function public.auto_crear_perfil_propietario() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.obtener_siguiente_secuencial(uuid, uuid, varchar) from public, anon, authenticated;
alter function public.obtener_siguiente_secuencial(uuid, uuid, varchar) security invoker;

grant execute on function public.auto_crear_perfil_propietario() to service_role;
grant execute on function public.rls_auto_enable() to service_role;
grant execute on function public.obtener_siguiente_secuencial(uuid, uuid, varchar) to service_role;

-- Conserva el comportamiento historico de excluir descartes de las cuotas y
-- metricas, ahora con el estado explicito DESC. ANU es una anulacion fiscal.
create or replace function public.contar_comprobantes_mes(
	p_empresa_id uuid,
	p_mes text default to_char(now(), 'YYYY-MM')
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_count integer;
begin
	select count(*)
	into v_count
	from public.comprobantes
	where empresa_id = p_empresa_id
		and to_char(created_at, 'YYYY-MM') = p_mes
		and estado not in ('ANU', 'DESC', 'voided');

	return coalesce(v_count, 0);
end;
$$;

create or replace function public.contar_documentos_anio(
	p_empresa_id uuid,
	p_anio integer default extract(year from now())::integer
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_count integer;
begin
	select count(*)::integer
	into v_count
	from public.comprobantes
	where empresa_id = p_empresa_id
		and created_at >= make_date(p_anio, 1, 1)
		and created_at < make_date(p_anio + 1, 1, 1)
		and estado not in ('ANU', 'DESC', 'voided');

	return coalesce(v_count, 0);
end;
$$;

-- La funcion grande de metricas ya esta versionada en migraciones previas.
-- Esta sustitucion controlada corrige sus tres filtros del estado legado.
do $$
declare
	v_original text;
	v_actualizada text;
begin
	select pg_get_functiondef('public.calcular_metricas_dashboard(uuid,text)'::regprocedure)
	into v_original;

	v_actualizada := replace(
		v_original,
		'AND estado != ''ANULADO''',
		'AND estado NOT IN (''ANU'', ''DESC'', ''voided'')'
	);

	if v_actualizada = v_original then
		raise exception 'No se encontro el filtro legado de calcular_metricas_dashboard';
	end if;

	execute v_actualizada;
end;
$$;

alter function public.calcular_metricas_dashboard(uuid, text) security invoker;
revoke all on function public.calcular_metricas_dashboard(uuid, text) from public, anon;
grant execute on function public.calcular_metricas_dashboard(uuid, text) to authenticated, service_role;
