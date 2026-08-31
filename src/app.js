import { calculateRoundScore } from "./scoring/score-engine.js";
import { buildScoreLedger } from "./domain/standings.js";
import { eligiblePartnerIds } from "./ui/round-form.js";
import { bindChoiceButtons, DEFAULT_CONTRACT_TRICKS, renderChoiceButtonList, renderChoiceButtons, setChoiceAvailability } from "./ui/button-group.js";
import { participantSelectionState } from "./ui/round-participants.js";

const app = document.querySelector("#app");
const params = new URLSearchParams(location.search);
const gameId = params.get("game");
const state = { game: null, players: [], rounds: [], editingRound: null };

function id() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function now() { return new Date().toISOString(); }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
function setStatus(message, type = "") {
  const status = document.querySelector("#status") || document.createElement("p");
  status.id = "status"; status.className = `status ${type}`; status.textContent = message;
  if (!status.parentElement) app.prepend(status);
}
function playerName(playerId) { return state.players.find((player) => player.id === playerId)?.name || "Ukendt spiller"; }
function activePlayers() { return state.players.filter((player) => document.querySelector(`#active-${player.id}`)?.checked); }
function formatPoints(value) { return value > 0 ? `+${value}` : String(value); }

function renderSetup() {
  app.innerHTML = `<div class="topbar"><h1>Es-makker Whist</h1></div><section class="section"><h2>Tidligere spil</h2><div id="game-list" class="game-list"><p class="muted">Indlæser spil...</p></div></section><section class="section"><h2>Nyt spil</h2><p class="help">Opret et spil og del linket med de andre spillere.</p><form id="setup-form" class="form-grid"><label>Spillets navn<input name="name" required maxlength="80" placeholder="Sommerhus Whist 2026"></label><div id="setup-players"></div><button>Opret spil</button></form></section>`;
  const holder = document.querySelector("#setup-players");
  for (let index = 0; index < 7; index += 1) {
    holder.insertAdjacentHTML("beforeend", `<div class="player-row"><label>Spiller ${index + 1}<input name="player-${index}" maxlength="50" placeholder="Navn"></label></div>`);
  }
  document.querySelector("#setup-form").addEventListener("submit", createNewGame);
  loadGameList();
}

