import test from "node:test";
import assert from "node:assert/strict";
import { calculateRoundScore, validateRound } from "../src/scoring/score-engine.js";

const players = ["Anders", "Peter", "Mikkel", "Søren"];

function ordinary(type, contractTricks, takenTricks, options = {}) {
  return {
    type,
    activePlayerIds: players,
    declarerId: "Anders",
    partnerId: options.selfPartner ? null : "Peter",
    selfPartner: Boolean(options.selfPartner),
    contractTricks,
    takenTricks
  };
}

function special(type, entries) {
  return {
    type,
    activePlayerIds: players,
    solPlayers: entries.map(([playerId, result]) => ({ playerId, result }))
  };
}

const scenarios = [
  ["1. 9 normal, præcis 9 stik", ordinary("normal", 9, 9), { Anders: 1, Peter: 1, Mikkel: -1, Søren: -1 }],
  ["2. 9 normal, 10 stik", ordinary("normal", 9, 10), { Anders: 1, Peter: 1, Mikkel: -1, Søren: -1 }],
  ["3. 9 normal, 11 stik", ordinary("normal", 9, 11), { Anders: 2, Peter: 2, Mikkel: -2, Søren: -2 }],
  ["4. 10 normal, præcis 10 stik", ordinary("normal", 10, 10), { Anders: 2, Peter: 2, Mikkel: -2, Søren: -2 }],
  ["5. 10 normal, 13 stik tæller som 14", ordinary("normal", 10, 13), { Anders: 4, Peter: 4, Mikkel: -4, Søren: -4 }],
  ["6. 12 normal, præcis 12 stik", ordinary("normal", 12, 12), { Anders: 12, Peter: 12, Mikkel: -12, Søren: -12 }],
  ["7. 13 normal, 13 stik giver 4 gange 8", ordinary("normal", 13, 13), { Anders: 32, Peter: 32, Mikkel: -32, Søren: -32 }],
  ["8. 9 normal, ét stik ned", ordinary("normal", 9, 8), { Anders: -1, Peter: -1, Mikkel: 1, Søren: 1 }],
  ["9. 9 normal, to stik ned", ordinary("normal", 9, 7), { Anders: -1, Peter: -1, Mikkel: 1, Søren: 1 }],
  ["10. 10 normal, to stik ned", ordinary("normal", 10, 8), { Anders: -2, Peter: -2, Mikkel: 2, Søren: 2 }],
  ["11. 12 normal, tre stik ned", ordinary("normal", 12, 9), { Anders: -12, Peter: -12, Mikkel: 12, Søren: 12 }],
  ["12. 9 Gode, 10 stik", ordinary("gode", 9, 10), { Anders: 2, Peter: 2, Mikkel: -2, Søren: -2 }],
  ["13. 9 Gode, kun 7 stik", ordinary("gode", 9, 7), { Anders: -2, Peter: -2, Mikkel: 2, Søren: 2 }],
  ["14. 10 Gode, kun 8 stik", ordinary("gode", 10, 8), { Anders: -4, Peter: -4, Mikkel: 4, Søren: 4 }],
  ["15. 9 Vip 2, præcis 9 stik", ordinary("vip i 2.", 9, 9), { Anders: 3, Peter: 3, Mikkel: -3, Søren: -3 }],
  ["16. 9 Vip 2, ét stik ned", ordinary("vip i 2.", 9, 8), { Anders: -2, Peter: -2, Mikkel: 2, Søren: 2 }],
  ["17. 9 normal Selvpalle, præcis hjem", ordinary("normal", 9, 9, { selfPartner: true }), { Anders: 3, Peter: -1, Mikkel: -1, Søren: -1 }],
  ["18. 10 Gode Selvpalle, to stik ned", ordinary("gode", 10, 8, { selfPartner: true }), { Anders: -12, Peter: 4, Mikkel: 4, Søren: 4 }],
  ["19. Én Sol går hjem", special("sol", [["Anders", "home"]]), { Anders: 6, Peter: -2, Mikkel: -2, Søren: -2 }],
  ["20. To Sol går hjem", special("sol", [["Anders", "home"], ["Peter", "home"]]), { Anders: 4, Peter: 4, Mikkel: -4, Søren: -4 }],
  ["21. To Sol går ned", special("sol", [["Anders", "down"], ["Peter", "down"]]), { Anders: -4, Peter: -4, Mikkel: 4, Søren: 4 }],
  ["22. Én Sol hjem og én Sol ned", special("sol", [["Anders", "home"], ["Peter", "down"]]), { Anders: 8, Peter: -8, Mikkel: 0, Søren: 0 }],
  ["23. Tre Sol går hjem", special("sol", [["Anders", "home"], ["Peter", "home"], ["Mikkel", "home"]]), { Anders: 2, Peter: 2, Mikkel: 2, Søren: -6 }],
  ["24. To Sol hjem og én Sol ned", special("sol", [["Anders", "home"], ["Peter", "home"], ["Mikkel", "down"]]), { Anders: 6, Peter: 6, Mikkel: -10, Søren: -2 }],
  ["25. Fire Sol går hjem og udligner hinanden", special("sol", [["Anders", "home"], ["Peter", "home"], ["Mikkel", "home"], ["Søren", "home"]]), { Anders: 0, Peter: 0, Mikkel: 0, Søren: 0 }],
  ["26. Én Ren Sol går hjem", special("rensol", [["Anders", "home"]]), { Anders: 9, Peter: -3, Mikkel: -3, Søren: -3 }],
  ["27. To Ren Sol går hjem", special("rensol", [["Anders", "home"], ["Peter", "home"]]), { Anders: 6, Peter: 6, Mikkel: -6, Søren: -6 }],
  ["28. Én Ren Sol hjem og én ned", special("rensol", [["Anders", "home"], ["Peter", "down"]]), { Anders: 6, Peter: -6, Mikkel: 0, Søren: 0 }],
  ["29. Tre Ren Sol går hjem", special("rensol", [["Anders", "home"], ["Peter", "home"], ["Mikkel", "home"]]), { Anders: 3, Peter: 3, Mikkel: 3, Søren: -9 }],
  ["30. Bord med stik: én hjem og én ned", special("bordstik", [["Anders", "home"], ["Peter", "down"]]), { Anders: 8, Peter: -8, Mikkel: 0, Søren: 0 }],
  ["31. Bord uden stik: én hjem og én ned", special("bordnul", [["Anders", "home"], ["Peter", "down"]]), { Anders: 10, Peter: -10, Mikkel: 0, Søren: 0 }]
];

for (const [name, round, expected] of scenarios) {
  test(name, () => {
    const result = calculateRoundScore(round);
    assert.deepEqual(result, expected);
    assert.equal(Object.values(result).reduce((sum, value) => sum + value, 0), 0);
  });
}

test("32. Ugyldigt: der må ikke registreres 14 tagne stik", () => {
  assert.throws(() => validateRound(ordinary("normal", 9, 14)), /mellem 0 og 13/);
});

test("33. Ugyldigt: en runde skal have fire forskellige spillere", () => {
  assert.throws(() => validateRound({ ...ordinary("normal", 9, 9), activePlayerIds: ["Anders", "Anders", "Mikkel", "Søren"] }), /fire forskellige/);
});

test("34. Ugyldigt: en Sol-spiller skal være aktiv", () => {
  assert.throws(() => validateRound(special("sol", [["Ukendt", "home"]])), /aktive spillere/);
});

test("35. Ugyldigt: der må ikke meldes 14 stik", () => {
  assert.throws(() => validateRound(ordinary("normal", 14, 13)), /mellem 7 og 13/);
});
