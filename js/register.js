const form = document.querySelector("#register-form");
const success = document.querySelector("#register-success");
const fields = {
  username: document.querySelector("#username"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  confirm: document.querySelector("#confirm"),
  terms: document.querySelector("#terms")
};

const rules = [
  {
    input: fields.username,
    errorId: "username-error",
    check: (value) => value.trim().length >= 3,
    message: "Ім'я має містити мінімум 3 символи."
  },
  {
    input: fields.email,
    errorId: "email-error",
    check: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message: "Вкажіть email у коректному форматі."
  },
  {
    input: fields.password,
    errorId: "password-error",
    check: (value) => value.length >= 8,
    message: "Пароль має містити мінімум 8 символів."
  },
  {
    input: fields.confirm,
    errorId: "confirm-error",
    check: (value) => value.length > 0 && value === fields.password.value,
    message: "Паролі мають збігатися."
  },
  {
    input: fields.terms,
    errorId: "terms-error",
    check: () => fields.terms.checked,
    message: "Щоб надіслати форму, погодьтеся з умовами."
  }
];

let submitted = false;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  success.hidden = true;

  const invalid = rules.filter((rule) => !applyRule(rule));
  if (invalid.length > 0) {
    invalid[0].input.focus();
    return;
  }

  form.reset();
  rules.forEach((rule) => clearFieldError(rule.input));
  success.hidden = false;
});

rules.forEach((rule) => {
  const eventName = rule.input.type === "checkbox" ? "change" : "input";
  rule.input.addEventListener(eventName, () => {
    if (!submitted) return;
    applyRule(rule);
    if (rule.input === fields.password) applyRule(rules[3]);
  });
});

function applyRule(rule) {
  const valid = rule.check(rule.input.value);
  if (valid) clearFieldError(rule.input);
  else setFieldError(rule.input, rule.errorId, rule.message);
  return valid;
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
