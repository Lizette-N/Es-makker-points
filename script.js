function toggleSelvpalle() {
    const selvpalleCheck = document.getElementById("selvpalleCheck");
    const specialDisplay = document.getElementById("specialDisplay");

    if (!specialDisplay) {
        return;
    }

    specialDisplay.textContent = selvpalleCheck?.checked
        ? "Selvpalle er valgt."
        : "";
}

function validateRoundInput(contract, taken) {
    if (!Number.isInteger(contract) || contract < 7 || contract > 14) {
        return "Meldte stik skal vaere et tal mellem 7 og 14.";
    }

    if (!Number.isInteger(taken) || taken < 0 || taken > 14) {
        return "Tagne stik skal vaere et tal mellem 0 og 14.";
    }

    return null;
}

const matrix = [
    [7, 0.0, 1],
    [8, 0.0, 2],
    [9, 0.25, 3],
    [10, 0.50, 4],
    [11, 1.00, 5],
    [12, 2.00, 6],
    [13, 4.00, 7],
    [14, 8.00, 8],
    [15, 16.00, 9],
    [16, 32.00, 10]
];

function normalizeTricks(value) {
    return value === 13 ? 14 : value;
}

function findRowIndexByTricks(tricks) {
    return matrix.findIndex(row => row[0] === tricks);
}

function calculateScore({ contract, type, taken }) {
    if (contract > taken) {
        return calculateLoss(contract, type, taken);
    }

    return calculateWin(contract, type, taken);
}

function calculateLoss(contract, type, taken) {
    const normalizedContract = normalizeTricks(contract);
    const normalizedTaken = normalizeTricks(taken);
    const missingTricks = normalizedContract - normalizedTaken;

    if (missingTricks <= 0) {
        return 0;
    }

    let rowIndex = findRowIndexByTricks(normalizedContract);

    if (rowIndex === -1) {
        return 0;
    }

    if (type !== "normal") {
        rowIndex += 1;
    }

    rowIndex += 1;

    if (rowIndex >= matrix.length) {
        rowIndex = matrix.length - 1;
    }

    const ratePerTrick = matrix[rowIndex][1];

    return -Math.ceil(ratePerTrick * missingTricks);
}

function calculateWin(contract, type, taken) {
    const normalizedContract = normalizeTricks(contract);
    const normalizedTaken = normalizeTricks(taken);

    let rowIndex = findRowIndexByTricks(normalizedContract);

    if (rowIndex === -1) {
        return 0;
    }

    if (type !== "normal") {
        rowIndex += 1;
    }

    if (rowIndex >= matrix.length) {
        rowIndex = matrix.length - 1;
    }

    const rate = matrix[rowIndex][1];
    const takenRowIndex = findRowIndexByTricks(normalizedTaken);

    if (takenRowIndex === -1) {
        return 0;
    }

    const takenMultiplier = matrix[takenRowIndex][2];

    return Math.ceil(rate * takenMultiplier);
}

function handleRound() {
    const contract = Number.parseInt(document.getElementById("contract").value, 10);
    const type = document.getElementById("type").value;
    const taken = Number.parseInt(document.getElementById("taken").value, 10);
    const result = document.getElementById("result");

    if (!result) {
        return;
    }

    const validationError = validateRoundInput(contract, taken);

    if (validationError) {
        result.textContent = validationError;
        return;
    }

    const calculation = calculateScore({ contract, type, taken });

    result.textContent =
        `Melding: ${contract}, type: ${type}, tagne stik: ${taken}. Point: ${calculation}`;
}

function runTests() {
    const tests = [
        { input: [9, "gode", 7], expected: -2, fn: calculateLoss },
        { input: [9, "normal", 7], expected: -1, fn: calculateLoss },
        { input: [8, "gode", 7], expected: -1, fn: calculateLoss },
        { input: [9, "gode", 9], expected: 2, fn: calculateWin },
        { input: [9, "gode", 14], expected: 4, fn: calculateWin },
        { input: [13, "normal", 13], expected: 64, fn: calculateWin },
        { input: [7, "gode", 6], expected: -1, fn: calculateLoss },
        { input: [12, "halve", 13], expected: 32, fn: calculateWin }

    ];

    tests.forEach((test, index) => {
        const actual = test.fn(...test.input);
        console.log(`Test ${index + 1}:`, actual === test.expected ? "OK" : "FEJL");
    });
}
