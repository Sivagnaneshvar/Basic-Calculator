/**
 * Basic Calculator - Interactive Application & Safe Expression Engine
 * Features:
 * - Safe recursive-descent math parser without eval()
 * - Standard operator precedence (×, ÷ before +, −)
 * - Percentage calculation (e.g. 10% = 0.1)
 * - Decimal validation preventing duplicates
 * - Repeated calculation on consecutive equals
 * - Formatted numeric output with commas & zero-trimming
 * - Division-by-zero & error handling
 * - Full keyboard & tactile interaction support
 * - Dark & Light theme toggling with localStorage persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const expressionDisplay = document.getElementById('expression-display');
  const resultDisplay = document.getElementById('result-display');
  const keypad = document.querySelector('.keypad-grid');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // --- Calculator State ---
  let expression = '';        // Full expression string, e.g. "2 + 3 × 4"
  let currentOperand = '0';   // Current number being typed, e.g. "12.5"
  let hasEvaluated = false;   // Set to true immediately after '=' evaluation
  let isError = false;        // Set to true on math error (e.g. division by zero)
  let lastResult = 0;         // Stores the last successful evaluation result

  // State for repeated calculation (e.g., 25 + 15 = 40, = 55, = 70)
  let repeatOperator = null;  // e.g. '+'
  let repeatOperand = null;   // e.g. 15

  // --- Display Scaling Helper ---
  function updateDisplay(exprText, resText) {
    if (exprText !== undefined) {
      expressionDisplay.textContent = exprText;
      expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
    }
    if (resText !== undefined) {
      resultDisplay.textContent = resText;
      // Dynamically scale font size if result/error text is long
      const textLen = resText.length;
      if (textLen > 14) {
        resultDisplay.style.fontSize = '1.6rem';
      } else if (textLen > 10) {
        resultDisplay.style.fontSize = '2.1rem';
      } else {
        resultDisplay.style.fontSize = '';
      }
    }
  }

  // --- Number Formatter ---
  // Formats numbers with thousand separators and trims floating point precision artifacts
  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'Error';
    if (!Number.isFinite(num)) return 'Cannot divide by zero';

    // Round away binary floating-point precision quirks (e.g., 0.1 + 0.2 -> 0.3)
    const cleaned = parseFloat(num.toPrecision(12));

    // For extremely large or small numbers, return exponential notation
    if (Math.abs(cleaned) >= 1e14 || (Math.abs(cleaned) > 0 && Math.abs(cleaned) < 1e-7)) {
      return cleaned.toExponential(6).replace(/\+/, '');
    }

    const str = cleaned.toString();
    const parts = str.split('.');
    const intPart = parts[0];
    const decPart = parts.length > 1 ? parts[1] : null;

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== null ? `${formattedInt}.${decPart}` : formattedInt;
  }

  // Clean floating point result to eliminate precision errors
  function cleanFloat(val) {
    return parseFloat(val.toPrecision(12));
  }

  // --- Safe Mathematical Parser (No eval() used) ---
  // Grammar:
  // Expression := Term (('+' | '−') Term)*
  // Term       := Factor (('×' | '÷') Factor)*
  // Factor     := ('+' | '−')? Primary ('%')*
  // Primary    := NUMBER

  function tokenize(str) {
    const tokens = [];
    let i = 0;
    const s = str.trim();

    while (i < s.length) {
      const ch = s[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        let hasDot = false;
        while (i < s.length && (/[0-9]/.test(s[i]) || (s[i] === '.' && !hasDot))) {
          if (s[i] === '.') hasDot = true;
          numStr += s[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      if (ch === '+' || ch === '−' || ch === '-' || ch === '×' || ch === '*' || ch === '÷' || ch === '/') {
        let op = ch;
        if (ch === '-' || ch === '−') op = '−';
        else if (ch === '*' || ch === '×') op = '×';
        else if (ch === '/' || ch === '÷') op = '÷';
        tokens.push({ type: 'OP', value: op });
        i++;
        continue;
      }

      if (ch === '%') {
        tokens.push({ type: 'PERCENT', value: '%' });
        i++;
        continue;
      }

      throw new Error('Invalid Expression');
    }

    return tokens;
  }

  function parseExpression(tokens) {
    let index = 0;

    function peek() {
      return tokens[index];
    }

    function consume() {
      return tokens[index++];
    }

    function parseExpr() {
      let left = parseTerm();

      while (index < tokens.length && peek().type === 'OP' && (peek().value === '+' || peek().value === '−')) {
        const op = consume().value;
        const right = parseTerm();
        if (op === '+') {
          left = cleanFloat(left + right);
        } else {
          left = cleanFloat(left - right);
        }
      }

      return left;
    }

    function parseTerm() {
      let left = parseFactor();

      while (index < tokens.length && peek().type === 'OP' && (peek().value === '×' || peek().value === '÷')) {
        const op = consume().value;
        const right = parseFactor();
        if (op === '×') {
          left = cleanFloat(left * right);
        } else {
          if (right === 0 || Math.abs(right) < 1e-15) {
            throw new Error('Cannot divide by zero');
          }
          left = cleanFloat(left / right);
        }
      }

      return left;
    }

    function parseFactor() {
      let sign = 1;
      if (index < tokens.length && peek().type === 'OP' && (peek().value === '+' || peek().value === '−')) {
        const op = consume().value;
        if (op === '−') sign = -1;
      }

      let val = parsePrimary();
      val = cleanFloat(sign * val);

      // Postfix percentage: divides preceding number by 100
      while (index < tokens.length && peek().type === 'PERCENT') {
        consume();
        val = cleanFloat(val / 100);
      }

      return val;
    }

    function parsePrimary() {
      if (index >= tokens.length) {
        throw new Error('Invalid Expression');
      }
      const token = consume();
      if (token.type !== 'NUMBER') {
        throw new Error('Invalid Expression');
      }
      return token.value;
    }

    const result = parseExpr();
    if (index < tokens.length) {
      throw new Error('Invalid Expression');
    }
    return result;
  }

  function evaluateString(exprStr) {
    const tokens = tokenize(exprStr);
    if (tokens.length === 0) return 0;
    return parseExpression(tokens);
  }

  // --- Calculator Logic Handlers ---

  function handleNumber(digit) {
    if (isError) {
      clearAll();
    }

    if (hasEvaluated) {
      // Start a fresh calculation after equals
      expression = digit;
      currentOperand = digit;
      hasEvaluated = false;
      repeatOperator = null;
      repeatOperand = null;
      updateDisplay('', currentOperand);
      return;
    }

    if (currentOperand === '0') {
      currentOperand = digit;
    } else {
      currentOperand += digit;
    }

    // Append to expression
    if (expression === '' || expression === '0') {
      expression = digit;
    } else {
      // If previous token was an operator with trailing space
      expression += digit;
    }

    updateDisplay(expression, currentOperand);
  }

  function handleDecimal() {
    if (isError || hasEvaluated) {
      clearAll();
      currentOperand = '0.';
      expression = '0.';
      hasEvaluated = false;
      updateDisplay(expression, currentOperand);
      return;
    }

    // Check if current operand already has a decimal point
    if (currentOperand.includes('.')) {
      return;
    }

    if (currentOperand === '' || currentOperand === '0' || expression === '' || expression.endsWith(' ')) {
      currentOperand = '0.';
      expression += '0.';
    } else {
      currentOperand += '.';
      expression += '.';
    }

    updateDisplay(expression, currentOperand);
  }

  function handleOperator(op) {
    if (isError) {
      return;
    }

    repeatOperator = null;
    repeatOperand = null;

    if (hasEvaluated) {
      // Continue calculation chaining from previous result
      expression = `${lastResult} ${op} `;
      currentOperand = '';
      hasEvaluated = false;
      updateDisplay(expression, formatNumber(lastResult));
      return;
    }

    if (expression === '') {
      // If user starts with an operator, use 0 as base
      expression = `0 ${op} `;
      currentOperand = '';
      updateDisplay(expression, '0');
      return;
    }

    // Check if expression already ends with an operator (and spaces)
    const trailingOpMatch = expression.match(/\s([+−×÷])\s$/);
    if (trailingOpMatch) {
      // Allow unary minus after × or ÷
      if ((trailingOpMatch[1] === '×' || trailingOpMatch[1] === '÷') && op === '−') {
        expression += '−';
        currentOperand = '−';
        updateDisplay(expression, currentOperand);
        return;
      }
      // Replace previous operator
      expression = expression.slice(0, -3) + ` ${op} `;
      currentOperand = '';
      updateDisplay(expression);
      return;
    }

    // Normal operator append
    expression += ` ${op} `;
    currentOperand = '';
    updateDisplay(expression);
  }

  function handlePercent() {
    if (isError) return;

    if (hasEvaluated) {
      // Take last result and divide by 100
      try {
        const val = cleanFloat(lastResult / 100);
        lastResult = val;
        expression = `${val}`;
        currentOperand = `${val}`;
        updateDisplay(`${val}% =`, formatNumber(val));
      } catch (e) {
        handleError(e.message);
      }
      return;
    }

    if (expression === '' || expression.endsWith(' ')) {
      return;
    }

    // Append % to expression
    expression += '%';
    currentOperand += '%';

    // Preview or evaluate percentage
    try {
      const result = evaluateString(expression);
      updateDisplay(expression, formatNumber(result));
    } catch (e) {
      updateDisplay(expression, currentOperand);
    }
  }

  function handleEquals() {
    if (isError) return;

    // Handle repeated calculation on consecutive '='
    if (hasEvaluated && repeatOperator !== null && repeatOperand !== null) {
      try {
        const repeatExpr = `${lastResult} ${repeatOperator} ${repeatOperand}`;
        const result = evaluateString(repeatExpr);
        const prevResult = lastResult;
        lastResult = result;
        updateDisplay(`${formatNumber(prevResult)} ${repeatOperator} ${formatNumber(repeatOperand)} =`, formatNumber(result));
      } catch (err) {
        handleError(err.message);
      }
      return;
    }

    if (expression === '') {
      updateDisplay('', '0');
      return;
    }

    // Clean up trailing operators if user clicked '=' right after an operator
    let evalExpr = expression.trim();
    if (/[+−×÷]$/.test(evalExpr)) {
      evalExpr = evalExpr.slice(0, -1).trim();
    }

    // Extract last operator and operand for repeated calculations
    const opMatch = evalExpr.match(/([+−×÷])\s*([0-9.]+%?)$/);
    if (opMatch) {
      repeatOperator = opMatch[1];
      // Evaluate operand value if it contains %
      try {
        repeatOperand = evaluateString(opMatch[2]);
      } catch {
        repeatOperand = parseFloat(opMatch[2]);
      }
    } else {
      repeatOperator = null;
      repeatOperand = null;
    }

    try {
      const result = evaluateString(evalExpr);
      lastResult = result;
      hasEvaluated = true;
      currentOperand = `${result}`;
      updateDisplay(`${evalExpr} =`, formatNumber(result));
    } catch (err) {
      handleError(err.message);
    }
  }

  function handleBackspace() {
    if (isError) {
      clearAll();
      return;
    }

    if (hasEvaluated) {
      // Clear evaluation history on backspace
      expression = `${lastResult}`;
      hasEvaluated = false;
      updateDisplay(expression, formatNumber(lastResult));
      return;
    }

    if (expression.length === 0) return;

    // If expression ends with " op " (3 characters)
    if (/\s[+−×÷]\s$/.test(expression)) {
      expression = expression.slice(0, -3);
      // Restore current operand from remainder
      const tokens = expression.trim().split(/\s+/);
      currentOperand = tokens[tokens.length - 1] || '0';
    } else {
      expression = expression.slice(0, -1);
      if (currentOperand.length > 0) {
        currentOperand = currentOperand.slice(0, -1);
      }
    }

    if (expression === '') {
      currentOperand = '0';
      updateDisplay('', '0');
    } else {
      updateDisplay(expression, currentOperand || '0');
    }
  }

  function clearAll() {
    expression = '';
    currentOperand = '0';
    hasEvaluated = false;
    isError = false;
    lastResult = 0;
    repeatOperator = null;
    repeatOperand = null;
    updateDisplay('', '0');
  }

  function handleError(message) {
    isError = true;
    updateDisplay(`${expression} =`, message || 'Error');
  }

  // --- Visual Feedback for Button Clicks & Keys ---
  function flashButton(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.style.transform = 'scale(0.94) translateY(2px)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 120);
    }
  }

  // --- Click Event Delegation for Keypad ---
  if (keypad) {
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;

      const val = btn.getAttribute('data-value');
      const action = btn.getAttribute('data-action');

      if (val !== null) {
        if (val === '.') {
          handleDecimal();
        } else {
          handleNumber(val);
        }
      } else if (action !== null) {
        switch (action) {
          case 'clear':
            handleClear();
            break;
          case 'backspace':
            handleBackspace();
            break;
          case 'percent':
            handlePercent();
            break;
          case 'add':
            handleOperator('+');
            break;
          case 'subtract':
            handleOperator('−');
            break;
          case 'multiply':
            handleOperator('×');
            break;
          case 'divide':
            handleOperator('÷');
            break;
          case 'calculate':
            handleEquals();
            break;
        }
      }
    });
  }

  function handleClear() {
    clearAll();
  }

  // --- Keyboard Support ---
  window.addEventListener('keydown', (e) => {
    // Prevent interfering with browser navigation or text areas if any
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    if (key >= '0' && key <= '9') {
      handleNumber(key);
      flashButton(`[data-value="${key}"]`);
    } else if (key === '.') {
      handleDecimal();
      flashButton('[data-value="."]');
    } else if (key === '+') {
      handleOperator('+');
      flashButton('[data-action="add"]');
    } else if (key === '-') {
      handleOperator('−');
      flashButton('[data-action="subtract"]');
    } else if (key === '*') {
      handleOperator('×');
      flashButton('[data-action="multiply"]');
    } else if (key === '/') {
      e.preventDefault(); // Prevent browser quick-find
      handleOperator('÷');
      flashButton('[data-action="divide"]');
    } else if (key === '%') {
      handlePercent();
      flashButton('[data-action="percent"]');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleEquals();
      flashButton('[data-action="calculate"]');
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      flashButton('[data-action="backspace"]');
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      e.preventDefault();
      handleClear();
      flashButton('[data-action="clear"]');
    }
  });

  // --- Theme Toggle Controller (Preserved Intact) ---
  const savedTheme = localStorage.getItem('calculator-theme') || 'dark-theme';
  if (savedTheme === 'light-theme') {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = body.classList.contains('dark-theme');
      if (isDark) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('calculator-theme', 'light-theme');
      } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('calculator-theme', 'dark-theme');
      }
    });
  }

  // --- Button Touch & Pointer Feedback ---
  const buttons = document.querySelectorAll('.calc-btn');
  buttons.forEach(button => {
    button.addEventListener('pointerdown', () => {
      button.style.transform = 'scale(0.94) translateY(2px)';
    });

    const resetTransform = () => {
      button.style.transform = '';
    };

    button.addEventListener('pointerup', resetTransform);
    button.addEventListener('pointerleave', resetTransform);
    button.addEventListener('pointercancel', resetTransform);
  });

  // Initialize display
  clearAll();
});
