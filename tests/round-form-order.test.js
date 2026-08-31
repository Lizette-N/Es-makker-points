import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("meldte stik vises før meldingstype i rundeformularen", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const formMarkup = source.slice(source.indexOf("form.innerHTML ="), source.indexOf("const type = form.elements.type"));

  assert.ok(formMarkup.indexOf("Meldte stik") < formMarkup.indexOf("Spiltype"));
});

test("brugerfladen kalder rollen selvpalle", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /Selvpalle/);
  assert.doesNotMatch(source, /[Ss]elvmakker/);
});

test("gemning deaktiverer gem-knappen og ikke en valgknap", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /form\.querySelector\("#save-round"\)/);
});

test("specialmeldinger står i deres egen række", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /type-special-choices/);
});

test("selvpalle er et makkervalg og tagne stik stopper ved 13", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /partnerChoices.*Selvpalle/);
  assert.doesNotMatch(source, /name="selfPartner"/);
  assert.match(source, /Array\.from\(\{ length: 14 \}/);
  assert.match(source, /contractChoices = Array\.from\(\{ length: 7 \}/);
});

test("Sol-resultater viser Ikke med over Hjem og Ned", async () => {
  const css = await readFile(new URL("../style.css", import.meta.url), "utf8");

  assert.match(css, /\.special-grid \.choice-buttons[^}]*repeat\(2/);
  assert.match(css, /\.special-grid \.choice-button:first-child[^}]*grid-column: 1 \/ -1/);
});
