import { calculateRoundScore } from "./scoring/score-engine.js";
import { buildScoreLedger } from "./domain/standings.js";
import { eligiblePartnerIds } from "./ui/round-form.js";

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
    holder.innerHTML = games.map((game) => `<div class="game-row"><div><strong>${escapeHtml(game.name)}</strong><br><small>Sidst ændret ${new Date(game.updatedAt).toLocaleString("da-DK")}</small></div><a class="button-link" href="?game=${encodeURIComponent(game.id)}">Fortsæt</a></div>`).join("") || `<p class="muted">Der er ingen gemte spil endnu.</p>`;
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
  app.innerHTML = `<div class="topbar"><div><h1>${escapeHtml(state.game.name)}</h1><div class="muted">${state.players.length} spiller${state.players.length === 1 ? "" : "e"}</div></div><div class="row"><button class="secondary" id="game-overview">Spiloversigt</button><button class="secondary" id="copy-link">Del link</button></div></div><div id="status"></div><section class="section"><div class="section-head"><h2>Ny runde</h2><span class="muted">Runde ${state.rounds.length + 1}</span></div><p class="help">Vælg præcis fire aktive spillere.</p><div id="active-list" class="active-grid"></div><form id="round-form" class="form-grid"></form></section><section class="section"><h2>Aktuel stilling</h2><ol id="standings" class="score-list"></ol><h3>Regnskabets udvikling</h3><div class="table-scroll"><table id="score-ledger"></table></div></section><section class="section"><div class="section-head"><h2>Historik</h2><span class="muted">${state.rounds.length} runder</span></div><div id="history"></div></section>`;
  document.querySelector("#game-overview").addEventListener("click", () => { location.href = location.pathname; });
  document.querySelector("#copy-link").addEventListener("click", async () => { await navigator.clipboard?.writeText(shareUrl); setStatus("Link kopieret.", "success"); });
  const activeList = document.querySelector("#active-list");
  state.players.forEach((player) => activeList.insertAdjacentHTML("beforeend", `<label class="choice"><input type="checkbox" id="active-${escapeHtml(player.id)}" value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</label>`));
  state.players.slice(0, 4).forEach((player) => { const checkbox = document.querySelector(`#active-${player.id}`); if (checkbox) checkbox.checked = true; });
  activeList.addEventListener("change", renderRoundForm);
  renderRoundForm(); renderStandings(); renderHistory();
}

function renderRoundForm(round = null) {
  const form = document.querySelector("#round-form"); if (!form) return;
  const selected = round?.activePlayerIds || activePlayers().map((player) => player.id);
  if (selected.length !== 4) { form.innerHTML = `<p class="help">Vælg fire aktive spillere for at fortsætte.</p>`; return; }
  const options = selected.map((playerId) => `<option value="${escapeHtml(playerId)}">${escapeHtml(playerName(playerId))}</option>`).join("");
  form.innerHTML = `<label id="contract-field">Meldte stik<select name="contractTricks">${Array.from({ length: 8 }, (_, i) => `<option>${i + 7}</option>`).join("")}</select></label><label>Spiltype<select name="type"><option value="normal">Normal</option><option value="gode">Gode</option><option value="halv">Halve</option><option value="vip i 1.">Vip i 1.</option><option value="vip i 2.">Vip i 2.</option><option value="vip i 3.">Vip i 3.</option><option value="sol">Sol</option><option value="rensol">Ren Sol</option><option value="bordstik">På bordet med ét stik</option><option value="bordnul">På bordet uden stik</option></select></label><div id="normal-fields" class="form-grid two"><label>Spilfører<select name="declarerId">${options}</select></label><label>Makker<select name="partnerId">${options}</select></label><label>Tagne stik<select name="takenTricks">${Array.from({ length: 15 }, (_, i) => `<option>${i}</option>`).join("")}</select></label><label class="choice"><input type="checkbox" name="selfPartner">Selvmakker</label></div><div id="special-fields" class="special-grid hidden"></div><button id="save-round">${round ? "Gem ændring" : "Gem runde"}</button>`;
  const type = form.elements.type;
  type.value = round?.type || "normal";
  if (round) { for (const field of ["declarerId", "partnerId", "contractTricks", "takenTricks"]) if (round[field] !== undefined) form.elements[field].value = round[field]; form.elements.selfPartner.checked = Boolean(round.selfPartner); }
  type.addEventListener("change", () => toggleRoundFields(form));
  form.elements.declarerId.addEventListener("change", () => syncPartnerControls(form, selected));
  form.elements.selfPartner.addEventListener("change", () => syncPartnerControls(form, selected));
  syncPartnerControls(form, selected); toggleRoundFields(form, round);
  form.onsubmit = (event) => saveRound(event, round);
}

