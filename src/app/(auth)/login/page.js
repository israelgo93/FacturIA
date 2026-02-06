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

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(login, null);
	const { register, formState: { errors } } = useForm({
		resolver: zodResolver(loginSchema),
	});

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-12">
			<GlassCard className="w-full max-w-md p-8">
				<div className="flex flex-col items-center mb-8">
					<Logo size="lg" className="mb-5" />
					<h1 className="text-lg font-medium text-white/90">Iniciar Sesión</h1>
					<p className="text-xs text-white/30 mt-1">Accede a tu cuenta de facturIA</p>
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
							className="text-xs text-white/30 hover:text-white/50 transition-colors duration-300"
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

				<p className="text-center text-xs text-white/25 mt-8">
					¿No tienes cuenta?{' '}
					<Link
						href="/registro"
						className="text-white/60 hover:text-white font-medium transition-colors duration-300"
					>
						Regístrate gratis
					</Link>
				</p>
			</GlassCard>
		</div>
	);
}
