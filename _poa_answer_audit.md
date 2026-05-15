# POA MCQ Bank — Answer Audit (223 items)

Source: `tools/csec-mcq/data/poa.json` (POA-2021-MJ, POA-2023-MJ, POA-2024-Jan, POA-2025-Jan).
Trust order: 2023-MJ marked > 2021/2024/2025 inferred.

---

## Confident wrong answers

(Bank says X, should be Y — with 1-sentence justification.)

### poa21-045 — Treatment of partners' salaries — Bank: **B** ("credited in the appropriation account") → Should be **D** ("credited in the partners' current account").
Partner salaries are **debited** to the appropriation account (an appropriation, not an income) and **credited** to the partner's current account; option B reverses the sign on the appropriation side. The parallel item poa23-045 correctly marks D, so this is an internally inconsistent answer in 2021.

### poaj25-037 — Profit-sharing 2:1 — Bank: **D**. Answer is correct numerically, but **options B and C are textually identical** ("Karen $1 800 : Garth $1 800"); the item is malformed. The 2:1 distractor (Karen $1 800 : Garth $1 800) appears twice and the correct 2:1 split distractor pair is missing — needs an options rewrite even though D is the right share calc.

### poaj25-040 — Cash repair on machinery — Bank: **C** ("debit repairs; credit cash"). Answer is correct, but **options A and D are textually identical** ("debit cash; credit machinery"). Malformed item — fix duplicate distractor.

### poaj25-016 — Net profit from capital movement — Bank: **D** ($3 000). Stem omits the opening capital figure (it should read "$2 760" per the 2025 paper). With the standard CSEC values (opening $2 760, drawings $900, closing $4 860) the marked D = $3 000 is correct, but the stem as written is unanswerable — the opening capital must be inserted.

### poa23-029 — Prime cost per unit (P. Hawk) — Bank: **C** ($13).
Raw materials $1 900 + factory wages $2 500 = prime cost $4 400; $4 400 / 640 = **$6.88** (closest option A "$4"). Adding rates and rent ($6 400 / 640 = $10) gives total factory cost, not prime cost. The marked $13 matches no defensible computation; this answer is wrong on accounting principle. The parallel item poaj24-012 correctly states $10 (option C) using rates/rent included — but labels it "cost of ONE unit," not "prime cost." poa23-029 should be flagged as bad source / unanswerable.

### poaj25-044 — Cash discount column in 3-column cash book — Bank: **D** (Discount received).
Stem: "A businessman **offers** a reduction in price for prompt payment for goods purchased." Because the trader is **offering** the discount, he is the seller and this is a **discount allowed (C)**. The parallel item poaj24-026 (same paper family, marked OCR key) correctly chose C. The 2025 answer is internally inconsistent and likely wrong.

---

## Soft calls — verify against teacher

### poaj25-053 — "Credit sales included in the period of sale" — Bank: **B** (Matching).
The strict CSEC label is **revenue recognition / accrual / realisation**; matching is conceptually about pairing expenses to revenue. CSEC syllabus often conflates the two, so B is defensible but Accrual would be the technically purer answer if it were offered.

### poaj25-025 — Current ratio "2:1" — Bank: **A**. The stem refers to "the given table" which is not included in the JSON. Answer is a CSEC default benchmark; cannot be independently verified without the source table.

### poaj25-018 — Capital at 1 Jan 2025 — Bank: **B** ($110 000).
Only resolves to $110 000 if "bank 40 000" in the stem is reinterpreted as a debit balance that is excluded or if the bank-overdraft figure replaces the bank asset. As literally written, closing assets = 300, closing liabilities = 60, closing capital = 240, opening = 240 − 130 + 40 = **$150 000** (not an option). Stem is ambiguous; mark consistent with the original paper if it lists overdraft only.

### poaj24-013 / poa23-020 — Non-current assets = $42 000.
The listed NCA items (Furniture $10 000 + Premises $20 000 = $30 000) do not match $42 000. The 2023 paper marked $42 000, so likely the original paper had additional NCA items (motor vehicle, equipment) that were lost in extraction. Trust the marked key, but flag the stem as missing data.

### poaj24-022 — Receipts and payments cash balance = **$320** (C).
Receipts $300 + $550 = $850. Payments $60 + $250 + $150 + $50 = $510. Bal = $340, not $320. Off by $20 — likely a small stem/OCR error (e.g., postage $30 not $50). Mark trusted from 2023 lineage but stem doesn't reconcile.

