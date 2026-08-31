export function participantSelectionState(selectedCount) {
  return {
    ready: selectedCount === 4,
    disableUnchecked: selectedCount >= 4
  };
}
