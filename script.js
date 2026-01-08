let special = null;

// kaldt når man trykker en specialmelding
function setSpecial(type) {
    special = type;

    let text = "";
    if (type === "sol") text = "Sol valgt";
    if (type === "rensol") text = "Ren sol valgt";
    if (type === "bordstik") text = "På bordet (med stik) valgt";
    if (type === "bordnul") text = "På bordet (ingen stik) valgt";

    document.getElementById("specialDisplay").textContent = text;
}
function isSoloRound() {
    return (
        special === "selvpalle" ||
        special === "sol" ||
        special === "rensol" ||
        special === "bordstik" ||
        special === "bordnul"
    );
}

// Beregn point for en runde Wist / ES makker
function calculatePoints(contract, taken, type, special) {

    // SPECIALMELDINGER OVERSKRIVER ALT ANDET
    if (special === "sol") return 52;
    if (special === "rensol") return 104;
    if (special === "bordstik") return 13;
    if (special === "bordnul") return -13;

    // STANDARD BEREGNING
    let diff = taken - contract;
    let points = diff;

    // Meldingstype påvirker point
    if (type === "gode") points *= 2;
    if (type === "halv") points /= 2;
    if (type === "vip") points *= 3;

    return points;
}

// Funktion der bliver kaldt, når man trykker på knappen
function handleRound() {
    const contract = Number(document.getElementById("contract").value);
    const taken = Number(document.getElementById("taken").value);
    const type = document.getElementById("type").value;

    // Basal fejl-check
    if (!contract || !taken) {
        document.getElementById("result").textContent = "Vælg både meldte og vundne stik!";
        return;
    }

    const points = calculatePoints(contract, taken, type, special);

    document.getElementById("result").textContent = "Point: " + points;
}