async function loadGameList() {
  const holder = document.querySelector("#game-list");
  try {
    const { listGames } = await import("./persistence/firestore-repository.js");
    const games = await listGames();
    holder.innerHTML = games.map((game) => `<div class="game-row"><div><strong>${escapeHtml(game.name)}</strong><br><small>Sidst ændret ${new Date(game.updatedAt).toLocaleString("da-DK")}</small></div><div class="game-actions"><button class="quiet-button delete-game" data-id="${escapeHtml(game.id)}" data-name="${escapeHtml(game.name)}">Slet</button><a class="button-link" href="?game=${encodeURIComponent(game.id)}">Fortsæt</a></div></div>`).join("") || `<p class="muted">Der er ingen gemte spil endnu.</p>`;
    holder.querySelectorAll(".delete-game").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm(`Vil du slette \"${button.dataset.name}\" permanent?`)) return;
      button.disabled = true;
      try {
        const { deleteGame } = await import("./persistence/firestore-repository.js");
        await deleteGame(button.dataset.id);
        await loadGameList();
      } catch (error) { setStatus(error.message, "error"); button.disabled = false; }
    }));
  } catch (error) {
    holder.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

async function repository() {
  const module = await import("./persistence/firestore-repository.js");
  return module.createGameRepository(state.game.id);
}

async function createNewGame(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const names = Array.from({ length: 7 }, (_, index) => String(form.get(`player-${index}`) || "").trim()).filter(Boolean);
  if (!names.length) return setStatus("Tilføj mindst én spiller.", "error");
  if (new Set(names.map((name) => name.toLocaleLowerCase("da-DK"))).size !== names.length) return setStatus("Spillernavne skal være forskellige.", "error");
  const game = { id: id(), name: String(form.get("name")).trim(), scoringVersion: "v1", createdAt: now(), updatedAt: now() };
  try {
    const { createGame } = await import("./persistence/firestore-repository.js");
    await createGame(game);
    state.game = game;
    const repo = await repository();
    for (const [sortOrder, name] of names.entries()) await repo.savePlayer({ id: id(), name, sortOrder, createdAt: now() });
    location.href = `?game=${encodeURIComponent(game.id)}`;
  } catch (error) { setStatus(error.message, "error"); }
}

function renderGame() {
  const shareUrl = `${location.origin}${location.pathname}?game=${state.game.id}`;
  app.innerHTML = `<div class="topbar"><div><h1>${escapeHtml(state.game.name)}</h1><div class="muted">${state.players.length} spiller${state.players.length === 1 ? "" : "e"}</div></div><div class="row"><button class="secondary" id="game-overview">Spiloversigt</button><button class="secondary" id="copy-link">Del link</button></div></div><div id="status"></div><section class="section"><div class="section-head"><h2>Ny runde</h2><span class="muted">Runde ${state.rounds.length + 1}</span></div><div class="participant-heading"><strong>1. Vælg rundens fire spillere</strong><span id="participant-count">0 af 4 valgt</span></div><div id="active-list" class="active-grid"></div><div id="round-entry" class="round-entry locked"><div id="round-lock" class="round-lock">Vælg fire spillere for at åbne meldingen</div><form id="round-form" class="form-grid" aria-disabled="true"></form></div></section><section class="section"><h2>Aktuel stilling</h2><ol id="standings" class="score-list"></ol><h3>Regnskabets udvikling</h3><div class="table-scroll"><table id="score-ledger"></table></div></section><section class="section"><div class="section-head"><h2>Historik</h2><span class="muted">${state.rounds.length} runder</span></div><div id="history"></div></section>`;
  document.querySelector("#game-overview").addEventListener("click", () => { location.href = location.pathname; });
  document.querySelector("#copy-link").addEventListener("click", async () => { await navigator.clipboard?.writeText(shareUrl); setStatus("Link kopieret.", "success"); });
  const activeList = document.querySelector("#active-list");
  state.players.forEach((player) => activeList.insertAdjacentHTML("beforeend", `<label class="choice"><input type="checkbox" id="active-${escapeHtml(player.id)}" value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</label>`));
  activeList.addEventListener("change", updateParticipantSelection);
  renderRoundForm(); renderStandings(); renderHistory();
}

function updateParticipantSelection() {
  const selectedCount = activePlayers().length;
  const selection = participantSelectionState(selectedCount);
  document.querySelector("#participant-count").textContent = `${selectedCount} af 4 valgt`;
  document.querySelectorAll("#active-list input").forEach((checkbox) => { checkbox.disabled = selection.disableUnchecked && !checkbox.checked; });
  document.querySelector("#round-entry").classList.toggle("locked", !selection.ready);
  document.querySelector("#round-form").setAttribute("aria-disabled", String(!selection.ready));
  renderRoundForm();
}

function renderRoundForm(round = null) {
  const form = document.querySelector("#round-form"); if (!form) return;
  const selected = round?.activePlayerIds || activePlayers().map((player) => player.id);
  if (selected.length !== 4) { form.innerHTML = ""; return; }
  const playerChoices = selected.map((playerId) => ({ value: playerId, label: playerName(playerId) }));
  const contractChoices = Array.from({ length: 8 }, (_, index) => ({ value: index + 7, label: String(index + 7) }));
  const normalTypeChoices = [{ value: "normal", label: "Normal" }, { value: "gode", label: "Gode" }, { value: "halv", label: "Halve" }, { value: "vip i 1.", label: "Vip 1" }, { value: "vip i 2.", label: "Vip 2" }, { value: "vip i 3.", label: "Vip 3" }];
  const specialTypeChoices = [{ value: "sol", label: "Sol" }, { value: "rensol", label: "Ren Sol" }, { value: "bordstik", label: "Bord + stik" }, { value: "bordnul", label: "Bord 0" }];
  const declarerId = round?.declarerId || selected[0];
  const partnerId = round?.selfPartner ? "self" : round?.partnerId || selected.find((playerId) => playerId !== declarerId);
  const partnerChoices = [...playerChoices, { value: "self", label: "Selvpalle" }];
  const selectedType = round?.type || "normal";
  form.innerHTML = `<div id="contract-field" class="field-group"><span class="field-label">Meldte stik</span>${renderChoiceButtons("contractTricks", contractChoices, round?.contractTricks ?? DEFAULT_CONTRACT_TRICKS)}</div><div class="field-group"><span class="field-label">Spiltype</span>${renderChoiceButtons("type", normalTypeChoices, selectedType)}</div><div id="normal-fields" class="form-grid"><div class="field-group"><span class="field-label">Spilfører</span>${renderChoiceButtons("declarerId", playerChoices, declarerId)}</div><div class="field-group"><span class="field-label">Makker eller Selvpalle</span>${renderChoiceButtons("partnerId", partnerChoices, partnerId)}</div><label>Tagne stik<select name="takenTricks">${Array.from({ length: 14 }, (_, i) => `<option>${i}</option>`).join("")}</select></label></div><div class="type-special-block"><span class="field-label">Sol og bordmeldinger</span>${renderChoiceButtonList(specialTypeChoices, selectedType, "choice-buttons type-special-choices")}</div><div id="special-fields" class="special-grid hidden"></div><button id="save-round">${round ? "Gem ændring" : "Gem runde"}</button>`;
  if (round?.takenTricks !== undefined) form.elements.takenTricks.value = round.takenTricks;
  bindChoiceButtons(form, "type", () => { syncSpecialTypeButtons(form); toggleRoundFields(form, round); });
  form.querySelector(".type-special-choices").addEventListener("click", (event) => {
    const button = event.target.closest(".choice-button"); if (!button) return;
    form.elements.type.value = button.dataset.value;
    form.querySelectorAll('[data-choice-group="type"] .choice-button').forEach((entry) => entry.setAttribute("aria-pressed", "false"));
    syncSpecialTypeButtons(form); toggleRoundFields(form, round);
  });
  bindChoiceButtons(form, "declarerId", () => syncPartnerControls(form, selected));
  bindChoiceButtons(form, "contractTricks");
  bindChoiceButtons(form, "partnerId");
  syncPartnerControls(form, selected); toggleRoundFields(form, round);
  form.onsubmit = (event) => saveRound(event, round);
}

function syncSpecialTypeButtons(form) {
  form.querySelectorAll(".type-special-choices .choice-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.value === form.elements.type.value));
  });
}

