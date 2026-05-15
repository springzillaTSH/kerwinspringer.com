# Dev-Bleed Audit — site-mockup

Date: 2026-05-15

Scope: user-facing site HTML (root + `tools/`), MCQ bank JSON under `tools/csec-mcq/data/`, and worked-solution HTMLs under `papers/*/answer-keys/` (the original brief said `papers/*/january/*.html` and `papers/*/june/*.html`, but those directories hold PDFs — worked-solution HTMLs live in `answer-keys/`).

Targets audited:
- Root HTMLs: `index.html`, `papers.html`, `tools.html`, `404.html`
- `tools/*.html` (12 files)
- `tools/csec-mcq/data/*.json` (13 banks, excluding `_`-prefixed internal maps)
- `papers/*/answer-keys/*.html` (42 worked-solution HTMLs)
- Spot-checked `tools/csec-mcq/js/engine.js`, `tools/csec-mcq/find.html`, `tools/csec-mcq/quiz.html` for which JSON fields actually reach students

---

## 1. Agent-leftover phrases visible to students  (CRITICAL)

These strings appear inside `stem` / `explanation` / `distractors` / `options` fields and ARE rendered to students by `engine.js`.

### 1a. `tools/csec-mcq/data/poa.json`

- **pubId=BPD, id=poaj24-025**, `explanation`:
  - `"<p>Apex has the highest acid-test ratio at 3.6:1 (per marked OCR), indicating the best liquidity.</p>"`
  - Leak: parenthetical "(per marked OCR)" is internal agent note.

- **pubId=HWR, id=poaj24-026**, `explanation`:
  - `"<p>The businessman is offering the discount to customers for prompt payment - this is a discount allowed (per marked OCR key 'SE').</p>"`
  - Leak: "(per marked OCR key 'SE')" — exactly the phrase the brief called out.

### 1b. `tools/csec-mcq/data/physics.json`

- **pubId=WT8, id=phy18-049**, `explanation` (most severe — multi-sentence agent reasoning):
  - Contains the phrases: `"(wait — re-check: applying step-up gives V_s = 3 V_p). However the verified key gives 0.33 A..."` and `"reading the OCR carefully: the question states primary to secondary turns ratio 1:3 but the answer reflects the standard CXC interpretation."`
  - Leak: reads like the agent's internal "show-the-working-out-loud" log; mentions "verified key", "OCR carefully", "standard CXC interpretation". Should be a clean derivation.

### 1c. `tools/csec-mcq/data/csec-english-a.json`

- **pubId=4T3, id=enga18-020**, `explanation`:
  - `"<p>The original OCR shows 'a to deficiencies', indicating the verb in this span is missing/inappropriate. The error lies in this clause's verb form/preposition.</p>"`
  - Leak: "The original OCR shows" exposes ingestion pipeline; should be reframed as "The printed text shows…".

- **pubId=R3N, id=enga23-042**, `stem`:
  - `'<div class="passage"><p>[Editor\'s note: the 2023 Paper 1 OCR of this passage is significantly degraded; the text below is a careful reconstruction…'`
  - Also later in same stem: `'(author attributed as "Source unknown" by CXC; OCR-reconstructed)'`
  - Leak: `[Editor's note: ... OCR ... reconstruction]` and `OCR-reconstructed` parenthetical — both pipeline jargon.

- **pubId=JKY, id=enga23-052**, `explanation`:
  - `"<p>Note: the OCR-reconstructed bank stem here matches CXC's intention — the opening's sarcastic 'open request… Does anybody know?' grabs attention.</p>"`
  - Leak: "OCR-reconstructed bank stem" — student should never see "bank stem".

### 1d. `tools/csec-mcq/data/it.json`  (FALSE POSITIVE — keep)

- **pubId=GUT, id=it-019** and **pubId=2ZH, id=it18-027** mention OCR in answer options/distractors, but here "OCR (Optical Character Recognition)" is the legitimate IT topic. Not a leak.

### 1e. `tools/csec-mcq/data/csec-english-a.json`  (FALSE POSITIVE — keep)

- **pubId=REE, id=enga20-055** distractor B says `"'Dermatologists APPROVE' is an unverified claim."` — content about advertising; "unverified" is intentional. Not a leak.

---

## 2. Q-IDs and paper-IDs leaking to students

The MCQ engine (`tools/csec-mcq/js/engine.js`) does NOT render `q.id`, `q.paper`, `q.appearedIn`, or `q.questionNumber` — only the short opaque `pubId` (3-char, e.g. "AZJ") is shown, by design. So the bulk of internal IDs in the JSON banks (`mt20j-002`, `Math-2020-Jan`, `EngA-2018-MJ`, etc.) stay in metadata and are NOT user-visible.

One exception found:

