export function buildScoreLedger(players, rounds) {
  const totals = Object.fromEntries(players.map((player) => [player.id, 0]));
  const rows = [...rounds]
    .sort((first, second) => first.roundNumber - second.roundNumber)
    .map((round) => {
      for (const [playerId, change] of Object.entries(round.scoreChanges || {})) {
        totals[playerId] = (totals[playerId] || 0) + change;
      }
      return { roundNumber: round.roundNumber, totals: { ...totals } };
    });

  return { totals, rows };
}
