import test from "node:test";
import assert from "node:assert/strict";
import { calculateRoundScore, validateRound } from "../src/scoring/score-engine.js";

const players = ["a", "b", "c", "d"];

test("normal meldinger fordeler den eksisterende beregnede værdi som nulsum", () => {
  const result = calculateRoundScore({
    type: "normal",
    activePlayerIds: players,
    declarerId: "a",
    partnerId: "b",
    contractTricks: 9,
    takenTricks: 9
  });

  assert.deepEqual(result, { a: 1, b: 1, c: -1, d: -1 });
});

test("13 meldte og 13 tagne bruger 13-værdien gange 14-resultatet", () => {
  const result = calculateRoundScore({
    type: "normal",
    activePlayerIds: players,
    declarerId: "a",
    partnerId: "b",
    contractTricks: 13,
    takenTricks: 13
  });

  assert.equal(result.a, 32);
  assert.equal(result.b, 32);
  assert.equal(result.c, -32);
  assert.equal(result.d, -32);
});

test("selvmakker fordeler tre gange værdien til melderen", () => {
  const result = calculateRoundScore({
    type: "normal",
    activePlayerIds: players,
    declarerId: "a",
    selfPartner: true,
    contractTricks: 9,
    takenTricks: 9
  });

  assert.deepEqual(result, { a: 3, b: -1, c: -1, d: -1 });
});

test("Sol med én hjem fordeler to point mod hver af de tre andre", () => {
  const result = calculateRoundScore({
    type: "sol",
    activePlayerIds: players,
    solPlayers: [{ playerId: "a", result: "home" }]
  });

  assert.deepEqual(result, { a: 6, b: -2, c: -2, d: -2 });
});

test("Sol med én hjem og én ned giver otte point mellem dem", () => {
  const result = calculateRoundScore({
    type: "sol",
    activePlayerIds: players,
    solPlayers: [
      { playerId: "a", result: "home" },
      { playerId: "b", result: "down" }
    ]
  });

  assert.deepEqual(result, { a: 8, b: -8, c: 0, d: 0 });
});

test("specialmeldinger genbruger Sol-modellen med deres egen værdi", () => {
  const result = calculateRoundScore({
    type: "rensol",
    activePlayerIds: players,
    solPlayers: [
      { playerId: "a", result: "home" },
      { playerId: "b", result: "home" }
    ]
  });

  assert.deepEqual(result, { a: 6, b: 6, c: -6, d: -6 });
});

test("Ren Sol hjem mod ned giver tolv point mellem spillerne", () => {
  const result = calculateRoundScore({
    type: "rensol",
    activePlayerIds: players,
    solPlayers: [
      { playerId: "a", result: "home" },
      { playerId: "b", result: "down" }
    ]
  });

  assert.deepEqual(result, { a: 12, b: -12, c: 0, d: 0 });
});

test("bordmeldinger bruger samme modspillermodel med deres egen værdi", () => {
  const withTrick = calculateRoundScore({
    type: "bordstik",
    activePlayerIds: players,
    solPlayers: [
      { playerId: "a", result: "home" },
      { playerId: "b", result: "down" }
    ]
  });
  const withoutTrick = calculateRoundScore({
    type: "bordnul",
    activePlayerIds: players,
    solPlayers: [
      { playerId: "a", result: "home" },
      { playerId: "b", result: "down" }
    ]
  });

  assert.deepEqual(withTrick, { a: 16, b: -16, c: 0, d: 0 });
  assert.deepEqual(withoutTrick, { a: 20, b: -20, c: 0, d: 0 });
});

test("14 tagne stik kan ikke registreres", () => {
  assert.throws(() => validateRound({
    type: "normal",
    activePlayerIds: players,
    declarerId: "a",
    partnerId: "b",
    contractTricks: 9,
    takenTricks: 14
  }), /mellem 0 og 13/);
});

test("ugyldig runde afvises før beregning", () => {
  assert.throws(() => validateRound({
    type: "normal",
    activePlayerIds: ["a", "a", "c", "d"],
    declarerId: "a",
    partnerId: "b",
    contractTricks: 9,
    takenTricks: 9
  }), /fire forskellige aktive spillere/);
});
