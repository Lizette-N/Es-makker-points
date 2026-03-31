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

function calculateScore({ contract, type, taken }) {
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

function calculateLoss(contract, type, taken) {
    const missingTricks = contract - taken;

    if (missingTricks <= 0) {
        return 0;
    }

    let rowIndex = matrix.findIndex(row => row[0] === contract);

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

    return ratePerTrick * missingTricks;
}

        if (contract < taken){ //lost


        }
    return {
        score: 0,
        explanation: `Udregning ikke indsat endnu. Modtaget: ${contract}, ${type}, ${taken} stik.`,
    };
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
        `Melding: ${contract}, type: ${type}, tagne stik: ${taken}. ` +
        `Point: ${calculation.score}. ${calculation.explanation}`;
}
function runTests() {
    const tests = [
        { input: [9, "gode", 7], expected: 2 },
        { input: [9, "normal", 7], expected: 1 },
        { input: [10, "normal", 10], expected: 0 },
        { input: [14, "gode", 13], expected: 32 }
    ];

    tests.forEach((test, index) => {
        const actual = calculateLoss(...test.input);
        const passed = actual === test.expected;

        console.log(
            `Test ${index + 1}: ${passed ? "OK" : "FEJL"}`,
            "input:", test.input,
            "forventet:", test.expected,
            "fik:", actual
        );
    });
}
