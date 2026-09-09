-- Sincronizacion de la vigencia fiscal de comprobantes con el SRI.
-- La consulta al SRI se ejecuta desde la aplicacion; esta migracion solo
-- prepara el modelo de datos, los indices y la publicacion Realtime.

alter table public.comprobantes
	add column if not exists estado_sri varchar(32),
	add column if not exists estado_sri_consultado_at timestamptz,
	add column if not exists estado_sri_origen varchar(32),
	add column if not exists estado_sri_error_codigo varchar(64),
	add column if not exists estado_sri_error_mensaje text,
	add column if not exists estado_sri_consulta_en_curso_at timestamptz;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'comprobantes_estado_sri_check'
			and conrelid = 'public.comprobantes'::regclass
	) then
		alter table public.comprobantes
			add constraint comprobantes_estado_sri_check
			check (
				estado_sri is null
				or estado_sri in (
					'AUTORIZADO',
					'NO AUTORIZADO',
					'PENDIENTE DE ANULAR',
					'ANULADO'
				)
			);
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'comprobantes_estado_sri_origen_check'
			and conrelid = 'public.comprobantes'::regclass
	) then
		alter table public.comprobantes
			add constraint comprobantes_estado_sri_origen_check
			check (
				estado_sri_origen is null
				or estado_sri_origen in ('AUTORIZACION', 'CONSULTA_ESTADO')
			);
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'comprobantes_ambiente_check'
			and conrelid = 'public.comprobantes'::regclass
	) then
		alter table public.comprobantes
			add constraint comprobantes_ambiente_check
			check (ambiente in (1, 2));
	end if;
end
$$;

comment on column public.comprobantes.estado_sri is
	'Ultimo estado fiscal concluyente devuelto por el SRI.';
comment on column public.comprobantes.estado_sri_consultado_at is
	'Fecha de la ultima consulta concluyente al SRI.';
comment on column public.comprobantes.estado_sri_origen is
	'Servicio SRI que produjo el ultimo estado concluyente.';
comment on column public.comprobantes.estado_sri_consulta_en_curso_at is
	'Lease temporal para evitar consultas concurrentes duplicadas.';

-- voided era una anulacion exclusivamente local. No debe presentarse como
-- una anulacion fiscal confirmada por el SRI.
update public.comprobantes
set estado = 'DESC'
where estado = 'voided';

create index if not exists idx_comprobantes_empresa_ambiente_estado_fecha
	on public.comprobantes (empresa_id, ambiente, estado, fecha_emision desc, id);

create index if not exists idx_comprobantes_cliente_id
	on public.comprobantes (cliente_id)
	where cliente_id is not null;

create index if not exists idx_comprobantes_referencia_id
	on public.comprobantes (comprobante_referencia_id)
	where comprobante_referencia_id is not null;

create index if not exists idx_comprobantes_created_by
	on public.comprobantes (created_by)
	where created_by is not null;

do $$
begin
	if not exists (
		select 1
		from pg_publication_tables
		where pubname = 'supabase_realtime'
			and schemaname = 'public'
			and tablename = 'comprobantes'
	) then
		alter publication supabase_realtime add table public.comprobantes;
	end if;
end
$$;
