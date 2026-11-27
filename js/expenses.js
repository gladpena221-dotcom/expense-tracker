const STORAGE_KEY = "expense-tracker-v1";
const CATEGORIES = ["Їжа", "Транспорт", "Покупки", "Інше"];

const form = document.querySelector("#expense-form");
const titleInput = document.querySelector("#expense-title");
const amountInput = document.querySelector("#expense-amount");
const categoryInput = document.querySelector("#expense-category");
const list = document.querySelector("#expense-list");
const emptyState = document.querySelector("#empty-state");
const grandTotal = document.querySelector("#grand-total");
const expenseCount = document.querySelector("#expense-count");
const visibleSummary = document.querySelector("#visible-summary");
const searchInput = document.querySelector("#expense-search");
const clearButton = document.querySelector("#clear-all");
const clearDialog = document.querySelector("#clear-dialog");
const categorySums = document.querySelector("#category-sums");

let expenses = loadExpenses();
let activeFilter = "all";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateExpenseForm()) return;

  expenses.unshift({
    id: createId(),
    title: titleInput.value.trim(),
    amount: parseAmount(amountInput.value),
    category: categoryInput.value,
    createdAt: new Date().toISOString()
  });

  saveExpenses();
  form.reset();
  categoryInput.value = "Їжа";
  clearFieldError(titleInput);
  clearFieldError(amountInput);
  render();
  titleInput.focus();
});

searchInput.addEventListener("input", render);

document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((chip) => {
    const selected = chip === button;
    chip.classList.toggle("is-active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  render();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  expenses = expenses.filter((item) => item.id !== button.dataset.delete);
  saveExpenses();
  render();
});

clearButton.addEventListener("click", () => {
  if (expenses.length === 0) return;
  clearDialog.showModal();
});

document.querySelector("#clear-cancel").addEventListener("click", () => {
  clearDialog.close();
});

document.querySelector("#clear-confirm").addEventListener("click", () => {
  expenses = [];
  saveExpenses();
  clearDialog.close();
  render();
});

titleInput.addEventListener("input", () => clearFieldError(titleInput));
amountInput.addEventListener("input", () => clearFieldError(amountInput));

render();

function loadExpenses() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExpense);
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function isExpense(item) {
  return item
    && typeof item.id === "string"
    && typeof item.title === "string"
    && typeof item.amount === "number"
    && item.amount > 0
    && CATEGORIES.includes(item.category);
}

function validateExpenseForm() {
  let valid = true;
  const title = titleInput.value.trim();
  const amount = parseAmount(amountInput.value);

  if (!title) {
    setFieldError(titleInput, "title-error", "Вкажіть назву витрати.");
    valid = false;
  } else {
    clearFieldError(titleInput);
  }

  if (amount === null || amount <= 0) {
    setFieldError(amountInput, "amount-error", "Сума має бути більшою за нуль.");
    valid = false;
  } else {
    clearFieldError(amountInput);
  }

  return valid;
}

function parseAmount(value) {
  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const amount = Math.round(Number(normalized) * 100) / 100;
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

function visibleExpenses() {
  const query = searchInput.value.trim().toLowerCase();
  return expenses.filter((item) => {
    const matchesCategory = activeFilter === "all" || item.category === activeFilter;
    const matchesQuery = !query || item.title.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function render() {
  const visible = visibleExpenses();
  const total = sum(expenses);

  grandTotal.textContent = formatMoney(total);
  expenseCount.textContent = expenses.length === 0
    ? "Поки що записів немає."
    : `Записів: ${expenses.length}.`;

  CATEGORIES.forEach((category) => {
    const card = categorySums.querySelector(`[data-category="${category}"] dd`);
    const categoryTotal = sum(expenses.filter((item) => item.category === category));
    card.textContent = formatMoney(categoryTotal);
  });

  const visibleTotal = sum(visible);
  visibleSummary.textContent = `Показано ${visible.length} з ${expenses.length}. Сума на екрані: ${formatMoney(visibleTotal)}.`;
  clearButton.disabled = expenses.length === 0;

  list.replaceChildren();
  visible.forEach((item) => list.append(createCard(item)));
  emptyState.hidden = visible.length !== 0;
  emptyState.textContent = expenses.length === 0
    ? "Додайте першу витрату — вона залишиться після перезавантаження."
    : "Немає витрат за цим пошуком або фільтром.";
}

function createCard(item) {
  const card = document.createElement("li");
  card.className = "expense-card";

  const main = document.createElement("div");
  const title = document.createElement("p");
  title.className = "expense-title";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "expense-meta";
  const tag = document.createElement("span");
  tag.className = `tag tag-${item.category}`;
  tag.textContent = item.category;
  meta.append(tag, document.createTextNode(formatDate(item.createdAt)));

  main.append(title, meta);

  const side = document.createElement("div");
  side.className = "expense-side";
  const amount = document.createElement("span");
  amount.className = "expense-amount";
  amount.textContent = formatMoney(item.amount);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn-delete";
  remove.dataset.delete = item.id;
  remove.textContent = "Видалити";
  remove.setAttribute("aria-label", `Видалити витрату ${item.title}`);

  side.append(amount, remove);
  card.append(main, side);
  return card;
}

function sum(items) {
  return Math.round(items.reduce((total, item) => total + item.amount, 0) * 100) / 100;
}

function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH"
  }).format(value);
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function setFieldError(input, errorId, message) {
  const error = document.querySelector(`#${errorId}`);
  error.hidden = false;
  error.textContent = message;
  input.closest(".field").classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", errorId);
}

function clearFieldError(input) {
  const field = input.closest(".field");
  const error = field.querySelector(".field-error");
  error.hidden = true;
  error.textContent = "";
  field.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
}

function createId() {
  if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
