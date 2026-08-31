export function participantSelectionState(selectedCount) {
  return {
    ready: selectedCount === 4,
    disableUnchecked: selectedCount >= 4
  };
}

export function defaultActivePlayerIds(players) {
  return players.length === 4 ? players.map((player) => player.id) : [];
}
