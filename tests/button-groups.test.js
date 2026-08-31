import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONTRACT_TRICKS, renderChoiceButtons } from "../src/ui/button-group.js";

test("standardmeldingen er 9 stik", () => {
  assert.equal(DEFAULT_CONTRACT_TRICKS, 9);
});

test("en knapgruppe har præcis ét valgt element", () => {
  const markup = renderChoiceButtons("contractTricks", [
    { value: 7, label: "7" },
    { value: 9, label: "9" },
    { value: 10, label: "10" }
  ], 9);

  assert.match(markup, /name="contractTricks" value="9"/);
  assert.equal((markup.match(/aria-pressed="true"/g) || []).length, 1);
  assert.equal((markup.match(/aria-pressed="false"/g) || []).length, 2);
  assert.doesNotMatch(markup, /<select/);
});
