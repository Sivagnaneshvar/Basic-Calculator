# Basic Calculator

A modern and responsive Basic Calculator web application developed using Python Flask, HTML, CSS and JavaScript.

## Features

- Addition
- Subtraction
- Multiplication
- Division
- Percentage calculations
- Decimal number support
- Clear All (AC)
- Backspace functionality
- Mathematical operator precedence
- Keyboard input support
- Repeated calculation support
- Division-by-zero error handling
- Safe mathematical expression parser without eval()
- Number formatting with thousand separators
- Light and Dark themes
- Responsive Glassmorphism UI

## Technology Stack

- Python
- Flask
- HTML5
- CSS3
- JavaScript

## Project Structure

```text
basic-calculator/
├── app.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

## Installation and Setup

1. Open the project folder in VS Code.
2. Create and activate a Python virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the Flask application:

```bash
python app.py
```

5. Open your browser:

```text
http://127.0.0.1:5000
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| 0–9 | Enter numbers |
| +, -, *, / | Arithmetic operations |
| % | Percentage |
| Enter or = | Calculate |
| Backspace | Delete last character |
| Escape or C | Clear all (AC) |
| . | Decimal point |

## Security and Error Handling

- Uses a custom recursive-descent expression parser.
- Avoids JavaScript eval().
- Handles invalid expressions.
- Prevents division by zero.
- Validates decimal input.

## Testing

The implementation report records 25/25 automated and manual test scenarios passed, covering arithmetic operations, percentage, keyboard support, expression parsing, error handling and themes. Run tests with:

```bash
node test_calculator.js
```

## Project Purpose

Developed as a Python Development Internship project to demonstrate Flask application development, JavaScript programming, mathematical expression handling and responsive UI design.