### poaj25-049 — Bank statement balance — Bank: **A** (Debit $5).
Math: 60 + 90 − 100 + 30 − 85 = −5. Correct in sign. The convention "Debit balance" on a bank statement = overdrawn from customer view is CSEC-accepted, but some textbooks would phrase as "overdrawn $5" not "debit $5." Defensible.

### poaj25-026 — Total assets = **$14 000** (C).
Stem omits the building value — answer is derived from Capital + Payables = $14 000 (Asset side). Valid by accounting equation, but the listed assets (cash $1 000 + MV $2 000 + recv $2 000 = $5 000 plus an unspecified building) cannot be summed directly. Stem needs the building figure.

### poaj24-025 — Best liquidity (Quick ratio) — Bank: **B** (Apex 3.6:1).
Highest acid-test = best liquidity in pure form, but a CSEC examiner might argue that an extremely high quick ratio is poor working-capital management. Standard CSEC answer is "highest ratio = best liquidity," so B is defensible.

### poaj25-036 — Total capital expenditure $8 000. Stem table omitted; cannot verify from JSON content. Trust answer but flag for source verification.

### poa23-050 — Provision for bad debts schedule = **$180** (A).
Stem table omitted; the parallel item poaj24-029 (same data shown) gives $340 (B). The 2023-MJ marked answer is $180 — likely a different schedule on the 2023 paper. Cannot reconcile without source. Trust the 2023 mark but the explanation prose is a placeholder.

### poa23-028 — Receipts and payments closing cash $320. Same arithmetic problem as poaj24-022 (off by $20). Trust marked answer but stem reconciliation is off.

### poa23-017 — Returns inwards after trade discount = **$500** (D).
The marked answer ignores the trade discount; the canonical CSEC answer (and the parallel poa21-017) is **$375** because trade discount is never separately recorded. Two scenarios on the same paper give different answers; trust the physical 2023 mark but note the conflict — likely a CXC mistake on the paper or an OCR miscapture.

---

## Explanation / distractor errors (answer is right, prose is off)

### poa21-008 / poa23-008 (overtime gross pay $2 675) — Explanation says "Overtime = 9 hours × ($50 × 1.5) = 9 × $75 = $675." The figure is right but the formula is slightly sloppy: should read 9 × $50 × 1.5 = $675 (overtime *rate* is $75/hr, not 9 × $75). Cosmetic.

### poaj25-049 — Explanation says "From the bank's perspective, a negative customer balance is shown as a debit balance." Wording is technically inverted: from the bank's books, the customer is a creditor when in funds; when overdrawn, the bank treats the customer as a debtor — so the *bank statement* shows the customer's account as debit. Right conclusion, slightly confusing prose.

### poaj25-054 — LIFO explanation says "200 g sold from the 10 April batch." Stem says total sales = 200 g (100 + 100). Two LIFO-sells of 100 g each both drawn from the most recent batch is consistent. Wording is acceptable; cosmetic only.

### poaj24-035 — "$1,000 in inventory" treated as $1,000 drawings. The phrasing "$1,000 in inventory" is unusual (inventory drawings are valued at cost); the calc is correct but the explanation should mention that goods-for-own-use are valued at cost when added back.

### poa21-050, poaj24-013, poa23-020, poa23-028, poa23-029, poa23-050, poaj24-022, poaj24-025, poaj24-026, poaj25-025, poaj25-036 — Explanations include phrases like "per the marked OCR key," "per the marked key," or "the underlying table for this item could not be fully extracted." These are honest placeholders, not wrong prose, but they reveal that the answer was *not* verified against the calculation; flag for teacher confirmation.

### poa21-052 / poaj25-043 — FIFO inventory explanation says "Of 110 cans available (40+80)." Should be 120 cans (40+80) — the figure in the parenthetical is mis-summed but the FIFO logic and final $5 150 are correct.

### poa23-017 — Explanation candidly admits "the marked answer on the paper is $500" while textbooks say $375. Useful caveat but the item should probably be removed or rewritten.

### poaj24-026 — Explanation says "per marked OCR key 'SE'." The 'SE' code is an internal extraction artifact and should be stripped before publishing to students.

### poaj25-016 — Explanation says "the figure that fits the standard CSEC pattern (opening capital 2760, drawings 900, closing 4860)" — this exposes the inference to the student. Stem should be edited to insert "$2 760 opening capital" rather than leaving the gap.

---

Confident-wrong: 6 · Soft-calls: 12 · Prose-only: 9