- **`tools/csec-mcq/find.html` line 90:**
  ```js
  setStatus('Found ' + rec.id + ' in ' + rec.bank + ' — jumping…', 'ok');
  ```
  - When a student looks up a 3-letter pubId in `find.html`, the success message renders the internal Q-ID (e.g. `mt20j-002`) and bank slug. Brief specifically called out `poaj25-016`, `mt20j-011` — this is the place those would appear.
  - Recommendation: replace `rec.id` with a friendly description (e.g. `'Found that question in CSEC Mathematics — jumping…'`).

No worked-solution HTML under `papers/*/answer-keys/` contains any Q-ID or paper-ID string.

No root HTML (`index.html`, `papers.html`, `tools.html`, `404.html`) contains Q-IDs or paper-IDs.

---

## 3. Internal metadata fields (silent — not surfaced)

These exist in the JSON but the engine never reads them, so they are invisible to students. Listed for completeness in case the file is ever re-rendered elsewhere.

- `_pendingDiagram` — 187 occurrences in `tools/csec-mcq/data/maths.json`, 12 in `tools/csec-mcq/data/physics.json`.
- No `_confidenceFlag`, `needs key verification`, `[placeholder]`, or `Lorem ipsum` strings found anywhere in the audited set.

Status: not user-facing, but worth stripping before public release for cleanliness.

---

## 4. TODO / FIXME / XXX / HACK comments

None in user-facing root HTMLs, none in worked-solution HTMLs, none in JSON banks.

Two false-positive substring matches inside the minified KaTeX bundle embedded in `tools/chemistry-mastery.html` (line 81) and `tools/physics-formula-mastery.html` (line 71) — these are not real TODO comments, just the letters "todo" appearing inside compressed library code. Safe to ignore.

---

## 5. Debug logs (`console.log/warn/error`, `debugger;`, `alert()`)

Not student-visible (developer console only), but listed for hygiene:

- `papers.html:337` — `console.error('[rr] PAPERS_DATA missing'); return;`
- `tools/chemistry-mastery.html:2233, 2237, 2885, 4059, 4088, 4180` — six `console.warn` calls (KaTeX render fallback, BGM playback fallbacks).
- `tools/physics-formula-mastery.html:2218, 2222, 3106` — three `console.warn` calls (same KaTeX/preview fallbacks).
- `tools/scribbler.html:2849, 2918, 2956, 5714, 6053` — five `console.warn` / `console.error` for save / load / chime / PDF-import failures.

No `debugger;` statements or `alert()` calls found in production paths.

---

## 6. Internal dev comments shipped to client

Low priority, not visible without "view source":

- `tools/mole-concept-mastery.html:414` — CSS comment: `/* img-ph placeholder styles removed — re-add when images are ready */` (internal note left in stylesheet).
- `tools/chemistry-mastery.html:622` and `tools/physics-formula-mastery.html:592` — CSS comment: `/* Empty-pile placeholder (dashed outline) — scale to the shrunk mini-stack */` (neutral, fine).
- `tools/measurement-lab.html:2952` — JS comment: `/* Uses a placeholder-pass to avoid re-matching already-replaced text. */` (neutral, fine).

---

## 7. Placeholder UX text (intentional / safe)

- `papers.html` shows `"☕ Coming soon"` for paper-stub cards (line 680) — this is intentional UX copy, not a dev artifact.
- All `placeholder="…"` HTML attributes on inputs (search boxes, name-entry fields) across `papers.html`, `tools.html`, and tool HTMLs are intentional UX.

---

## Summary counts

| Category | Real hits |
|---|---|
| Agent-leftover phrases in student-visible text | **8 questions across 3 banks** (poa.json ×2, physics.json ×1, csec-english-a.json ×5 in 3 questions) |
| Internal Q-ID surfaced in UI | **1** (`tools/csec-mcq/find.html:90`) |
| Internal metadata fields in JSON (silent) | 199 `_pendingDiagram` entries in maths/physics banks |
| TODO/FIXME/HACK (real) | 0 |
| `console.*` calls (dev-only) | 15 across 4 files |
| Dev comments in source | 1 mildly notable (mole-concept-mastery.html:414) |
| Q-IDs/paper-IDs in worked-solution HTMLs | 0 |
| Lorem ipsum / `[placeholder]` / `[image]` / "see above" | 0 |

## Hot-spot files (in priority order)

1. **`tools/csec-mcq/data/physics.json`** — pubId WT8 explanation reads like an internal scratchpad ("wait — re-check", "the verified key gives", "reading the OCR carefully"). Highest urgency to rewrite.
2. **`tools/csec-mcq/data/poa.json`** — pubId BPD and HWR have "(per marked OCR ...)" parentheticals in explanations.
3. **`tools/csec-mcq/data/csec-english-a.json`** — pubId R3N stem starts with `[Editor's note: ... OCR ... reconstruction]`; pubId 4T3 says "The original OCR shows"; pubId JKY says "OCR-reconstructed bank stem".
4. **`tools/csec-mcq/find.html`** — line 90 shows internal Q-IDs (e.g. `mt20j-002`) in a status banner.
