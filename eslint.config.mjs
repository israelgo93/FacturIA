import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
	...nextVitals,
	{
		rules: {
			// Patrones válidos en esta codebase — degradar a warning
			'react-hooks/set-state-in-effect': 'warn',
			'react-hooks/static-components': 'warn',
			'react-hooks/immutability': 'warn',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
]);

export default eslintConfig;
