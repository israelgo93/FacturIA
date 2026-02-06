'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const themes = [
	{ value: 'light', icon: Sun, label: 'Modo claro' },
	{ value: 'dark', icon: Moon, label: 'Modo oscuro' },
	{ value: 'system', icon: Monitor, label: 'Tema del sistema' },
];

export default function ThemeToggle({ className = '' }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className={`p-2 rounded-xl w-[34px] h-[34px] ${className}`} />
		);
	}

	const cycleTheme = () => {
		const currentIndex = themes.findIndex((t) => t.value === theme);
		const nextIndex = (currentIndex + 1) % themes.length;
		setTheme(themes[nextIndex].value);
	};

	const current = themes.find((t) => t.value === theme) || themes[2];
	const Icon = current.icon;

	return (
		<button
			onClick={cycleTheme}
			className={`p-2 rounded-xl hover:bg-[var(--glass-hover)] transition-colors duration-300 ${className}`}
			aria-label={current.label}
			title={current.label}
		>
			<Icon className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />
		</button>
	);
}
