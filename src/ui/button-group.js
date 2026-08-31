export const DEFAULT_CONTRACT_TRICKS = 9;

function escapeAttribute(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

export function renderChoiceButtons(name, choices, selectedValue) {
  const selected = String(selectedValue);
  return `<div class="button-group" data-choice-group="${escapeAttribute(name)}"><input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(selected)}"><div class="choice-buttons">${choices.map(({ value, label }) => {
    const active = String(value) === selected;
    return `<button type="button" class="choice-button" data-value="${escapeAttribute(value)}" aria-pressed="${active}">${escapeAttribute(label)}</button>`;
  }).join("")}</div></div>`;
}

export function setChoiceValue(root, name, value) {
  const group = root.querySelector(`[data-choice-group="${CSS.escape(name)}"]`);
  if (!group) return;
  const selected = String(value);
  group.querySelector(`input[name="${CSS.escape(name)}"]`).value = selected;
  group.querySelectorAll(".choice-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.value === selected));
  });
}

export function bindChoiceButtons(root, name, onChange) {
  const group = root.querySelector(`[data-choice-group="${CSS.escape(name)}"]`);
  if (!group) return;
  group.addEventListener("click", (event) => {
    const button = event.target.closest(".choice-button");
    if (!button || button.disabled) return;
    setChoiceValue(root, name, button.dataset.value);
    onChange?.(button.dataset.value);
  });
}

export function setChoiceAvailability(root, name, allowedValues, disabled = false) {
  const group = root.querySelector(`[data-choice-group="${CSS.escape(name)}"]`);
  if (!group) return;
  const allowed = new Set([...allowedValues].map(String));
  const input = group.querySelector(`input[name="${CSS.escape(name)}"]`);
  group.querySelectorAll(".choice-button").forEach((button) => {
    button.disabled = disabled || !allowed.has(button.dataset.value);
  });
  if (!disabled && !allowed.has(input.value)) {
    setChoiceValue(root, name, allowed.values().next().value);
  }
}
