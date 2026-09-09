-- Los helpers SECURITY DEFINER usados por RLS no deben exponerse como RPC.
-- Se crea una copia en un esquema no publicado y se actualizan todas las
-- politicas que dependen del helper historico.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.user_empresa_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
	select empresa_id
	from public.perfiles_empresa
	where user_id = (select auth.uid())
		and activo = true;
$$;

revoke all on function private.user_empresa_ids() from public, anon;
grant execute on function private.user_empresa_ids() to authenticated, service_role;

do $$
declare
	politica record;
	nueva_condicion text;
begin
	for politica in
		select schemaname, tablename, policyname, qual
		from pg_policies
		where schemaname = 'public'
			and qual ilike '%user_empresa_ids%'
	loop
		nueva_condicion := replace(
			politica.qual,
			'user_empresa_ids()',
			'private.user_empresa_ids()'
		);

		execute format(
			'alter policy %I on %I.%I using (%s)',
			politica.policyname,
			politica.schemaname,
			politica.tablename,
			nueva_condicion
		);
	end loop;
end;
$$;

revoke all on function public.user_empresa_ids() from public, anon, authenticated;
revoke all on function public.user_has_empresa_access(uuid) from public, anon, authenticated;
grant execute on function public.user_empresa_ids() to service_role;
grant execute on function public.user_has_empresa_access(uuid) to service_role;
