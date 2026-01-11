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
    if (type === "sol") {
        const base = 6;
        return {
            melder: base,
            makker: base,
            mod1: -base,
            mod2: -base
        };
    }
    if (type === "rensol") {
        const base = 8;
        return {
            melder: base,
            makker: base,
            mod1: -base,
            mod2: -base
        };
    }
    if (type === "bordstik") {
        const base = 10;
        return {
            melder: base,
            makker: base,
            mod1: -base,
            mod2: -base
        };
    }
    if (type === "bordnul") {
        const base = 12;
        return {
            melder: base,
            makker: base,
            mod1: -base,
            mod2: -base
        };
    }

    // Her bruger vi dine to hjælpefunktioner
    const meldingPoints = meldingværdi(melding, type, taken);
    const takenPoints = vundneværdi(taken);

    let total = 0;
    if (taken < melding) {
        total = meldingPoints * (melding - taken);
    } else {
        total = meldingPoints * takenPoints;
    }

    let base;
    if (total < 0) {
        base = Math.floor(total);   // -1.5 -> -2
    } else {
        base = Math.ceil(total);    // fx 1.5 -> 2
    }
    // Hvis selvpalle skal give en ekstra modifikator, kan du ændre her
    if (special === "selvpalle") {
        return {
            melder: base * 3,
            mod1: -base,
            mod2: -base,
            mod3: -base
        };
    }


    // RETURNÉR 4 VÆRDIER - EN TIL HVER SPILLER
    return {
        melder: base,
        makker: base,
        mod1: -base,
        mod2: -base
    };
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
        case 7: TempPoints = 0.0; break;
        case 8: TempPoints = 0.0; break;
        case 9: TempPoints = 0.25; break;
        case 10: TempPoints = 0.5; break;
        case 11: TempPoints = 1.0; break;
        case 12: TempPoints = 2.0; break;
        case 13: TempPoints = 4.0; break;
        case 14: TempPoints = 8.0; break;
        case 15: TempPoints = 16.0; break;
        case 16: TempPoints = 32.0; break;
        case 17: TempPoints = 32.0; break;
    }

    if (taken < melding) {
        return TempPoints * (-2.0);
    } else {
        return TempPoints;
    }
}

// 3) Din funktion til vundne stik
function vundneværdi(taken) {
    switch (taken) {
        case 7: return 1;
        case 8: return 2;
        case 9: return 3;
        case 10: return 4;
        case 11: return 5;
        case 12: return 6;
        case 13: return 8;
        default: return 0;
    }
}


function handleRound() {
    const meldingVal = document.getElementById("contract").value;
    const takenVal = document.getElementById("taken").value;
    const type = document.getElementById("type").value;
    const specialType = document.getElementById("specialType").value;

    // Læs status fra boksen
    const p1status = document.getElementById("p1status").value;
    const p2status = document.getElementById("p2status").value;
    const p3status = document.getElementById("p3status").value;
    const p4status = document.getElementById("p4status").value;

    // Hvis der er valgt en special-type i boksen, bruger vi KUN den
    if (specialType !== "none") {
        const ptsSpecial = calculateSpecialBox(
            specialType,
            p1status,
            p2status,
            p3status,
            p4status
        );

        document.getElementById("result").innerText =
            `Melder:    ${ptsSpecial.melder}
Spiller 2: ${ptsSpecial.p2}
Spiller 3: ${ptsSpecial.p3}
Spiller 4: ${ptsSpecial.p4}`;
        return;
    }

    // Ellers - normal logik (som du allerede havde)
    if (meldingVal === "" || takenVal === "" || type === "") {
        document.getElementById("result").textContent =
            "Vælg både meldte stik, meldingstype og stik taget.";
        return;
    }

    const melding = Number(meldingVal);
    const taken = Number(takenVal);

    const pts = calculatePoints(melding, taken, type, special);

    if (special === "selvpalle") {
        document.getElementById("result").innerText =
            `Melder (selvpalle): ${pts.melder}
Modstander 1:       ${pts.mod1}
Modstander 2:       ${pts.mod2}
Modstander 3:       ${pts.mod3}`;
    } else {
        document.getElementById("result").innerText =
            `Melder:        ${pts.melder}
Makker:        ${pts.makker}
Modstander 1:  ${pts.mod1}
Modstander 2:  ${pts.mod2}`;
    }
}

function calculateSpecialBox(specialType, p1status, p2status, p3status, p4status) {
    let base = 0;

    switch (specialType) {
        case "sol":
            base = 6;
            break;
        case "rensol":
            base = 8;
            break;
        case "bordstik":
            base = 10;
            break;
        case "bordnul":
            base = 12;
            break;
        default:
            // ingen special
            return { melder: 0, p2: 0, p3: 0, p4: 0 };
    }

    function pointsFor(status) {
        if (status === "win") return base;
        if (status === "lose") return -base;
        return 0; // "off"
    }

    return {
        melder: pointsFor(p1status),
        p2: pointsFor(p2status),
        p3: pointsFor(p3status),
        p4: pointsFor(p4status)
    };
}