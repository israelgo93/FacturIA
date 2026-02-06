// =============================================
// Constantes globales de facturIA
// =============================================

// URLs de Web Services del SRI
export const SRI_WS = {
	PRUEBAS: {
		RECEPCION: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
		AUTORIZACION: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
	},
	PRODUCCION: {
		RECEPCION: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
		AUTORIZACION: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
	},
};

// Tipos de comprobantes electrónicos
export const TIPOS_COMPROBANTE = {
	'01': 'Factura',
	'04': 'Nota de Crédito',
	'05': 'Nota de Débito',
	'06': 'Guía de Remisión',
	'07': 'Comprobante de Retención',
	'08': 'Liquidación de Compra',
};

// Estados del comprobante
export const ESTADOS_COMPROBANTE = {
	CREADO: 'CREADO',
	FIRMADO: 'FIRMADO',
	ENVIADO: 'ENVIADO',
	RECIBIDA: 'RECIBIDA',
	AUTORIZADO: 'AUTORIZADO',
	NO_AUTORIZADO: 'NO_AUTORIZADO',
	ANULADO: 'ANULADO',
	PPR: 'PPR',
};

// Ambientes SRI
export const AMBIENTES = {
	PRUEBAS: 1,
	PRODUCCION: 2,
};

// Planes SaaS
export const PLANES = {
	STARTER: 'starter',
	PROFESSIONAL: 'professional',
	ENTERPRISE: 'enterprise',
};

// Estados de suscripción
export const ESTADOS_SUSCRIPCION = {
	TRIAL: 'trial',
	ACTIVE: 'active',
	SUSPENDED: 'suspended',
	CANCELLED: 'cancelled',
};

// Regímenes fiscales
export const REGIMENES_FISCALES = {
	GENERAL: 'GENERAL',
	RIMPE_EMPRENDEDOR: 'RIMPE_EMPRENDEDOR',
	RIMPE_NEGOCIO_POPULAR: 'RIMPE_NEGOCIO_POPULAR',
};

// Navegación del dashboard
export const NAV_ITEMS = [
	{ label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
	{ label: 'Comprobantes', href: '/comprobantes', icon: 'FileText' },
	{ label: 'Clientes', href: '/clientes', icon: 'Users' },
	{ label: 'Productos', href: '/productos', icon: 'Package' },
	{ label: 'Reportes', href: '/reportes', icon: 'BarChart3' },
	{ label: 'Configuración', href: '/configuracion', icon: 'Settings' },
];

// Items de navegación inferior mobile
export const BOTTOM_NAV_ITEMS = [
	{ label: 'Inicio', href: '/', icon: 'LayoutDashboard' },
	{ label: 'Comprobantes', href: '/comprobantes', icon: 'FileText' },
	{ label: 'Nuevo', href: '/comprobantes/nueva-factura', icon: 'PlusCircle' },
	{ label: 'Reportes', href: '/reportes', icon: 'BarChart3' },
	{ label: 'Más', href: '/configuracion', icon: 'Menu' },
];
