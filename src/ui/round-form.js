export function eligiblePartnerIds(activePlayerIds, declarerId, selfPartner = false) {
  if (selfPartner) return [];
  return activePlayerIds.filter((playerId) => playerId !== declarerId);
}
