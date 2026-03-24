'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';

const ChatMessageBubble = memo(function ChatMessageBubble({ message, isLast }) {
	const isUser = message.role === 'user';

	const getTextContent = (msg) => {
		if (msg.parts?.length > 0) {
			return msg.parts
				.filter((p) => p.type === 'text')
				.map((p) => p.text)
				.join('');
		}
		return msg.content || '';
	};

	const text = getTextContent(message);

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
		>
			{!isUser && (
				<div
					className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
					style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
				>
					<Sparkles className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
				</div>
			)}

			<div
				className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
				style={isUser ? {
					background: 'var(--text-primary)',
					color: 'var(--bg-primary)',
				} : {
					background: 'var(--glass-hover)',
					color: 'var(--text-primary)',
					border: '1px solid var(--glass-border)',
				}}
			>
				{isUser ? (
					<p>{text}</p>
				) : (
					<MarkdownRenderer content={text} />
				)}
			</div>

			{isUser && (
				<div
					className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
					style={{ background: 'var(--text-primary)' }}
				>
					<User className="w-4 h-4" style={{ color: 'var(--bg-primary)' }} />
				</div>
			)}
		</motion.div>
	);
});

export default ChatMessageBubble;
