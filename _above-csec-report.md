# Above-CSEC Content Audit Report

Scan run: 2026-05-12  
Banks scanned: `biology.json`, `chemistry.json`, `physics.json`, `maths.json`, `add-math.json`, `pob.json`, `social-studies.json`, `it.json`, `cpea-mathematics.json` (CAPE banks skipped).

---

## Part A — Existing explicit caveats

Places where the explanation already flags the content as out-of-syllabus for CSEC.

| Bank | ID | pubId | Caveat phrasing | Context |
|------|-----|-------|-----------------|---------|
| chemistry.json | `ch25-022` | `B82` | "not on the CSEC syllabus" | Distractor: "Uranium has allotropes too, but it's not on the CSEC syllabus as an allotropy example." |
| physics.json | `phy18-059` | `PCF` | "For interest only (not on the CSEC syllabus)" | Trailing footnote: "the equation is \(N = N_0 e^{-\lambda t}\), where \(\lambda\) is the decay constant. You don't need to know or use this formula for CSEC." |

That is the complete set. Only **2** existing caveats across all 9 banks.

---

## Part B — Explanations that reference above-CSEC content (no caveat yet)

This section lists questions whose explanation, distractor, or stem touches material that may sit above the strict CSEC syllabus and should probably get a "not on the CSEC syllabus / for interest only" note (or a rewrite).

The scan was deliberately liberal in what it grepped for and then filtered by hand. The overwhelming finding is that **the banks are very tightly scoped to CSEC** — almost nothing flags as genuinely above syllabus. The one borderline item is in Physics.

### physics.json

#### `phy18-054` — pubId `QA7` — *Half-life is defined as* (Atomic & nuclear physics → Definition of half-life)

- **Pattern matched**: `N = N_0 (1/2)^(t/T_{1/2})` — the closed-form exponential-halving equation.
- **Severity**: borderline / edge case. CSEC requires pupils to understand half-life qualitatively and do successive halvings (½, ¼, ⅛, …). The boxed formula \(N = N_0 (1/2)^{t/T_{1/2}}\) is technically correct and intuitive, but CSEC does not require students to manipulate it symbolically with non-integer exponents.
- **Excerpt** (offending paragraph, ~200 chars):
  > "...for a large sample the fraction left after time \(t\) is  \(N = N_0 \left(\dfrac{1}{2}\right)^{t / T_{1/2}}\)  So after one half-life, half of the original atoms remain; after two half-lives, a quarter remain; and so on."
- **Recommendation**: Either (a) keep as-is — it's a friendly companion formula and the worked example only uses integer multiples — or (b) drop the formula into a small "for interest only" footnote matching the style of `phy18-059`. Option (b) is more consistent with the existing caveat in `phy18-059` which already brackets the \(e^{-\lambda t}\) version.

### chemistry.json
No above-CSEC content detected. Activation energy / catalysts, enthalpy (qualitative), bond making/breaking, Le Chatelier (named), equilibrium (qualitative) are all in CSEC scope. No \(K_c, K_a, K_w, K_{sp}, pK_a, \Delta G, \Delta S\), Maxwell-Boltzmann, hybridisation, Hess-law calculations, Arrhenius equation, or molecular-orbital language found anywhere in explanations.

### maths.json
No above-CSEC content detected. No `\ln`, `\int`, `\frac{dy}{dx}`, `e^x`, complex numbers, summation/limit notation, partial fractions, sum-to-product trig, or 3D vectors. Matrices stay at 2×2 (determinant, inverse), which is in CSEC scope. Indices and standard form work is fine.

### add-math.json
No above-Add-Math content detected. No complex numbers, no \(i^2 = -1\), no partial fractions, no integration by parts, no 3D vectors with k-component, no matrices beyond 2×2 inverse. Calculus and \(e^x\) / \(\ln\) appear (as expected — they are in Add Math scope).

### biology.json
No above-CSEC content detected. "Crossing over", "Bowman's capsule", "loop of Henle", "genetic engineering / insulin", "ribosomes / protein synthesis (organelle level)" are all in CSEC bio. No Krebs cycle steps, glycolysis pathway, Calvin cycle, electron transport chain, codon table mechanism, operon, Hardy-Weinberg, enzyme kinetics (Vmax/Km), or PCR detail found.

### pob.json
No above-CSEC content detected.

### social-studies.json
No above-CSEC content detected.

### it.json
No above-CSEC content detected.

### cpea-mathematics.json
No above-syllabus content detected. (Primary level; scan was for any calculus/algebra symbols beyond primary scope — none found.)

---

## Summary

- **Part A (existing caveats)**: 2 (chemistry × 1, physics × 1).
- **Part B (above-CSEC, needs review)**: 1 borderline candidate (physics `phy18-054`).

The MCQ banks are very well scoped to their respective syllabi. The only candidate for a new caveat is `phy18-054`, and even there the formula is presented benignly and only worked with integer exponents. If consistency with `phy18-059` matters, drop the same small "for interest only" footnote there.
