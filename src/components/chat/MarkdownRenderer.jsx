'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
	return (
		<ReactMarkdown
			components={{
				p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
				strong: ({ children }) => (
					<strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
						{children}
					</strong>
				),
				ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
				ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
				li: ({ children }) => <li className="text-sm">{children}</li>,
				code: ({ inline, children }) =>
					inline ? (
						<code
							className="px-1.5 py-0.5 rounded text-xs font-mono"
							style={{ background: 'var(--glass-hover)', color: 'var(--text-secondary)' }}
						>
							{children}
						</code>
					) : (
						<pre
							className="rounded-lg p-3 overflow-x-auto text-xs mb-2 font-mono"
							style={{ background: 'var(--glass-hover)', color: 'var(--text-primary)' }}
						>
							<code>{children}</code>
						</pre>
					),
				table: ({ children }) => (
					<div className="overflow-x-auto mb-2 rounded-lg" style={{ border: '1px solid var(--glass-border)' }}>
						<table className="w-full text-xs">{children}</table>
					</div>
				),
				th: ({ children }) => (
					<th
						className="px-3 py-2 text-left font-medium text-xs"
						style={{ background: 'var(--glass-hover)', borderBottom: '1px solid var(--glass-border)' }}
					>
						{children}
					</th>
				),
				td: ({ children }) => (
					<td className="px-3 py-2 text-xs" style={{ borderBottom: '1px solid var(--glass-border)' }}>
						{children}
					</td>
				),
			}}
		>
			{content}
		</ReactMarkdown>
	);
}
