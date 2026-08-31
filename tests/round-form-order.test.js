import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("meldte stik vises før meldingstype i rundeformularen", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const formMarkup = source.slice(source.indexOf("form.innerHTML ="), source.indexOf("const type = form.elements.type"));

  assert.ok(formMarkup.indexOf("Meldte stik") < formMarkup.indexOf("Spiltype"));
});
