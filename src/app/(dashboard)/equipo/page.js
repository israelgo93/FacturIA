'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Shield, UserX, Plus } from 'lucide-react';
import { toast } from 'sonner';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import StatusBadge from '@/components/comprobantes/StatusBadge';
import { ROLES_LABEL } from '@/lib/auth/permisos';
import {
	obtenerMiembros,
	obtenerInvitaciones,
	invitarMiembro,
	revocarInvitacion,
	desactivarMiembro,
} from './actions';

export default function EquipoPage() {
	const [miembros, setMiembros] = useState([]);
	const [invitaciones, setInvitaciones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState('');
	const [rol, setRol] = useState('emisor');
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState(null);

	const cargar = async () => {
		setLoading(true);
		const [m, inv] = await Promise.all([obtenerMiembros(), obtenerInvitaciones()]);

		if (m.error) {
			setError(m.error);
			setLoading(false);
			return;
		}

		setMiembros(m.data || []);
		setInvitaciones(inv.data || []);
		setLoading(false);
	};

	useEffect(() => { cargar(); }, []);

	const handleInvitar = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;
		setEnviando(true);
		const result = await invitarMiembro(email.trim(), rol);
		setEnviando(false);

		if (result.error) {
			toast.error(result.error);
			return;
		}

		toast.success(`Invitacion enviada a ${email}`);
		setEmail('');
		cargar();
	};

	const handleRevocar = async (id) => {
		const result = await revocarInvitacion(id);
		if (result.error) {
			toast.error(result.error);
			return;
		}
		toast.success('Invitacion revocada');
		cargar();
	};

	const handleDesactivar = async (id) => {
		const result = await desactivarMiembro(id);
		if (result.error) {
			toast.error(result.error);
			return;
		}
		toast.success('Miembro desactivado');
		cargar();
	};

	if (error) {
		return (
			<div className="space-y-4">
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Equipo</h1>
				<p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Equipo</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona los miembros de tu empresa</p>
			</div>

			{/* Invitar */}
			<GlassCard className="p-5">
				<h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
					<Plus className="w-4 h-4" /> Invitar miembro
				</h2>
				<form onSubmit={handleInvitar} className="flex flex-col sm:flex-row gap-3">
					<div className="flex-1">
						<GlassInput
							type="email"
							placeholder="email@empresa.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="w-full sm:w-40">
						<GlassSelect value={rol} onChange={(e) => setRol(e.target.value)}>
							<option value="admin">Administrador</option>
							<option value="contador">Contador</option>
							<option value="emisor">Emisor</option>
							<option value="visor">Solo lectura</option>
						</GlassSelect>
					</div>
					<GlassButton type="submit" disabled={enviando} size="sm">
						<Mail className="w-4 h-4 mr-1" /> Invitar
					</GlassButton>
				</form>
			</GlassCard>

			{/* Miembros */}
			<GlassCard className="p-5">
				<h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
					<Users className="w-4 h-4" /> Miembros ({miembros.length})
				</h2>
				{loading ? (
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
				) : (
					<div className="space-y-2">
						{miembros.map((m) => (
							<div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
								<Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
										{m.nombre || m.email || m.user_id?.substring(0, 8) + '...'}
									</p>
									{m.email && m.nombre && (
										<p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
											{m.email}
										</p>
									)}
								</div>
								<StatusBadge estado={m.activo ? 'activo' : 'inactivo'} size="sm" />
								<span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
									{ROLES_LABEL[m.rol] || m.rol}
								</span>
								{m.rol !== 'propietario' && m.activo && (
									<button
										onClick={() => handleDesactivar(m.id)}
										className="p-1 rounded-md transition-colors"
										style={{ color: 'var(--text-muted)' }}
										title="Desactivar"
									>
										<UserX className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</GlassCard>

			{/* Invitaciones */}
			{invitaciones.length > 0 && (
				<GlassCard className="p-5">
					<h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
						<Mail className="w-4 h-4" /> Invitaciones pendientes
					</h2>
					<div className="space-y-2">
						{invitaciones.map((inv) => (
							<div key={inv.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{inv.email}</p>
									<p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
										{ROLES_LABEL[inv.rol] || inv.rol}
									</p>
								</div>
								<StatusBadge estado={inv.estado} size="sm" />
								{inv.estado === 'pendiente' && (
									<button
										onClick={() => handleRevocar(inv.id)}
										className="text-[10px] px-2 py-1 rounded-md transition-colors"
										style={{ color: 'var(--text-muted)', background: 'var(--glass-hover)' }}
									>
										Revocar
									</button>
								)}
							</div>
						))}
					</div>
				</GlassCard>
			)}
		</div>
	);
}