function toggleRoundFields(form, round) {
  const special = ["sol", "rensol", "bordstik", "bordnul"].includes(form.elements.type.value);
  form.querySelector("#contract-field").classList.toggle("hidden", special);
  form.querySelector("#normal-fields").classList.toggle("hidden", special);
  const holder = form.querySelector("#special-fields"); holder.classList.toggle("hidden", !special);
  if (special) {
    const statusChoices = [{ value: "off", label: "Ikke med" }, { value: "home", label: "Hjem" }, { value: "down", label: "Ned" }];
    holder.innerHTML = activePlayers().map((player) => { const prior = round?.solPlayers?.find((entry) => entry.playerId === player.id)?.result || "off"; return `<div class="field-group"><span class="field-label">${escapeHtml(player.name)}</span>${renderChoiceButtons(`special-${player.id}`, statusChoices, prior)}</div>`; }).join("");
    activePlayers().forEach((player) => bindChoiceButtons(form, `special-${player.id}`));
  }
}

function syncPartnerControls(form, selected) {
  const eligible = new Set(eligiblePartnerIds(selected, form.elements.declarerId.value));
  eligible.add("self");
  setChoiceAvailability(form, "partnerId", eligible);
}

async function saveRound(event, prior) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("#save-round"); button.disabled = true; setStatus("Gemmer...");
  try {
    const selected = prior?.activePlayerIds || activePlayers().map((player) => player.id);
    const type = form.elements.type.value; const round = { id: prior?.id || id(), roundNumber: prior?.roundNumber || state.rounds.length + 1, playedAt: prior?.playedAt || now(), type, activePlayerIds: selected, updatedAt: now(), createdAt: prior?.createdAt || now(), scoringVersion: state.game.scoringVersion };
    if (type === "normal" || type.startsWith("gode") || type === "halv" || type.startsWith("vip")) {
      const selfPartner = form.elements.partnerId.value === "self";
      Object.assign(round, { declarerId: form.elements.declarerId.value, partnerId: selfPartner ? null : form.elements.partnerId.value, selfPartner, contractTricks: Number(form.elements.contractTricks.value), takenTricks: Number(form.elements.takenTricks.value) });
    }
    else round.solPlayers = selected.map((playerId) => ({ playerId, result: form.elements[`special-${playerId}`].value })).filter((entry) => entry.result !== "off");
    round.scoreChanges = calculateRoundScore(round);
    const repo = await repository(); await repo.saveRound(round, prior?.updatedAt); await repo.saveGame({ updatedAt: now() });
    const loaded = await repo.load(); Object.assign(state, loaded); state.editingRound = null; renderGame(); setStatus("Runden er gemt.", "success");
  } catch (error) { setStatus(error.message, "error"); button.disabled = false; }
}

