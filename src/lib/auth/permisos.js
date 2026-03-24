export const PERMISOS_ROL = {
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

export const ROLES_LABEL = {
	propietario: 'Propietario',
	admin: 'Administrador',
	contador: 'Contador',
	emisor: 'Emisor',
	visor: 'Solo lectura',
};
