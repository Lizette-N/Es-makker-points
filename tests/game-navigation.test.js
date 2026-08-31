import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brugerfladen har adgang til spiloversigt og tidligere spil", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /Spiloversigt/);
  assert.match(source, /Tidligere spil/);
  assert.match(source, /Fortsæt/);
});
