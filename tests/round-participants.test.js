import test from "node:test";
import assert from "node:assert/strict";
import { participantSelectionState } from "../src/ui/round-participants.js";

test("rundeformularen er låst indtil fire spillere er valgt", () => {
  assert.deepEqual(participantSelectionState(0), { ready: false, disableUnchecked: false });
  assert.deepEqual(participantSelectionState(3), { ready: false, disableUnchecked: false });
  assert.deepEqual(participantSelectionState(4), { ready: true, disableUnchecked: true });
});

