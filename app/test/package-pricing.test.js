import test from 'node:test';
import assert from 'node:assert/strict';
import { isPromoActive } from '../src/helpers/packagePricing.js';

test('package promotions apply only during the configured period', () => {
  const now = Date.now();
  const promo = { promoPrice: '100.00', promoStartDate: new Date(now - 60000).toISOString(), promoEndDate: new Date(now + 60000).toISOString() };
  assert.equal(isPromoActive(promo), true);
  assert.equal(isPromoActive({ ...promo, promoEndDate: new Date(now - 1000).toISOString() }), false);
  assert.equal(isPromoActive({ ...promo, promoStartDate: new Date(now + 1000).toISOString() }), false);
  assert.equal(isPromoActive({ ...promo, promoPrice: null }), false);
  assert.equal(isPromoActive({ ...promo, promoEndDate: null }), false);
  assert.equal(isPromoActive({ ...promo, promoStartDate: 'invalid' }), false);
});
