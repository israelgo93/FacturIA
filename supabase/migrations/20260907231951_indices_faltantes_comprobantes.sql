-- Indices de cobertura para las dos claves foraneas restantes de
-- comprobantes. El indice compuesto por empresa no cubre estas columnas
-- cuando se consultan o validan de forma independiente.

create index if not exists idx_comprobantes_establecimiento_id
	on public.comprobantes (establecimiento_id)
	where establecimiento_id is not null;

create index if not exists idx_comprobantes_punto_emision_id
	on public.comprobantes (punto_emision_id)
	where punto_emision_id is not null;
