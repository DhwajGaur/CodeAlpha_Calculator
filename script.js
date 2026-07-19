const expressionEl = document.getElementById('expression');
const resultEl      = document.getElementById('result');
const keys          = document.querySelectorAll('.key');

let previousValue   = null;   // number stored before an operator was pressed
let operator        = null;   // pending operator: + − × ÷
let currentValue    = '0';    // what's currently on screen
let shouldResetScreen = false; // true right after pressing an operator or equals

/* ---------- Display helpers ---------- */
function updateScreen(){
  resultEl.classList.remove('error');
  resultEl.textContent = formatForDisplay(currentValue);
  expressionEl.textContent =
    previousValue !== null && operator
      ? `${formatForDisplay(previousValue)} ${operator}`
      : '\u00A0';
}

function formatForDisplay(value){
  const num = typeof value === 'string' ? value : String(value);
  if (num === 'Error') return num;

  // split integer/decimal so we can comma-format the integer part only
  const [intPart, decPart] = num.split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = negative ? '-' : '';
  return decPart !== undefined ? `${sign}${withCommas}.${decPart}` : `${sign}${withCommas}`;
}

function showError(){
  resultEl.classList.add('error');
  resultEl.textContent = 'Error';
  expressionEl.textContent = '\u00A0';
  previousValue = null;
  operator = null;
  currentValue = '0';
  shouldResetScreen = true;
}

/* ---------- Input handlers ---------- */
function inputNumber(digit){
  if (shouldResetScreen){
    currentValue = digit;
    shouldResetScreen = false;
  } else {
    currentValue = currentValue === '0' ? digit : currentValue + digit;
  }
  updateScreen();
}

function inputDecimal(){
  if (shouldResetScreen){
    currentValue = '0.';
    shouldResetScreen = false;
    updateScreen();
    return;
  }
  if (!currentValue.includes('.')) currentValue += '.';
  updateScreen();
}

function chooseOperator(op){
  if (operator && !shouldResetScreen){
    // chain: compute the pending operation first
    calculate();
  }
  previousValue = parseFloat(currentValue);
  operator = op;
  shouldResetScreen = true;
  updateScreen();
}

function calculate(){
  if (operator === null || shouldResetScreen && previousValue === null) return;

  const prev = previousValue;
  const curr = parseFloat(currentValue);
  if (Number.isNaN(prev) || Number.isNaN(curr)) return;

  let result;
  switch (operator){
    case '+': result = prev + curr; break;
    case '−': result = prev - curr; break;
    case '×': result = prev * curr; break;
    case '÷':
      if (curr === 0){ showError(); return; }
      result = prev / curr;
      break;
    default: return;
  }

  // trim floating point noise, cap decimal length
  result = Math.round((result + Number.EPSILON) * 1e10) / 1e10;

  currentValue = String(result);
  previousValue = null;
  operator = null;
  shouldResetScreen = true;
  updateScreen();
}

function clearAll(){
  previousValue = null;
  operator = null;
  currentValue = '0';
  shouldResetScreen = false;
  updateScreen();
}

function backspace(){
  if (shouldResetScreen) return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  updateScreen();
}

function percent(){
  const curr = parseFloat(currentValue);
  if (Number.isNaN(curr)) return;
  currentValue = String(curr / 100);
  updateScreen();
}

/* ---------- Button clicks ---------- */
keys.forEach(key => {
  key.addEventListener('click', () => {
    const action = key.dataset.action;

    if (action === 'number') inputNumber(key.dataset.num);
    if (action === 'decimal') inputDecimal();
    if (action === 'operator') chooseOperator(key.dataset.op);
    if (action === 'equals') calculate();
    if (action === 'clear') clearAll();
    if (action === 'backspace') backspace();
    if (action === 'percent') percent();

    flashKey(key);
  });
});

function flashKey(key){
  key.classList.add('pressed');
  setTimeout(() => key.classList.remove('pressed'), 120);
}

/* ---------- Keyboard support ---------- */
const keyMap = {
  '+': '+', '-': '−', '*': '×', '/': '÷'
};

document.addEventListener('keydown', e => {
  const { key } = e;

  if (/^[0-9]$/.test(key)){
    inputNumber(key);
    highlightKey(`[data-action="number"][data-num="${key}"]`);
    return;
  }

  if (key === '.'){
    inputDecimal();
    highlightKey('[data-action="decimal"]');
    return;
  }

  if (key in keyMap){
    chooseOperator(keyMap[key]);
    highlightKey(`[data-action="operator"][data-op="${keyMap[key]}"]`);
    return;
  }

  if (key === 'Enter' || key === '='){
    e.preventDefault();
    calculate();
    highlightKey('[data-action="equals"]');
    return;
  }

  if (key === 'Backspace'){
    backspace();
    highlightKey('[data-action="backspace"]');
    return;
  }

  if (key === 'Escape'){
    clearAll();
    highlightKey('[data-action="clear"]');
    return;
  }

  if (key === '%'){
    percent();
    highlightKey('[data-action="percent"]');
  }
});

function highlightKey(selector){
  const el = document.querySelector(selector);
  if (el) flashKey(el);
}

/* ---------- Init ---------- */
updateScreen();