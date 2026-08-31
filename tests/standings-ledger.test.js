import test from "node:test";
import assert from "node:assert/strict";
import { buildScoreLedger } from "../src/domain/standings.js";

test("regnskabet viser kumulativ score efter hver runde", () => {
  const players = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
  const rounds = [
    { roundNumber: 2, scoreChanges: { a: -2, b: 2, c: 0, d: 0 } },
    { roundNumber: 1, scoreChanges: { a: 1, b: 1, c: -2, e: 0 } },
    { roundNumber: 0, scoreChanges: { a: -1, b: -1, c: -1, e: 3 } }
  ];

  const ledger = buildScoreLedger(players, rounds);

  assert.deepEqual(ledger.rows, [
    { roundNumber: 0, totals: { a: -1, b: -1, c: -1, d: 0, e: 3 } },
    { roundNumber: 1, totals: { a: 0, b: 0, c: -3, d: 0, e: 3 } },
    { roundNumber: 2, totals: { a: -2, b: 2, c: -3, d: 0, e: 3 } }
  ]);
  assert.deepEqual(ledger.totals, { a: -2, b: 2, c: -3, d: 0, e: 3 });
});
