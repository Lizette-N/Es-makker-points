const MATRIX = [
  [7, 0, 1],
  [8, 0, 2],
  [9, 0.25, 3],
  [10, 0.5, 4],
  [11, 1, 5],
  [12, 2, 6],
  [13, 4, 7],
  [14, 8, 8],
  [15, 16, 9],
  [16, 32, 10]
];

const TYPE_OFFSETS = {
  normal: 0,
  gode: 1,
  halv: 1,
  "vip i 1.": 1,
  "vip i 2.": 2,
  "vip i 3.": 3
};

const SPECIAL_VALUES = {
  sol: 2,
  rensol: 5,
  bordstik: 4,
  bordnul: 5
};

export function normalizeTricks(value) {
  return value === 13 ? 14 : value;
}

function roundValue(value) {
  return Math.ceil(value);
}

function validatePlayers(activePlayerIds) {
  if (!Array.isArray(activePlayerIds) || activePlayerIds.length !== 4) {
    throw new Error("Der skal være præcis fire aktive spillere");
  }

  if (new Set(activePlayerIds).size !== 4) {
    throw new Error("Der skal være fire forskellige aktive spillere");
  }
}

export function validateRound(round) {
  validatePlayers(round?.activePlayerIds);

  if (!Object.hasOwn(TYPE_OFFSETS, round.type) && !Object.hasOwn(SPECIAL_VALUES, round.type)) {
    throw new Error("Ukendt meldingstype");
  }

  const active = new Set(round.activePlayerIds);

  if (Object.hasOwn(TYPE_OFFSETS, round.type)) {
    if (!Number.isInteger(round.contractTricks) || round.contractTricks < 7 || round.contractTricks > 14) {
      throw new Error("Meldte stik skal være et helt tal mellem 7 og 14");
    }

    if (!Number.isInteger(round.takenTricks) || round.takenTricks < 0 || round.takenTricks > 13) {
      throw new Error("Tagne stik skal være et helt tal mellem 0 og 13");
    }

    if (!active.has(round.declarerId)) {
      throw new Error("Spilfører skal være aktiv i runden");
    }

    if (round.selfPartner) {
      if (round.partnerId !== undefined && round.partnerId !== null) {
        throw new Error("Selvmakker må ikke have en separat makker");
      }
    } else if (!active.has(round.partnerId) || round.partnerId === round.declarerId) {
      throw new Error("Makker skal være en anden aktiv spiller");
    }
  } else {
    if (!Array.isArray(round.solPlayers) || round.solPlayers.length < 1 || round.solPlayers.length > 4) {
      throw new Error("Der skal vælges mellem én og fire specialspillere");
    }

    const ids = round.solPlayers.map((entry) => entry.playerId);
    if (new Set(ids).size !== ids.length || ids.some((id) => !active.has(id))) {
      throw new Error("Specialspillere skal være forskellige aktive spillere");
    }

    if (round.solPlayers.some((entry) => !["home", "down"].includes(entry.result))) {
      throw new Error("Alle specialspillere skal være markeret som hjem eller ned");
    }
  }

  return true;
}

function calculateOrdinaryValue(round) {
  const contract = normalizeTricks(round.contractTricks);
  const taken = normalizeTricks(round.takenTricks);
  const offset = TYPE_OFFSETS[round.type];
  const contractIndex = MATRIX.findIndex(([tricks]) => tricks === contract);

  if (contractIndex < 0) {
    throw new Error("Meldingen kan ikke beregnes");
  }

  if (contract > taken) {
    const missing = contract - taken;
    const lossIndex = Math.min(contractIndex + offset + 1, MATRIX.length - 1);
    return -roundValue(MATRIX[lossIndex][1] * missing);
  }

  const winIndex = Math.min(contractIndex + offset, MATRIX.length - 1);
  const takenIndex = MATRIX.findIndex(([tricks]) => tricks === taken);
  if (takenIndex < 0) {
    throw new Error("Resultatet kan ikke beregnes");
  }

  return roundValue(MATRIX[winIndex][1] * MATRIX[takenIndex][2]);
}

function calculateSpecialChanges(round) {
  const value = SPECIAL_VALUES[round.type];
  const changes = Object.fromEntries(round.activePlayerIds.map((id) => [id, 0]));
  const statuses = new Map(round.solPlayers.map(({ playerId, result }) => [playerId, result]));

  if (round.type !== "sol") {
    for (const { playerId, result } of round.solPlayers) {
      const direction = result === "home" ? 1 : -1;
      for (const opponentId of round.activePlayerIds.filter((id) => !statuses.has(id))) {
        changes[playerId] += value * direction;
        changes[opponentId] -= value * direction;
      }
    }
    return changes;
  }

  for (let firstIndex = 0; firstIndex < round.activePlayerIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < round.activePlayerIds.length; secondIndex += 1) {
      const firstId = round.activePlayerIds[firstIndex];
      const secondId = round.activePlayerIds[secondIndex];
      const first = statuses.get(firstId);
      const second = statuses.get(secondId);

      if (first === "home" && !second) {
        changes[firstId] += value;
        changes[secondId] -= value;
      } else if (first === "down" && !second) {
        changes[firstId] -= value;
        changes[secondId] += value;
      } else if (first === "home" && second === "down") {
        changes[firstId] += value * 2;
        changes[secondId] -= value * 2;
      } else if (first === "down" && second === "home") {
        changes[firstId] -= value * 2;
        changes[secondId] += value * 2;
      }
    }
  }

  return changes;
}

export function calculateRoundScore(round) {
  validateRound(round);

  const changes = Object.fromEntries(round.activePlayerIds.map((id) => [id, 0]));

  if (Object.hasOwn(SPECIAL_VALUES, round.type)) {
    Object.assign(changes, calculateSpecialChanges(round));
  } else {
    const value = calculateOrdinaryValue(round);
    changes[round.declarerId] = round.selfPartner ? value * 3 : value;

    if (!round.selfPartner) {
      changes[round.partnerId] = value;
    }

    const winners = new Set(round.selfPartner ? [round.declarerId] : [round.declarerId, round.partnerId]);
    for (const id of round.activePlayerIds) {
      if (!winners.has(id)) changes[id] = -value;
    }
  }

  if (Object.values(changes).reduce((sum, value) => sum + value, 0) !== 0) {
    throw new Error("Pointfordelingen skal være nulsum");
  }

  return changes;
}
