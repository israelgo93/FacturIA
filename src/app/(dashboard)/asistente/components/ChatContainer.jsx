'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import ChatMessageBubble from './ChatMessageBubble';
import ChatInput from './ChatInput';
import ChatSuggestionChips from './ChatSuggestionChips';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatEmptyState from './ChatEmptyState';

export default function ChatContainer({ empresa, kpis }) {
	const [isAtBottom, setIsAtBottom] = useState(true);
	const scrollRef = useRef(null);
	const messagesEnd = useRef(null);

	const transport = useMemo(
		() => new DefaultChatTransport({ api: '/api/reportes/chat' }),
		[]
	);

	const { messages, sendMessage, status, setMessages } = useChat({ transport });
	const isStreaming = status === 'streaming' || status === 'submitted';
	const chatReady = !!empresa?.id;

	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
	}, []);

	useEffect(() => {
		if (isAtBottom) {
			messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isAtBottom]);

	const handleSend = useCallback((text) => {
		if (!text.trim() || isStreaming || !empresa?.id) return;
		sendMessage({ text }, { body: { empresaId: empresa.id } });
	}, [isStreaming, empresa, sendMessage]);

	const handleNewChat = useCallback(() => {
		setMessages([]);
	}, [setMessages]);

	return (
		<div
			className="flex flex-col h-[calc(100vh-var(--topbar-height,64px)-var(--bottomnav-height,64px)-2rem)] rounded-2xl overflow-hidden"
			style={{
				background: 'var(--glass-bg)',
				border: '1px solid var(--glass-border)',
				backdropFilter: 'blur(20px)',
			}}
		>
			{/* Header */}
			<div
				className="flex items-center gap-3 px-4 md:px-6 py-3"
				style={{ borderBottom: '1px solid var(--glass-border)' }}
			>
				<Link href="/reportes">
					<button
						className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
						style={{ color: 'var(--text-secondary)' }}
					>
						<ArrowLeft className="w-4 h-4" />
					</button>
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
						Asistente Tributario IA
					</h1>
					{empresa?.razon_social && (
						<p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
							{empresa.razon_social}
						</p>
					)}
				</div>
				{messages.length > 0 && (
					<button
						onClick={handleNewChat}
						className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95"
						style={{ color: 'var(--text-secondary)', background: 'var(--glass-hover)' }}
						title="Nuevo chat"
					>
						<Plus className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Mensajes */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 scroll-smooth"
			>
				{messages.length === 0 ? (
					<ChatEmptyState
						empresa={empresa}
						kpis={kpis}
						onSuggestion={handleSend}
						disabled={!chatReady}
					/>
				) : (
					<AnimatePresence mode="popLayout">
						{messages.map((msg, i) => (
							<ChatMessageBubble
								key={msg.id || i}
								message={msg}
								isLast={i === messages.length - 1}
							/>
						))}
						{isStreaming && <ChatTypingIndicator key="typing" />}
					</AnimatePresence>
				)}
				<div ref={messagesEnd} />
			</div>

			{/* Sugerencias + Input */}
			<div
				className="px-4 md:px-6 pb-4 pt-2 space-y-3"
				style={{ borderTop: '1px solid var(--glass-border)' }}
			>
				{messages.length > 0 && !isStreaming && (
					<ChatSuggestionChips onSelect={handleSend} disabled={!chatReady} />
				)}
				<ChatInput
					onSend={handleSend}
					disabled={!chatReady || isStreaming}
					isStreaming={isStreaming}
					placeholder={!chatReady ? 'Cargando empresa...' : 'Escribe tu consulta tributaria...'}
				/>
			</div>
		</div>
	);
}
