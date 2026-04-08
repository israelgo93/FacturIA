export const PERMISOS_ROL = {
	superadmin: ['*', 'admin_panel', 'admin_empresas', 'admin_suscripciones', 'admin_audit'],
	propietario: ['*'],
	admin: ['emitir', 'reportes', 'ats', 'rdep', 'chat', 'config', 'equipo'],
	contador: ['emitir', 'reportes', 'ats', 'rdep', 'chat'],
	emisor: ['emitir'],
	visor: ['reportes', 'chat'],
};

export function verificarPermiso(rol, permiso) {
	const permisos = PERMISOS_ROL[rol];
	if (!permisos) return false;
	return permisos.includes('*') || permisos.includes(permiso);
}

export function esSuperAdmin(rol) {
	return rol === 'superadmin';
}

export const ROLES_LABEL = {
	superadmin: 'SuperAdmin',
	propietario: 'Propietario',
	admin: 'Administrador',
	contador: 'Contador',
	emisor: 'Emisor',
	visor: 'Solo lectura',
};
