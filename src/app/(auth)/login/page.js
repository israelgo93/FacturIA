'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { login } from './actions';
import { loginSchema } from '@/lib/validations/auth';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(login, null);
	const { register, formState: { errors } } = useForm({
		resolver: zodResolver(loginSchema),
	});

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<GlassCard className="w-full max-w-md p-8">
				<div className="flex flex-col items-center mb-8">
					<Logo size="lg" className="mb-5" />
					<h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Iniciar Sesión</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Accede a tu cuenta de facturIA</p>
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
						placeholder="Tu contraseña"
						error={errors.password?.message || state?.errors?.password?.[0]}
						{...register('password')}
					/>

					<div className="flex justify-end">
						<Link
							href="/recuperar"
							className="text-xs transition-colors duration-300"
							style={{ color: 'var(--text-muted)' }}
						>
							¿Olvidaste tu contraseña?
						</Link>
					</div>

					<GlassButton
						type="submit"
						loading={isPending}
						iconRight={ArrowRight}
						className="w-full"
						size="lg"
					>
						Iniciar Sesión
					</GlassButton>
				</form>

				<p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
					¿No tienes cuenta?{' '}
					<Link
						href="/registro"
						className="font-medium transition-colors duration-300"
						style={{ color: 'var(--text-secondary)' }}
					>
						Regístrate gratis
					</Link>
				</p>
			</GlassCard>
		</div>
	);
}
