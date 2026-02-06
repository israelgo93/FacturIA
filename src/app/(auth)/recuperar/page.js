'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { resetPassword } from './actions';
import { recuperarSchema } from '@/lib/validations/auth';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';
import Logo from '@/components/shared/Logo';

export default function RecuperarPage() {
	const [state, formAction, isPending] = useActionState(resetPassword, null);
	const { register, formState: { errors } } = useForm({
		resolver: zodResolver(recuperarSchema),
	});

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-12">
			<GlassCard className="w-full max-w-md p-8">
				<div className="flex flex-col items-center mb-8">
					<Logo size="lg" className="mb-5" />
					<h1 className="text-lg font-medium text-white/90">Recuperar Contraseña</h1>
					<p className="text-xs text-white/30 mt-1">Te enviaremos un enlace para restablecerla</p>
				</div>

				{state?.success && (
					<GlassAlert type="success" message={state.success} className="mb-6" />
				)}
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

					<GlassButton
						type="submit"
						loading={isPending}
						iconRight={ArrowRight}
						className="w-full"
						size="lg"
					>
						Enviar Enlace
					</GlassButton>
				</form>

				<div className="text-center mt-8">
					<Link
						href="/login"
						className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors duration-300"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Volver al inicio de sesión
					</Link>
				</div>
			</GlassCard>
		</div>
	);
}
