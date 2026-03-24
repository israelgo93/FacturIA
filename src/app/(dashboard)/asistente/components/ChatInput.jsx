'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, disabled, isStreaming, placeholder }) {
	const [value, setValue] = useState('');
	const textareaRef = useRef(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 160) + 'px';
	}, [value]);

	const handleSubmit = useCallback(() => {
		if (!value.trim() || disabled) return;
		onSend(value.trim());
		setValue('');
		if (textareaRef.current) textareaRef.current.style.height = 'auto';
	}, [value, disabled, onSend]);

	const handleKeyDown = useCallback((e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}, [handleSubmit]);

	return (
		<div
			className="relative flex items-end gap-2 rounded-2xl px-4 py-3 transition-all"
			style={{
				background: 'var(--glass-bg)',
				border: '1px solid var(--glass-border)',
				boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
			}}
		>
			<textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				rows={1}
				className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-50"
				style={{
					color: 'var(--text-primary)',
					maxHeight: '160px',
					minHeight: '24px',
				}}
			/>
			<button
				onClick={handleSubmit}
				disabled={disabled || !value.trim()}
				className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95"
				style={{
					background: value.trim() && !disabled ? 'var(--text-primary)' : 'var(--glass-hover)',
					color: value.trim() && !disabled ? 'var(--bg-primary)' : 'var(--text-muted)',
					cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
				}}
			>
				{isStreaming ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Send className="w-4 h-4" />
				)}
			</button>
		</div>
	);
}
