-- facturIA: esquema consolidado para PostgreSQL 17 (Supabase compatible)
-- Generado desde extraccion directa del catalogo pg_catalog (marzo 2026).
-- Incluye tablas public, vistas v_comprobantes_resumen y v_dashboard_kpis,
-- bucket storage certificados, RLS y funciones de negocio.
-- facturIA: tablas public (extraccion desde catalogo PostgreSQL 17.x)
-- Consolidado para instalaciones nuevas. Extensiones requeridas por defaults UUID.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.planes (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	nombre character varying(50) NOT NULL,
	precio_mensual numeric(10,2) NOT NULL,
	limite_comprobantes_mes integer,
	limite_usuarios integer,
	limite_establecimientos integer,
	limite_puntos_emision integer,
	tiene_reportes_ia boolean DEFAULT false,
	tiene_rdep boolean DEFAULT false,
	tiene_api boolean DEFAULT false,
	tiene_multi_empresa boolean DEFAULT false,
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.empresas (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	plan_id uuid,
	ruc character varying(13) NOT NULL,
	razon_social character varying(300) NOT NULL,
	nombre_comercial character varying(300),
	direccion_matriz character varying(300) NOT NULL,
	obligado_contabilidad boolean DEFAULT false,
	contribuyente_especial character varying(10),
	regimen_fiscal character varying(50),
	agente_retencion character varying(8),
	ambiente smallint DEFAULT 1,
	tipo_emision smallint DEFAULT 1,
	email_notificaciones character varying(255),
	telefono character varying(20),
	logo_url text,
	activo boolean DEFAULT true,
	suscripcion_estado character varying(20) DEFAULT 'trial'::character varying,
	suscripcion_inicio timestamp with time zone DEFAULT now(),
	suscripcion_fin timestamp with time zone,
	comprobantes_emitidos_mes integer DEFAULT 0,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),
	onboarding_completado boolean DEFAULT false NOT NULL,
	onboarding_paso integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.establecimientos (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	codigo character varying(3) NOT NULL,
	direccion character varying(300) NOT NULL,
	nombre_comercial character varying(300),
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.puntos_emision (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	establecimiento_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	codigo character varying(3) NOT NULL,
	descripcion character varying(100),
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.secuenciales (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	punto_emision_id uuid NOT NULL,
	tipo_comprobante character varying(2) NOT NULL,
	siguiente integer DEFAULT 1 NOT NULL,
	created_at timestamp with time zone DEFAULT now(),
	establecimiento_id uuid,
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.certificados (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	nombre_archivo character varying(255) NOT NULL,
	storage_path text NOT NULL,
	password_encrypted text NOT NULL,
	emitido_por character varying(300),
	fecha_emision timestamp with time zone,
	fecha_expiracion timestamp with time zone,
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.clientes (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	tipo_identificacion character varying(2) NOT NULL,
	identificacion character varying(20) NOT NULL,
	razon_social character varying(300) NOT NULL,
	direccion character varying(300),
	email character varying(255),
	telefono character varying(20),
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.productos (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	codigo_principal character varying(25) NOT NULL,
	codigo_auxiliar character varying(25),
	nombre character varying(300) NOT NULL,
	descripcion text,
	precio_unitario numeric(18,6) DEFAULT 0 NOT NULL,
	iva_codigo character varying(1) DEFAULT '2'::character varying,
	iva_codigo_porcentaje character varying(4) NOT NULL,
	ice_codigo character varying(4),
	ice_tarifa numeric(10,4),
	irbpnr_tarifa numeric(10,2),
	tiene_stock boolean DEFAULT false,
	stock_actual numeric(18,6) DEFAULT 0,
	categoria character varying(100),
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.comprobantes (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	establecimiento_id uuid NOT NULL,
	punto_emision_id uuid NOT NULL,
	cliente_id uuid,
	tipo_comprobante character varying(2) NOT NULL,
	ambiente smallint NOT NULL,
	tipo_emision smallint DEFAULT 1,
	clave_acceso character varying(49),
	secuencial character varying(9) NOT NULL,
	serie character varying(6) NOT NULL,
	estado character varying(20) DEFAULT 'draft'::character varying,
	fecha_emision date NOT NULL,
	fecha_autorizacion timestamp with time zone,
	numero_autorizacion character varying(49),
	subtotal_sin_impuestos numeric(14,2) DEFAULT 0,
	subtotal_iva numeric(14,2) DEFAULT 0,
	subtotal_iva_0 numeric(14,2) DEFAULT 0,
	subtotal_no_objeto numeric(14,2) DEFAULT 0,
	subtotal_exento numeric(14,2) DEFAULT 0,
	total_descuento numeric(14,2) DEFAULT 0,
	valor_iva numeric(14,2) DEFAULT 0,
	valor_ice numeric(14,2) DEFAULT 0,
	valor_irbpnr numeric(14,2) DEFAULT 0,
	propina numeric(14,2) DEFAULT 0,
	importe_total numeric(14,2) DEFAULT 0,
	moneda character varying(15) DEFAULT 'DOLAR'::character varying,
	formas_pago jsonb DEFAULT '[]'::jsonb,
	xml_sin_firma_path text,
	xml_firmado_path text,
	xml_autorizado_path text,
	ride_pdf_path text,
	email_enviado boolean DEFAULT false,
	email_enviado_at timestamp with time zone,
	doc_sustento_tipo character varying(2),
	doc_sustento_numero character varying(20),
	doc_sustento_fecha date,
	motivo_modificacion character varying(300),
	info_adicional jsonb DEFAULT '{}'::jsonb,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),
	numero_completo text,
	tipo_identificacion_comprador text,
	identificacion_comprador text,
	razon_social_comprador text,
	direccion_comprador text,
	email_comprador text,
	telefono_comprador text,
	xml_sin_firma text,
	xml_firmado text,
	xml_autorizado text,
	observaciones text,
	comprobante_referencia_id uuid,
	created_by uuid,
	periodo_fiscal text,
	tipo_sujeto_retenido text,
	dir_partida text,
	fecha_inicio_transporte date,
	fecha_fin_transporte date,
	razon_social_transportista text,
	tipo_identificacion_transportista text,
	ruc_transportista text,
	placa text,
	razon_social_proveedor text,
	identificacion_proveedor text,
	tipo_identificacion_proveedor text,
	direccion_proveedor text
);

CREATE TABLE public.compras_recibidas (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	tipo_id_proveedor character varying(2) NOT NULL,
	identificacion_proveedor character varying(20) NOT NULL,
	razon_social_proveedor character varying(300) NOT NULL,
	tipo_comprobante character varying(3) NOT NULL,
	cod_sustento character varying(2) NOT NULL,
	establecimiento character varying(3) NOT NULL,
	punto_emision character varying(3) NOT NULL,
	secuencial character varying(9) NOT NULL,
	fecha_emision date NOT NULL,
	fecha_registro date NOT NULL,
	autorizacion character varying(49),
	base_no_grava_iva numeric(14,2) DEFAULT 0,
	base_imponible_0 numeric(14,2) DEFAULT 0,
	base_imponible_iva numeric(14,2) DEFAULT 0,
	base_imp_exenta numeric(14,2) DEFAULT 0,
	monto_iva numeric(14,2) DEFAULT 0,
	monto_ice numeric(14,2) DEFAULT 0,
	retencion_renta numeric(14,2) DEFAULT 0,
	retencion_iva numeric(14,2) DEFAULT 0,
	forma_pago character varying(2),
	pago_loc_ext character varying(2) DEFAULT '01'::character varying,
	pais_pago character varying(3),
	parte_relacionada character varying(2) DEFAULT 'NO'::character varying,
	comprobante_retencion_id uuid,
	incluir_ats boolean DEFAULT true,
	observaciones text,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.reportes_sri (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	tipo_reporte character varying(20) NOT NULL,
	anio integer NOT NULL,
	mes integer,
	periodicidad character varying(10),
	estado character varying(20) DEFAULT 'BORRADOR'::character varying,
	xml_path text,
	excel_path text,
	pdf_resumen_path text,
	generado_por_ia boolean DEFAULT false,
	ia_observaciones text,
	ia_anomalias_detectadas jsonb,
	total_compras numeric(14,2),
	total_ventas numeric(14,2),
	total_retenciones numeric(14,2),
	num_registros_compras integer,
	num_registros_ventas integer,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),
	user_id uuid,
	semestre integer,
	alertas jsonb DEFAULT '[]'::jsonb,
	resumen_ia text,
	total_registros integer DEFAULT 0
);

CREATE TABLE public.config_email (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	proveedor character varying(20) DEFAULT 'resend'::character varying,
	api_key_encrypted text,
	smtp_host character varying(255),
	smtp_port integer,
	smtp_user character varying(255),
	smtp_pass_encrypted text,
	email_remitente character varying(255),
	nombre_remitente character varying(255),
	plantilla_asunto text DEFAULT 'Comprobante ElectrÃ³nico - {tipo} {serie}-{secuencial}'::text,
	plantilla_cuerpo text,
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ia_conversaciones (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	user_id uuid NOT NULL,
	contexto character varying(50),
	mensajes jsonb DEFAULT '[]'::jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.empleados (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	tipo_identificacion character varying(2) NOT NULL,
	identificacion character varying(20) NOT NULL,
	apellidos character varying(200) NOT NULL,
	nombres character varying(200) NOT NULL,
	fecha_ingreso date NOT NULL,
	fecha_salida date,
	cargo character varying(200),
	tipo_contrato character varying(2),
	sueldo_mensual numeric(14,2) DEFAULT 0,
	activo boolean DEFAULT true,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.comprobante_detalles (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	comprobante_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	producto_id uuid,
	codigo_principal character varying(25),
	descripcion character varying(300) NOT NULL,
	cantidad numeric(18,6) NOT NULL,
	precio_unitario numeric(18,6) NOT NULL,
	descuento numeric(14,2) DEFAULT 0,
	precio_total_sin_impuesto numeric(14,2) NOT NULL,
	impuestos jsonb DEFAULT '[]'::jsonb NOT NULL,
	detalles_adicionales jsonb DEFAULT '{}'::jsonb,
	orden integer DEFAULT 0,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.comprobante_pagos (
	id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
	comprobante_id uuid NOT NULL,
	forma_pago text NOT NULL,
	total numeric(14,2) NOT NULL,
	plazo integer,
	unidad_tiempo text DEFAULT 'dias'::text,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.comprobante_impuestos (
	id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
	comprobante_detalle_id uuid NOT NULL,
	codigo text NOT NULL,
	codigo_porcentaje text NOT NULL,
	tarifa numeric(5,2) NOT NULL,
	base_imponible numeric(14,2) NOT NULL,
	valor numeric(14,2) NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.retencion_detalles (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	comprobante_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	cod_sustento character varying(2),
	cod_doc_sustento character varying(3),
	num_doc_sustento character varying(49),
	fecha_emision_doc_sustento date,
	fecha_registro_contable date,
	num_aut_doc_sustento character varying(49),
	pago_loc_ext character varying(2) DEFAULT '01'::character varying,
	codigo_impuesto character varying(1) NOT NULL,
	codigo_retencion character varying(10) NOT NULL,
	base_imponible numeric(14,2) NOT NULL,
	porcentaje_retener numeric(5,2) NOT NULL,
	valor_retenido numeric(14,2) NOT NULL,
	forma_pago character varying(2),
	created_at timestamp with time zone DEFAULT now(),
	total_sin_impuestos numeric(14,2),
	importe_total numeric(14,2)
);

CREATE TABLE public.compras_recibidas_retenciones (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	compra_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	tipo_retencion character varying(1) NOT NULL,
	codigo_retencion character varying(5) NOT NULL,
	base_imponible numeric(14,2) NOT NULL,
	porcentaje numeric(5,2) NOT NULL,
	valor_retenido numeric(14,2) NOT NULL,
	created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.guia_remision_destinatarios (
	id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
	comprobante_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	identificacion_destinatario text NOT NULL,
	razon_social_destinatario text NOT NULL,
	direccion_destinatario text NOT NULL,
	motivo_traslado text NOT NULL,
	ruta text,
	cod_doc_sustento text,
	num_doc_sustento text,
	num_autorizacion_doc_sustento text,
	fecha_emision_doc_sustento date,
	cod_estab_destino text,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.guia_remision_detalles (
	id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
	destinatario_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	codigo_interno text,
	codigo_adicional text,
	descripcion text NOT NULL,
	cantidad numeric(14,6) DEFAULT 0 NOT NULL,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.empleados_ingresos_anuales (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empleado_id uuid NOT NULL,
	empresa_id uuid NOT NULL,
	anio integer NOT NULL,
	sueldo_salario numeric(14,2) DEFAULT 0,
	sobresueldos numeric(14,2) DEFAULT 0,
	participacion_utilidades numeric(14,2) DEFAULT 0,
	ingresos_gravados numeric(14,2) DEFAULT 0,
	decimo_tercero numeric(14,2) DEFAULT 0,
	decimo_cuarto numeric(14,2) DEFAULT 0,
	fondos_reserva numeric(14,2) DEFAULT 0,
	otros_ingresos_gravados numeric(14,2) DEFAULT 0,
	ingresos_gravados_empleador numeric(14,2) DEFAULT 0,
	aporte_iess_personal numeric(14,2) DEFAULT 0,
	impuesto_renta_causado numeric(14,2) DEFAULT 0,
	valor_retenido numeric(14,2) DEFAULT 0,
	gastos_vivienda numeric(14,2) DEFAULT 0,
	gastos_salud numeric(14,2) DEFAULT 0,
	gastos_educacion numeric(14,2) DEFAULT 0,
	gastos_alimentacion numeric(14,2) DEFAULT 0,
	gastos_vestimenta numeric(14,2) DEFAULT 0,
	gastos_turismo numeric(14,2) DEFAULT 0,
	sistema_salario_neto boolean DEFAULT false,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sri_log (
	id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	empresa_id uuid NOT NULL,
	comprobante_id uuid,
	tipo_operacion character varying(30) NOT NULL,
	url_servicio text,
	request_xml text,
	response_xml text,
	estado_respuesta character varying(20),
	mensajes_error jsonb,
	duracion_ms integer,
	created_at timestamp with time zone DEFAULT now()
);


-- Restricciones PK / UNIQUE / CHECK / FK (definiciones desde pg_constraint)

ALTER TABLE ONLY public.planes ADD CONSTRAINT planes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empresas ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.empresas ADD CONSTRAINT uk_empresa_ruc UNIQUE (ruc);
ALTER TABLE ONLY public.empresas ADD CONSTRAINT empresas_ambiente_check CHECK ((ambiente = ANY (ARRAY[1, 2])));

ALTER TABLE ONLY public.establecimientos ADD CONSTRAINT establecimientos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.establecimientos ADD CONSTRAINT uk_estab_empresa UNIQUE (empresa_id, codigo);

ALTER TABLE ONLY public.puntos_emision ADD CONSTRAINT puntos_emision_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.puntos_emision ADD CONSTRAINT uk_pto_emi UNIQUE (establecimiento_id, codigo);

ALTER TABLE ONLY public.secuenciales ADD CONSTRAINT secuenciales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.secuenciales ADD CONSTRAINT uk_secuencial_v2 UNIQUE (empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante);

ALTER TABLE ONLY public.certificados ADD CONSTRAINT certificados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.clientes ADD CONSTRAINT uk_cliente_empresa UNIQUE (empresa_id, identificacion);

ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productos ADD CONSTRAINT uk_producto_empresa UNIQUE (empresa_id, codigo_principal);

ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_clave_acceso_key UNIQUE (clave_acceso);

ALTER TABLE ONLY public.compras_recibidas ADD CONSTRAINT compras_recibidas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reportes_sri ADD CONSTRAINT reportes_sri_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.config_email ADD CONSTRAINT config_email_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.config_email ADD CONSTRAINT uk_config_email_empresa UNIQUE (empresa_id);

ALTER TABLE ONLY public.ia_conversaciones ADD CONSTRAINT ia_conversaciones_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empleados ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.empleados ADD CONSTRAINT empleados_empresa_id_identificacion_key UNIQUE (empresa_id, identificacion);

ALTER TABLE ONLY public.comprobante_detalles ADD CONSTRAINT comprobante_detalles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.comprobante_pagos ADD CONSTRAINT comprobante_pagos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.comprobante_impuestos ADD CONSTRAINT comprobante_impuestos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.retencion_detalles ADD CONSTRAINT retencion_detalles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.compras_recibidas_retenciones ADD CONSTRAINT compras_recibidas_retenciones_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.guia_remision_destinatarios ADD CONSTRAINT guia_remision_destinatarios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.guia_remision_detalles ADD CONSTRAINT guia_remision_detalles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empleados_ingresos_anuales ADD CONSTRAINT empleados_ingresos_anuales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.empleados_ingresos_anuales ADD CONSTRAINT empleados_ingresos_anuales_empleado_id_anio_key UNIQUE (empleado_id, anio);

ALTER TABLE ONLY public.sri_log ADD CONSTRAINT sri_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empresas ADD CONSTRAINT empresas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.empresas ADD CONSTRAINT empresas_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes(id);

ALTER TABLE ONLY public.establecimientos ADD CONSTRAINT establecimientos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.puntos_emision ADD CONSTRAINT puntos_emision_establecimiento_id_fkey FOREIGN KEY (establecimiento_id) REFERENCES public.establecimientos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.puntos_emision ADD CONSTRAINT puntos_emision_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.secuenciales ADD CONSTRAINT secuenciales_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.secuenciales ADD CONSTRAINT secuenciales_punto_emision_id_fkey FOREIGN KEY (punto_emision_id) REFERENCES public.puntos_emision(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.secuenciales ADD CONSTRAINT secuenciales_establecimiento_id_fkey FOREIGN KEY (establecimiento_id) REFERENCES public.establecimientos(id);

ALTER TABLE ONLY public.certificados ADD CONSTRAINT certificados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.clientes ADD CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_establecimiento_id_fkey FOREIGN KEY (establecimiento_id) REFERENCES public.establecimientos(id);
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_punto_emision_id_fkey FOREIGN KEY (punto_emision_id) REFERENCES public.puntos_emision(id);
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_comprobante_referencia_id_fkey FOREIGN KEY (comprobante_referencia_id) REFERENCES public.comprobantes(id);
ALTER TABLE ONLY public.comprobantes ADD CONSTRAINT comprobantes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.compras_recibidas ADD CONSTRAINT compras_recibidas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.compras_recibidas ADD CONSTRAINT compras_recibidas_comprobante_retencion_id_fkey FOREIGN KEY (comprobante_retencion_id) REFERENCES public.comprobantes(id);

ALTER TABLE ONLY public.reportes_sri ADD CONSTRAINT reportes_sri_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reportes_sri ADD CONSTRAINT reportes_sri_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.config_email ADD CONSTRAINT config_email_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ia_conversaciones ADD CONSTRAINT ia_conversaciones_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ia_conversaciones ADD CONSTRAINT ia_conversaciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.empleados ADD CONSTRAINT empleados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comprobante_detalles ADD CONSTRAINT comprobante_detalles_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comprobante_detalles ADD CONSTRAINT comprobante_detalles_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);
ALTER TABLE ONLY public.comprobante_detalles ADD CONSTRAINT comprobante_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);

ALTER TABLE ONLY public.comprobante_pagos ADD CONSTRAINT comprobante_pagos_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comprobante_impuestos ADD CONSTRAINT comprobante_impuestos_comprobante_detalle_id_fkey FOREIGN KEY (comprobante_detalle_id) REFERENCES public.comprobante_detalles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.retencion_detalles ADD CONSTRAINT retencion_detalles_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.retencion_detalles ADD CONSTRAINT retencion_detalles_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE ONLY public.compras_recibidas_retenciones ADD CONSTRAINT compras_recibidas_retenciones_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras_recibidas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.compras_recibidas_retenciones ADD CONSTRAINT compras_recibidas_retenciones_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE ONLY public.guia_remision_destinatarios ADD CONSTRAINT guia_remision_destinatarios_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.guia_remision_destinatarios ADD CONSTRAINT guia_remision_destinatarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.guia_remision_detalles ADD CONSTRAINT guia_remision_detalles_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.guia_remision_destinatarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.guia_remision_detalles ADD CONSTRAINT guia_remision_detalles_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.empleados_ingresos_anuales ADD CONSTRAINT empleados_ingresos_anuales_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.empleados_ingresos_anuales ADD CONSTRAINT empleados_ingresos_anuales_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE ONLY public.sri_log ADD CONSTRAINT sri_log_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sri_log ADD CONSTRAINT sri_log_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id);

CREATE INDEX idx_clientes_empresa ON public.clientes USING btree (empresa_id);
CREATE INDEX idx_clientes_identificacion ON public.clientes USING btree (empresa_id, identificacion);
CREATE INDEX idx_compras_recibidas_empresa_periodo ON public.compras_recibidas USING btree (empresa_id, fecha_emision);
CREATE INDEX idx_compras_recibidas_proveedor ON public.compras_recibidas USING btree (empresa_id, identificacion_proveedor);
CREATE INDEX idx_compras_ret_compra ON public.compras_recibidas_retenciones USING btree (compra_id);
CREATE INDEX idx_detalles_comprobante ON public.comprobante_detalles USING btree (comprobante_id);
CREATE INDEX idx_impuestos_detalle ON public.comprobante_impuestos USING btree (comprobante_detalle_id);
CREATE INDEX idx_pagos_comprobante ON public.comprobante_pagos USING btree (comprobante_id);
CREATE INDEX idx_comprobantes_clave ON public.comprobantes USING btree (clave_acceso);
CREATE INDEX idx_comprobantes_cliente ON public.comprobantes USING btree (empresa_id, cliente_id);
CREATE INDEX idx_comprobantes_empresa ON public.comprobantes USING btree (empresa_id);
CREATE INDEX idx_comprobantes_estado ON public.comprobantes USING btree (empresa_id, estado);
CREATE INDEX idx_comprobantes_fecha ON public.comprobantes USING btree (empresa_id, fecha_emision);
CREATE INDEX idx_comprobantes_fecha_tipo ON public.comprobantes USING btree (empresa_id, fecha_emision DESC, tipo_comprobante);
CREATE INDEX idx_comprobantes_tipo ON public.comprobantes USING btree (empresa_id, tipo_comprobante);
CREATE INDEX idx_comprobantes_tipo_estado ON public.comprobantes USING btree (empresa_id, tipo_comprobante, estado);
CREATE INDEX idx_comprobantes_tipo_fecha ON public.comprobantes USING btree (empresa_id, tipo_comprobante, fecha_emision DESC);
CREATE INDEX idx_empleados_empresa ON public.empleados USING btree (empresa_id);
CREATE INDEX idx_empleados_ingresos_periodo ON public.empleados_ingresos_anuales USING btree (empresa_id, anio);
CREATE INDEX idx_empresas_ruc ON public.empresas USING btree (ruc);
CREATE INDEX idx_empresas_user ON public.empresas USING btree (user_id);
CREATE INDEX idx_establecimientos_empresa ON public.establecimientos USING btree (empresa_id);
CREATE INDEX idx_gr_destinatarios_comprobante ON public.guia_remision_destinatarios USING btree (comprobante_id);
CREATE INDEX idx_gr_destinatarios_empresa ON public.guia_remision_destinatarios USING btree (empresa_id);
CREATE INDEX idx_gr_detalles_destinatario ON public.guia_remision_detalles USING btree (destinatario_id);
CREATE INDEX idx_gr_detalles_empresa ON public.guia_remision_detalles USING btree (empresa_id);
CREATE INDEX idx_productos_empresa ON public.productos USING btree (empresa_id);
CREATE INDEX idx_puntos_emision_empresa ON public.puntos_emision USING btree (empresa_id);
CREATE INDEX idx_reportes_empresa ON public.reportes_sri USING btree (empresa_id, tipo_reporte, anio, mes);
CREATE INDEX idx_retenciones_comprobante ON public.retencion_detalles USING btree (comprobante_id);
CREATE INDEX idx_sri_log_comprobante ON public.sri_log USING btree (comprobante_id);
CREATE INDEX idx_sri_log_empresa ON public.sri_log USING btree (empresa_id);


-- Funciones, triggers, event trigger y vistas (definiciones desde pg_catalog)

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calcular_total_ventas_periodo(p_empresa_id uuid, p_fecha_inicio date, p_fecha_fin date)
 RETURNS TABLE(total numeric, total_iva numeric, total_0 numeric, total_exento numeric, num_comprobantes integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.importe_total), 0)::DECIMAL AS total,
    COALESCE(SUM(c.subtotal_iva), 0)::DECIMAL AS total_iva,
    COALESCE(SUM(c.subtotal_iva_0), 0)::DECIMAL AS total_0,
    COALESCE(SUM(c.subtotal_exento), 0)::DECIMAL AS total_exento,
    COUNT(*)::INT AS num_comprobantes
  FROM comprobantes c
  WHERE c.empresa_id = p_empresa_id
    AND c.tipo_comprobante IN ('01', '03')
    AND c.estado = 'AUT'
    AND c.fecha_emision >= p_fecha_inicio
    AND c.fecha_emision <= p_fecha_fin;
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_secuencial(p_empresa_id uuid, p_establecimiento_id uuid, p_punto_emision_id uuid, p_tipo_comprobante text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_secuencial INTEGER;
BEGIN
  INSERT INTO secuenciales (empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante, siguiente, updated_at)
  VALUES (p_empresa_id, p_establecimiento_id, p_punto_emision_id, p_tipo_comprobante, 2, now())
  ON CONFLICT (empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante)
  DO UPDATE SET
    siguiente = secuenciales.siguiente + 1,
    updated_at = now()
  RETURNING siguiente - 1 INTO v_secuencial;

  RETURN LPAD(v_secuencial::TEXT, 9, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_siguiente_secuencial(p_empresa_id uuid, p_punto_emision_id uuid, p_tipo_comprobante character varying)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_siguiente INT;
BEGIN
  INSERT INTO secuenciales (empresa_id, punto_emision_id, tipo_comprobante, siguiente)
  VALUES (p_empresa_id, p_punto_emision_id, p_tipo_comprobante, 2)
  ON CONFLICT (punto_emision_id, tipo_comprobante)
  DO UPDATE SET siguiente = secuenciales.siguiente + 1
  RETURNING siguiente - 1 INTO v_siguiente;

  RETURN v_siguiente;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_compras_recibidas_updated BEFORE UPDATE ON public.compras_recibidas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_comprobantes_updated BEFORE UPDATE ON public.comprobantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_empleados_updated BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_empleados_ingresos_updated BEFORE UPDATE ON public.empleados_ingresos_anuales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_ia_conversaciones_updated BEFORE UPDATE ON public.ia_conversaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_reportes_updated BEFORE UPDATE ON public.reportes_sri FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
   EXECUTE FUNCTION public.rls_auto_enable();

CREATE OR REPLACE VIEW public.v_comprobantes_resumen
WITH (security_invoker=true) AS
 SELECT empresa_id,
    tipo_comprobante,
    estado,
    date_trunc('month'::text, fecha_emision::timestamp with time zone) AS mes,
    count(*) AS cantidad,
    COALESCE(sum(importe_total), 0::numeric) AS total
   FROM comprobantes
  GROUP BY empresa_id, tipo_comprobante, estado, (date_trunc('month'::text, fecha_emision::timestamp with time zone));

CREATE OR REPLACE VIEW public.v_dashboard_kpis
WITH (security_invoker=true) AS
 SELECT id AS empresa_id,
    razon_social,
    nombre_comercial,
    ruc,
    COALESCE(( SELECT sum(c.importe_total) AS sum
           FROM comprobantes c
          WHERE c.empresa_id = e.id AND (c.tipo_comprobante::text = ANY (ARRAY['01'::character varying, '03'::character varying]::text[])) AND c.estado::text = 'AUT'::text AND c.fecha_emision >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND c.fecha_emision < (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)), 0::numeric) AS ventas_mes,
    COALESCE(( SELECT sum(c.valor_iva) AS sum
           FROM comprobantes c
          WHERE c.empresa_id = e.id AND (c.tipo_comprobante::text = ANY (ARRAY['01'::character varying, '03'::character varying]::text[])) AND c.estado::text = 'AUT'::text AND c.fecha_emision >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND c.fecha_emision < (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)), 0::numeric) AS iva_cobrado_mes,
    COALESCE(( SELECT count(*) AS count
           FROM comprobantes c
          WHERE c.empresa_id = e.id AND c.estado::text <> 'voided'::text AND c.fecha_emision >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND c.fecha_emision < (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)), 0::bigint) AS comprobantes_mes,
    COALESCE(( SELECT count(*) AS count
           FROM clientes cl
          WHERE cl.empresa_id = e.id AND cl.activo = true), 0::bigint) AS total_clientes,
    COALESCE(( SELECT count(*) AS count
           FROM comprobantes c
          WHERE c.empresa_id = e.id AND c.estado::text = 'AUT'::text AND c.fecha_emision >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND c.fecha_emision < (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)), 0::bigint) AS autorizados_mes,
    COALESCE(( SELECT json_agg(sub.* ORDER BY sub.created_at DESC) AS json_agg
           FROM ( SELECT c.id,
                    c.tipo_comprobante,
                    c.numero_completo,
                    c.razon_social_comprador,
                    c.importe_total,
                    c.estado,
                    c.fecha_emision,
                    c.created_at
                   FROM comprobantes c
                  WHERE c.empresa_id = e.id
                  ORDER BY c.created_at DESC
                 LIMIT 5) sub), '[]'::json) AS ultimos_comprobantes
   FROM empresas e
  WHERE activo = true;


-- RLS, politicas public, bucket storage y grants tipicos Supabase

ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_recibidas_retenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobante_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobante_impuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobante_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados_ingresos_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guia_remision_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guia_remision_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puntos_emision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_sri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retencion_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secuenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sri_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY certificados_tenant ON public.certificados FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY clientes_tenant ON public.clientes FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY compras_recibidas_tenant ON public.compras_recibidas FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY compras_recibidas_retenciones_tenant ON public.compras_recibidas_retenciones FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY comprobante_detalles_tenant ON public.comprobante_detalles FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY comprobante_impuestos_tenant ON public.comprobante_impuestos FOR ALL USING ((comprobante_detalle_id IN ( SELECT cd.id FROM comprobante_detalles cd JOIN comprobantes c ON cd.comprobante_id = c.id WHERE (c.empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY comprobante_pagos_tenant ON public.comprobante_pagos FOR ALL USING ((comprobante_id IN ( SELECT comprobantes.id FROM comprobantes WHERE (comprobantes.empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY comprobantes_tenant ON public.comprobantes FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY config_email_tenant ON public.config_email FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY empleados_tenant ON public.empleados FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY empleados_ingresos_anuales_tenant ON public.empleados_ingresos_anuales FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY empresas_own ON public.empresas FOR ALL USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY establecimientos_tenant ON public.establecimientos FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY empresa_isolation_gr_destinatarios ON public.guia_remision_destinatarios FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY empresa_isolation_gr_detalles ON public.guia_remision_detalles FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY ia_conversaciones_tenant ON public.ia_conversaciones FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY planes_public_read ON public.planes FOR SELECT USING (true);

CREATE POLICY productos_tenant ON public.productos FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY puntos_emision_tenant ON public.puntos_emision FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY reportes_sri_tenant ON public.reportes_sri FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY retencion_detalles_tenant ON public.retencion_detalles FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY secuenciales_tenant ON public.secuenciales FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

CREATE POLICY sri_log_tenant ON public.sri_log FOR ALL USING ((empresa_id IN ( SELECT empresas.id FROM empresas WHERE (empresas.user_id = ( SELECT auth.uid() AS uid)))));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'certificados',
	'certificados',
	false,
	5242880,
	ARRAY['application/x-pkcs12', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Empresas pueden leer sus certificados" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'certificados'::text) AND ((storage.foldername(name))[1] IN ( SELECT (empresas.id)::text AS id FROM empresas WHERE (empresas.user_id = auth.uid())))));

CREATE POLICY "Empresas pueden subir certificados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'certificados'::text) AND ((storage.foldername(name))[1] IN ( SELECT (empresas.id)::text AS id FROM empresas WHERE (empresas.user_id = auth.uid())))));

CREATE POLICY "Empresas pueden eliminar sus certificados" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'certificados'::text) AND ((storage.foldername(name))[1] IN ( SELECT (empresas.id)::text AS id FROM empresas WHERE (empresas.user_id = auth.uid())))));

CREATE POLICY "Service role acceso total certificados" ON storage.objects FOR ALL TO service_role USING ((bucket_id = 'certificados'::text)) WITH CHECK ((bucket_id = 'certificados'::text));

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated;
