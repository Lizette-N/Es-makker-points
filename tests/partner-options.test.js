import test from "node:test";
import assert from "node:assert/strict";
import { eligiblePartnerIds } from "../src/ui/round-form.js";

test("spilføreren kan ikke vælges som almindelig makker", () => {
  assert.deepEqual(eligiblePartnerIds(["a", "b", "c", "d"], "a"), ["b", "c", "d"]);
});

test("selvmakker har ikke en separat makker", () => {
  assert.deepEqual(eligiblePartnerIds(["a", "b", "c", "d"], "a", true), []);
});