function toggleRoundFields(form, round) {
  const special = ["sol", "rensol", "bordstik", "bordnul"].includes(form.elements.type.value);
  form.querySelector("#contract-field").classList.toggle("hidden", special);
  form.querySelector("#normal-fields").classList.toggle("hidden", special);
  const holder = form.querySelector("#special-fields"); holder.classList.toggle("hidden", !special);
  if (special) holder.innerHTML = activePlayers().map((player) => { const prior = round?.solPlayers?.find((entry) => entry.playerId === player.id)?.result || "off"; return `<label>${escapeHtml(player.name)}<select name="special-${escapeHtml(player.id)}"><option value="off" ${prior === "off" ? "selected" : ""}>Ikke med</option><option value="home" ${prior === "home" ? "selected" : ""}>Hjem</option><option value="down" ${prior === "down" ? "selected" : ""}>Ned</option></select></label>`; }).join("");
}

function syncPartnerControls(form, selected) {
  const partner = form.elements.partnerId;
  const selfPartner = form.elements.selfPartner.checked;
  const eligible = new Set(eligiblePartnerIds(selected, form.elements.declarerId.value, selfPartner));
  partner.disabled = selfPartner;

  for (const option of partner.options) {
    option.disabled = !eligible.has(option.value);
    option.hidden = !eligible.has(option.value);
  }

  if (!selfPartner && !eligible.has(partner.value)) {
    partner.value = eligible.values().next().value;
  }
}

async function saveRound(event, prior) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true; setStatus("Gemmer...");
  try {
    const selected = prior?.activePlayerIds || activePlayers().map((player) => player.id);
    const type = form.elements.type.value; const round = { id: prior?.id || id(), roundNumber: prior?.roundNumber || state.rounds.length + 1, playedAt: prior?.playedAt || now(), type, activePlayerIds: selected, updatedAt: now(), createdAt: prior?.createdAt || now(), scoringVersion: state.game.scoringVersion };
    if (type === "normal" || type.startsWith("gode") || type === "halv" || type.startsWith("vip")) Object.assign(round, { declarerId: form.elements.declarerId.value, partnerId: form.elements.selfPartner.checked ? null : form.elements.partnerId.value, selfPartner: form.elements.selfPartner.checked, contractTricks: Number(form.elements.contractTricks.value), takenTricks: Number(form.elements.takenTricks.value) });
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
  const partner = round.selfPartner ? "selvmakker" : `makker ${playerName(round.partnerId)}`;
  return `${playerName(round.declarerId)} meldte ${round.contractTricks} ${round.type}, ${partner}, fik ${round.takenTricks} stik`;
}

function renderHistory() {
  const holder = document.querySelector("#history");
  holder.innerHTML = state.rounds.map((round) => `<article class="round"><div class="round-meta"><div><strong>Runde ${round.roundNumber}: ${escapeHtml(round.type)}</strong><br><span>${escapeHtml(roundSummary(round))}</span><br><small>${new Date(round.playedAt).toLocaleString("da-DK")}</small></div><button class="secondary edit-round" data-id="${escapeHtml(round.id)}">Rediger</button></div><div class="round-points">${Object.entries(round.scoreChanges || {}).map(([playerId, value]) => `<span>${escapeHtml(playerName(playerId))}: <strong>${formatPoints(value)}</strong></span>`).join("")}</div></article>`).join("") || `<p class="muted">Ingen runder endnu.</p>`;
  holder.querySelectorAll(".edit-round").forEach((button) => button.addEventListener("click", () => { const round = state.rounds.find((entry) => entry.id === button.dataset.id); state.editingRound = round; state.players.forEach((player) => { const checkbox = document.querySelector(`#active-${player.id}`); if (checkbox) checkbox.checked = round.activePlayerIds.includes(player.id); }); renderRoundForm(round); document.querySelector("#round-form")?.scrollIntoView({ behavior: "smooth" }); }));
}

async function loadGame() {
  try {
    const repo = await repository(); Object.assign(state, await repo.load()); renderGame();
  } catch (error) { app.innerHTML = `<section class="section"><h1>Es-makker Whist</h1><p class="error">${escapeHtml(error.message)}</p><button id="new-game">Opret nyt spil</button></section>`; document.querySelector("#new-game").onclick = renderSetup; }
}

if (gameId) { state.game = { id: gameId }; loadGame(); } else renderSetup();
