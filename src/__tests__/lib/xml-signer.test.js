import { describe, expect, it } from 'vitest';
import { formatX509IssuerDN } from '@/lib/sri/xml-signer';

describe('formatX509IssuerDN', () => {
	it('usa el OID cuando node-forge no expone shortName ni name', () => {
		const issuer = {
			attributes: [
				{ shortName: 'C', value: 'ES' },
				{ shortName: 'CN', value: 'UANATACA CA2 2016' },
				{ type: '2.5.4.97', value: 'VATES-A66721499' },
			],
		};

		const dn = formatX509IssuerDN(issuer);

		expect(dn).toContain('2.5.4.97=VATES-A66721499');
		expect(dn).not.toContain('undefined=');
	});
});
