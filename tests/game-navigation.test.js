import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brugerfladen har adgang til spiloversigt og tidligere spil", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /Spiloversigt/);
  assert.match(source, /Tidligere spil/);
  assert.match(source, /Fortsæt/);
});

test("spil kan slettes fra oversigten med bekræftelse", async () => {
  const [appSource, repositorySource, rules] = await Promise.all([
    readFile(new URL("../src/app.js", import.meta.url), "utf8"),
    readFile(new URL("../src/persistence/firestore-repository.js", import.meta.url), "utf8"),
    readFile(new URL("../firestore.rules", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /confirm\(/);
  assert.match(repositorySource, /export async function deleteGame/);
  assert.match(rules, /allow [^;]*delete/);
});
