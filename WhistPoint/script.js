// Beregn point for en runde Wist / ES makker.
// Tilpas logikken herinde til jeres egne regler.
function calculatePoints(contractTricks, takenTricks, multiplier) {
    // Midlertidig, meget simpel logik:
    // forskel = tagne stik - meldte stik
    // point = forskel * multiplikator
    const diff = takenTricks - contractTricks;
    const points = diff * multiplier;

    return points;
}

// Funktion der bliver kaldt, når man trykker på knappen
function handleRound() {
    // Læs værdier fra inputfelterne
    const contract = Number(document.getElementById("contract").value);
    const taken = Number(document.getElementById("taken").value);
    const multiplier = Number(document.getElementById("multiplier").value);

    // Simpel validering
    if (Number.isNaN(contract) || Number.isNaN(taken) || Number.isNaN(multiplier)) {
        document.getElementById("result").textContent = "Udfyld alle felter med tal.";
        return;
    }

    const points = calculatePoints(contract, taken, multiplier);

    // Her bestemmer du selv hvordan teksten skal være
    let text = "Point: " + points;
    document.getElementById("result").textContent = text;
}