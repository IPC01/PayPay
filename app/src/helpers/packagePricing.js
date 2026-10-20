export function isPromoActive(pack) {
  if (!pack.promoPrice || !pack.promoStartDate || !pack.promoEndDate) return false;
  const now = new Date();
  return new Date(pack.promoStartDate) <= now && now <= new Date(pack.promoEndDate);
}
