import test from "node:test";
import assert from "node:assert/strict";
import { defaultActivePlayerIds, participantSelectionState } from "../src/ui/round-participants.js";

test("rundeformularen er låst indtil fire spillere er valgt", () => {
  assert.deepEqual(participantSelectionState(0), { ready: false, disableUnchecked: false });
  assert.deepEqual(participantSelectionState(3), { ready: false, disableUnchecked: false });
  assert.deepEqual(participantSelectionState(4), { ready: true, disableUnchecked: true });
});

test("alle spillere vælges automatisk når spillet har præcis fire", () => {
  const four = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const five = [...four, { id: "e" }];

  assert.deepEqual(defaultActivePlayerIds(four), ["a", "b", "c", "d"]);
  assert.deepEqual(defaultActivePlayerIds(five), []);
});
