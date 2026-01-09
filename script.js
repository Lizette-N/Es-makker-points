// Global til at holde styr på selvpalle (true/false)
let special = null; // her bruger vi den kun til "selvpalle"

// Checkbox-handler til selvpalle
function toggleSelvpalle() {
    const checked = document.getElementById("selvpalleCheck").checked;
    special = checked ? "selvpalle" : null;
    document.getElementById("specialDisplay").textContent =
        checked ? "Selvpalle valgt" : "";
}

// 1) Beregn samlede point for runden
function calculatePoints(melding, taken, type, special) {
    // SPECIALMELDINGER FRA DROPDOWN OVERSKRIVER ALT ANDET
    if (type === "sol") return 6;
    if (type === "rensol") return 8;
    if (type === "bordstik") return 10;
    if (type === "bordnul") return 12;

    // Her bruger vi dine to hjælpefunktioner
    const meldingPoints = meldingværdi(melding, type, taken);
    const takenPoints = vundneværdi(taken);

    let total = meldingPoints * takenPoints;

    // Hvis selvpalle skal give en ekstra modifikator, kan du ændre her
    if (special === "selvpalle") {
        // eksempel: dobbelt point - ret til dine egne regler
        // total *= 2;
    }

    return Math.ceil(total);
}

// 2) Din funktion til meldingværdien
function meldingværdi(melding, type, taken) {
    let TempPoints = 0.0;

    // type kommer direkte fra <select id="type">
    // værdierne er: "normal", "gode", "halv", "vip i 1.", "vip i 2.", "vip i 3.", "sol", ...
    // vi bruger kun dem, der er relevante for meldings-justering
    switch (type) {
        case "normal":
            // ingen ændring
            break;
        case "halv":
            melding += 1;
            break;
        case "gode":
            melding += 1;
            break;
        case "vip i 1.":
            melding += 1;
            break;
        case "vip i 2.":
            melding += 2;
            break;
        case "vip i 3.":
            melding += 3;
            break;
        // sol / ren sol / bordstik / bordnul håndteres allerede i calculatePoints
        default:
            break;
    }

    switch (melding) {
        case 7:  TempPoints = 0.0;  break;
        case 8:  TempPoints = 0.0;  break;
        case 9:  TempPoints = 0.25; break;
        case 10: TempPoints = 0.5;  break;
        case 11: TempPoints = 1.0;  break;
        case 12: TempPoints = 2.0;  break;
        case 13: TempPoints = 4.0;  break;
        case 14: TempPoints = 8.0;  break;
        case 15: TempPoints = 16.0; break;
        case 16: TempPoints = 32.0; break;
        case 17: TempPoints = 32.0; break;
    }

    if (taken < melding) {
        return TempPoints * (-2);
    } else {
        return TempPoints;
    }
}

// 3) Din funktion til vundne stik
function vundneværdi(taken) {
    switch (taken) {
        case 7:  return 1;
        case 8:  return 2;
        case 9:  return 3;
        case 10: return 4;
        case 11: return 5;
        case 12: return 6;
        case 13: return 8;
        default: return 0;
    }
}


function handleRound() {
    const meldingVal = document.getElementById("contract").value;
    const takenVal   = document.getElementById("taken").value;
    const type       = document.getElementById("type").value;

    // Simpel validering - tjek for tomme felter
    if (meldingVal === "" || takenVal === "" || type === "") {
        document.getElementById("result").textContent =
            "Vælg både meldte stik, meldingstype og stik taget.";
        return;
    }

    const melding = Number(meldingVal);
    const taken   = Number(takenVal);

    const points = calculatePoints(melding, taken, type, special);

    document.getElementById("result").textContent = "Point: " + points;
}