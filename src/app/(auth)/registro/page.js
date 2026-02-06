'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { signup } from './actions';
import { registroSchema } from '@/lib/validations/auth';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function RegistroPage() {
	const [state, formAction, isPending] = useActionState(signup, null);
	const { register, formState: { errors } } = useForm({
		resolver: zodResolver(registroSchema),
	});

	if (state?.success) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4 py-12">
				<GlassCard className="w-full max-w-md p-8 text-center">
					<Logo size="lg" className="mb-6 justify-center" />
					<GlassAlert type="success" message={state.success} className="mb-6" />
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
						Una vez confirmes tu correo, podrás{' '}
						<Link href="/login" style={{ color: 'var(--text-secondary)' }}>
							iniciar sesión
						</Link>
					</p>
				</GlassCard>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<GlassCard className="w-full max-w-md p-8">
				<div className="flex flex-col items-center mb-8">
					<Logo size="lg" className="mb-5" />
					<h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Crear Cuenta</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Empieza a facturar con IA</p>
				</div>

				{state?.error && (
					<GlassAlert type="error" message={state.error} className="mb-6" />
				)}

				<form action={formAction} className="space-y-5">
					<GlassInput
						label="Correo electrónico"
						type="email"
						icon={Mail}
						placeholder="tu@empresa.com"
						error={errors.email?.message || state?.errors?.email?.[0]}
						{...register('email')}
					/>
					<GlassInput
						label="Contraseña"
						type="password"
						icon={Lock}
						placeholder="Mínimo 8 caracteres"
						error={errors.password?.message || state?.errors?.password?.[0]}
						{...register('password')}
					/>
					<GlassInput
						label="Confirmar contraseña"
						type="password"
						icon={ShieldCheck}
						placeholder="Repite tu contraseña"
						error={errors.confirmPassword?.message || state?.errors?.confirmPassword?.[0]}
						{...register('confirmPassword')}
					/>
					<GlassButton
						type="submit"
						loading={isPending}
						iconRight={ArrowRight}
						className="w-full"
						size="lg"
					>
						Crear Cuenta
					</GlassButton>
				</form>

				<p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
					¿Ya tienes cuenta?{' '}
					<Link href="/login" className="font-medium transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
						Iniciar sesión
					</Link>
				</p>
			</GlassCard>
		</div>
	);
}
