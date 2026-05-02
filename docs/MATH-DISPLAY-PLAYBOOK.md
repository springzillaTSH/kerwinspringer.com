# Math Display Playbook

**Rule of thumb:** The MCQ engine renders math via KaTeX using **`\(...\)`** for inline and **`\[...\]`** for display. **Plain `$` is for currency only — never for math delimiters.**

## The two delimiters

| Use | Delimiter | Example (in JSON) | Renders as |
|---|---|---|---|
| Inline math | `\(...\)` | `"\\(\\frac{1}{3}\\)"` | ⅓ |
| Display math (centred block) | `\[...\]` | `"\\[\\sum_{n=1}^{10} n\\]"` | (big centred sum) |
| Currency | plain `$` | `"$15 000"` | $15 000 |

Note: in JSON files, every `\` doubles to `\\`, so `\(` is written as `\\(`, and `\frac` is written as `\\frac`.

## Common patterns

```
Fraction:        \(\frac{1}{3}\)            →  ⅓
Mixed number:    \(1\frac{1}{3}\)           →  1⅓
Power:           \(x^{2}\)                  →  x²
Subscript:       \(a_n\)                    →  aₙ
Square root:     \(\sqrt{17^{2}-15^{2}}\)   →  √(17²−15²)
Negative:        \(-2\)                     →  −2
Inequality:      \(x \le 4\)                →  x ≤ 4
Pi:              \(\pi\)                    →  π
Percent:         \(20\%\)                   →  20%
Multiplication:  \(2 \times 5\)             →  2 × 5
Quadratic:       \(ax^{2} + bx + c = 0\)    →  ax²+bx+c=0
Set:             \(\{x : -2 < x \le 4\}\)   →  {x : −2<x≤4}
Matrix:          \(\begin{pmatrix}1&2\\3&4\end{pmatrix}\)
```

## What goes inside `\(...\)`

Everything that's mathematical: variables, expressions, equations, fractions, powers, units like `cm²`, percent signs that participate in calculations, etc.

## What stays outside `\(...\)`

- **Currency:** `$15 000`, `$3.10`, `$1 020.00` — plain text. Never wrap in math mode.
- **Units in prose:** "12 metres", "60 students", "8% interest" — plain English.
- **Sentence-level percent signs:** "of 40 is 8%" — plain text. Use math mode only when % is part of a formula.

## Why we don't use `$...$`

We dropped `$...$` as a KaTeX delimiter because **CSEC Maths uses dollar signs for currency**. Pairing `$...$` causes catastrophic bleed: `"For every $1, a salesman is paid $0.10"` would be rendered as math, mangling the whole sentence.

The auto-render config in `tools/csec-mcq/js/engine.js` accepts ONLY:
```js
{ left: '\\[', right: '\\]', display: true },
{ left: '\\(', right: '\\)', display: false },
```

## Authoring checklist (before adding a new MCQ)

1. **Currency stays plain text** — don't wrap dollar amounts in `\(...\)`.
2. **Wrap every math expression in `\(...\)`** — not just the operator.
   - Bad: `the value of \(x\) is 4`  ← variable wrapped, number not. Fine, but inconsistent.
   - Good: `the value of \(x\) is \(4\)` OR `the value of x is 4`.
3. **Inside `\(...\)`, escape the dollar sign as `\$`** if you need to display $ as part of an equation:
   - `\(\$15\,000 \times 0.20 = \$3\,000\)` → renders "$15,000 × 0.20 = $3,000"
4. **Use `\,` for thin space** in numbers and currency: `\(\$15\,000\)` looks better than `\(\$15000\)`.
5. **Run the audit** before committing big changes:
   ```
   python3 -c "import json,re; d=json.load(open('tools/csec-mcq/data/maths.json'))
   for q in d['questions']:
     b = q['stem']+' '+' '.join(q['options'].values())+' '+q.get('explanation','')
     o,c = b.count('\\\\(\\'), b.count('\\\\)')
     if o!=c: print(q['id'], o, c)"
   ```

## Loading & timing (developer note)

The engine's `renderMath()` helper auto-retries every 80ms until KaTeX has finished loading from CDN. It also re-renders on `window.load`, so first-paint races are handled. Do not call it more aggressively than once per question render.

## Test page

When in doubt, paste your stem into a KaTeX playground (https://katex.org) — replace `\\` (JSON) with `\` (raw) first. If it renders cleanly there, it'll render cleanly in the engine.
