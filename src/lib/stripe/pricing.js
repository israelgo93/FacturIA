export const STRIPE_PRICES = {
	starter: process.env.STRIPE_PRICE_STARTER,
	professional: process.env.STRIPE_PRICE_PROFESSIONAL,
	enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export function getStripePriceId(planSlug) {
	return STRIPE_PRICES[planSlug] || null;
}
