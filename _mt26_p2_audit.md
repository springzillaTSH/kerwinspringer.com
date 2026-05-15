# CSEC Mathematics May/June 2026 Paper 2 — Solutions Audit

**Source PDF:** `/Users/kerwinspringer/Documents/Claude/03_Teaching Resources/CSEC Past Papers/Maths/CSEC Maths - Paper 2 - May-June 2026 Solutions.pdf`

**Scope:** 26 pages, Q1-Q10. This report lists *additional* issues beyond the 5 already flagged by the user. The user-flagged issues are confirmed at the bottom.

Severity legend: `math-error` (wrong arithmetic / wrong answer step), `reasoning` (logic flawed even if answer coincidentally right), `typo` (English / stray characters), `nit` (cosmetic / notation / stylistic).

---

## Q1 — Numbers / Ratio / Percentages

No additional issues found. Math verified:
- 0.85 × 16.40 = 13.94 ✓
- 27.20 ÷ 0.85 = 32.00 ✓
- Total berries 120 ✓

**Possible nit (not flagged):** Q1(a)(ii) uses `√1000 × 0.367 / 3.94 = √100 = 10`. Mathematically this only works if the radical covers the *entire* fraction; the inline typesetting is ambiguous but the final answer 10 is correct under the standard interpretation.

---

## Q2 — Algebra / Quadratics

**Issue 2.1 — nit (formula notation)**
- Location: Q2(b)(ii), quadratic-formula line
- Offending text: `x = −b ± √(b² − 4ac / 2a` (the `√(` opens a parenthesis that is never visibly closed)
- Should be: `x = (−b ± √(b² − 4ac)) / 2a`
- Why: The bracket inside the radical is opened but not closed; the radical bar should clearly cover only `b² − 4ac`, with `2a` as the denominator. Cosmetic but easy fix.

Otherwise: 2x² + 13x − 85 = 0 derivation correct, discriminant 849 correct, x ≈ 4.03 / −10.53 correct.

---

## Q3 — Trigonometry / Construction

No additional issues found (beyond the two stem typos already flagged). Math verified:
- sin v° = 8/12 = 2/3 ✓
- JM = √80 ≈ 8.94 cm ✓
- cos⁻¹(8/12) ≈ 48.19°, ∠MKL = 131.8° ✓

Trapezium construction WX = 9, XY = 5, YZ = 3, ∠WXY = 60° looks valid in the diagram.

---

## Q4 — Coordinate Geometry

**Issue 4.1 — nit (notation, recurs across the question)**
- Location: Q4(a)(i) midpoint formula and Q4(a)(ii) gradient formula
- Offending text: `M = ((x¹ + x²)/2, (y¹ + y²)/2)` and `m = (y² − y¹)/(x² − x¹)`
- Should be: subscripts — `x₁, x₂, y₁, y₂`
- Why: The "1" and "2" are rendered as superscripts (look like exponents) rather than the standard subscripts for indexed coordinates. Could confuse a student into reading `x²` as "x squared".

**Issue 4.2 — nit (midpoint formula shape)**
- Location: Q4(a)(i)
- Offending text: `M = (x¹ + x²/2), (y¹ + y²/2)` — two separate parenthesised expressions joined by a comma
- Should be: a single ordered pair, i.e. `M = ((x₁+x₂)/2, (y₁+y₂)/2)`
- Why: As typeset it reads like two values (a tuple of fractions) without an enclosing outer bracket. Minor.

Math itself is correct: midpoint (−1/2, 1), gradient 2, perpendicular bisector y = −x/2 + 3/4, collinearity check verified.

---

## Q5 — Statistics

**Issue 5.1 — typo (stem)**
- Location: Q5(a), question stem
- Offending text: "the number of goals **cored** in a series of football matches"
- Should be: "**scored**"
- Why: Letter dropped. The table header on the same page correctly reads "Number of Goals scored", making this an internal inconsistency.

**Issue 5.2 — typo (numeric)**
- Location: Q5(b)(ii), Q3 working
- Offending text: "Q3 is the 45.**7**th value"
- Should be: "45.**75**th value"
- Why: 3/4 × 61 = 45.75, not 45.7. Q1's counterpart line correctly writes "15.25th value", so this is an inconsistency.

**Issue 5.3 — nit (notation)**
- Location: Q5(b)(ii), throughout the semi-interquartile-range working
- Offending text: `Q¹`, `Q³` (rendered as superscripts), and the formula `Semi − interquartile range = (Q³ − Q¹) / 2`
- Should be: `Q₁`, `Q₃` (subscripts)
- Why: The quartile indices are written as superscripts in this section, which looks like a power. Subscripts are standard.

Math verified: k = 45 ✓, probability 0.75 ✓, SIQR = 11 s ✓, frequency-table values (28, 16, 1414, 1128) ✓, all 60 students accounted for (13 + 28 + 16 + 3).

---

## Q6 — Ratio / Word problem

No issues found. Math verified:
- Ratio 7 : 5 : 3 ✓
- Flour 455 g, Butter 325 g, Sugar 195 g ✓
- 105 g flour per 12-cookie pack ✓
- 12650 ÷ 105 = 120 r 50 ✓