function renderStandings() {
  const { totals, rows } = buildScoreLedger(state.players, state.rounds);
  document.querySelector("#standings").innerHTML = Object.entries(totals).sort(([, a], [, b]) => b - a).map(([playerId, value]) => `<li class="score-line"><span>${escapeHtml(playerName(playerId))}</span><span class="score-value">${formatPoints(value)}</span></li>`).join("");
  document.querySelector("#score-ledger").innerHTML = `<thead><tr><th>Runde</th>${state.players.map((player) => `<th>${escapeHtml(player.name)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><th>${row.roundNumber}</th>${state.players.map((player) => `<td>${formatPoints(row.totals[player.id])}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

function roundSummary(round) {
  if (round.solPlayers) {
    return round.solPlayers.map(({ playerId, result }) => `${playerName(playerId)}: ${result === "home" ? "hjem" : "ned"}`).join(" · ");
  }
  const partner = round.selfPartner ? "selvpalle" : `makker ${playerName(round.partnerId)}`;
  return `${playerName(round.declarerId)} meldte ${round.contractTricks} ${round.type}, ${partner}, fik ${round.takenTricks} stik`;
}

function renderHistory() {
  const holder = document.querySelector("#history");
  holder.innerHTML = state.rounds.map((round) => `<article class="round"><div class="round-meta"><div><strong>Runde ${round.roundNumber}: ${escapeHtml(round.type)}</strong><br><span>${escapeHtml(roundSummary(round))}</span><br><small>${new Date(round.playedAt).toLocaleString("da-DK")}</small></div><button class="secondary edit-round" data-id="${escapeHtml(round.id)}">Rediger</button></div><div class="round-points">${Object.entries(round.scoreChanges || {}).map(([playerId, value]) => `<span>${escapeHtml(playerName(playerId))}: <strong>${formatPoints(value)}</strong></span>`).join("")}</div></article>`).join("") || `<p class="muted">Ingen runder endnu.</p>`;
  holder.querySelectorAll(".edit-round").forEach((button) => button.addEventListener("click", () => { const round = state.rounds.find((entry) => entry.id === button.dataset.id); state.editingRound = round; state.players.forEach((player) => { const checkbox = document.querySelector(`#active-${player.id}`); if (checkbox) checkbox.checked = round.activePlayerIds.includes(player.id); }); updateParticipantSelection(); renderRoundForm(round); document.querySelector("#round-form")?.scrollIntoView({ behavior: "smooth" }); }));
}

async function loadGame() {
  try {
    const repo = await repository(); Object.assign(state, await repo.load()); renderGame();
  } catch (error) { app.innerHTML = `<section class="section"><h1>Es-makker Whist</h1><p class="error">${escapeHtml(error.message)}</p><button id="new-game">Opret nyt spil</button></section>`; document.querySelector("#new-game").onclick = renderSetup; }
}

if (gameId) { state.game = { id: gameId }; loadGame(); } else renderSetup();