---

## Q7 — Number patterns

**Issue 7.1 — typo (stem grammar)**
- Location: Q7(a), question stem
- Offending text: "The numbers on the chart **follows** various patterns"
- Should be: "**follow**"
- Why: Subject-verb agreement — "numbers" is plural.

**Issue 7.2 — math-error (working line, final answer still correct)**
- Location: Q7(a)(ii), working for the row number
- Offending text: "Row Number ∶ 651 ÷ 7 = **63**"
- Should be: "651 ÷ 7 = **93**"
- Why: 651 ÷ 7 actually equals 93. The filled-in row label in the diagram is 93 (correct), so the working line contradicts its own answer. A student reading the explanation would be misled.

**Issue 7.3 — nit (stale cross-reference)**
- Location: Q7(a)(ii), question stem
- Offending text: "described on page 22"
- Should be: cross-reference removed or pointed to the correct page within this solutions PDF (the chart is on page 14 of the solutions; "page 22" is a relic of the original CSEC paper pagination).
- Why: A reader of the solutions PDF will look in vain at page 22.

E, S, D formulas verified (E = 2n−1, S = 4n−1, D = 2n+1) and the D − E = 2 proof is correct.

---

## Q8 — Quadratic function & graph

**Issue 8.1 — math-error / typo (graph x-axis labels)**
- Location: Q8(b)(ii), the plotted graph of f(x) = 5 + 4x − 2x²
- Offending text: the x-axis labels to the right of the origin read "−1, −2, −3, −4" instead of "1, 2, 3, 4"
- Should be: positive integers 1, 2, 3, 4 on the right of the origin
- Why: The function is plotted for −2 ≤ x ≤ 4. The curve itself appears correctly drawn (max at (1, 7), zeros either side, endpoints at (−2, −11) and (4, −11)), but the right half of the x-axis is mislabelled with negative values. This is a real visual error that will confuse any student reading off coordinates.

Otherwise: completed-square form −2(x−1)² + 7 correct (a = −2, h = −1, k = 7); table values f(1) = 7 and f(3) = −1 correct; quadratic-formula sense-check for the line y = 3 gives x = 1 ± √2 ≈ 2.414, −0.414, which is close to the stated graph readings of 2.35 and −0.35 — acceptable for "from graph".

---

## Q9 — Transformations & Bearings

**Issue 9.1 — typo (stray character in working)**
- Location: Q9(c)(ii), cosine-rule line
- Offending text: `a² = (15)² + (12)² − 2(15)(12)**c** cos(21)`
- Should be: `a² = (15)² + (12)² − 2(15)(12) cos(21°)`
- Why: There is a stray lowercase "c" between `(12)` and `cos(21)`. Looks like a fragment from `cosA` that was not deleted when the variables were substituted. Also `21` should ideally be `21°` for unit clarity.

**Possible nit (not flagged as an error):** the diagram labels the angle at M as 110°, while the precise back-bearing of N from M is 111° and the precise interior angle ∠LMN ≈ 110.4°. The 110° label is a rounded value of ∠LMN — fine.

Transformation descriptions (rotation 90° anti-clockwise about origin; translation (2, −5)) are consistent with the diagram. ∠MNL = 21° and LM ≈ 5.74 km verified.

---

## Q10 — Vectors & Matrices

**Issue 10.1 — typo (part labelling)**
- Location: Q10(b)
- Offending text: After "(b) (i) Write down the 2 × 2 matrices…" the next sub-part is labelled "**(iii)** The matrices R and Q are expressed in terms of …"
- Should be: "(ii)" (or "(b)(ii)")
- Why: Numbering jumps (i) → (iii). There is no (ii). This is purely cosmetic but easy to miss.

Math verified everywhere: PQ = 2v − u; OT working leads to (2/5)u + (6/5)v (the *displayed* final answer has the u sign flipped — that's the already-flagged error); the 2×2 matrices, RQ product, and the k = 2, c = −4 solution are all correct.

---

## Confirmation of user-flagged issues

All 5 pre-flagged issues are real and present in the PDF:

1. **Q3 stem:** "MK = 5 cm" — diagram and working both use MK = 8 cm. Confirmed.
2. **Q3 stem:** "KM is parallel to KQ" — confirmed; should be "JM is parallel to KQ" (arrows in the diagram are on JM and KQ).
3. **Q4(b):** First line of working retypes A as "(−3, 4)" but the question stem and the slope calculation use (−3, −4). Confirmed.
4. **Q7(a)(iii):** "942 is even so we divide by 7" — confirmed; "evenness" is irrelevant to divisibility by 7. Suggested rewording: *"Column 3 entries are of the form 7r + 2 where r is the row number. So we compute 942 ÷ 7 = 134 remainder 4, then check that the row-134 entries 938, 940, 942 fit the pattern; 942 is in column 3."*
5. **Q10(a)(ii):** Final answer written as "(6/5)v − (2/5)u". Working line above is `u + (6/5)v − (3/5)u`, which simplifies to `(2/5)u + (6/5)v` (positive 2/5 u). Confirmed — sign on u is flipped in the final line.

---

## Summary count

Additional issues found beyond the 5 already known: 12
