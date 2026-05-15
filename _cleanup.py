import json
import glob
import os
import re

fixes_applied = 0

for fp in sorted(glob.glob('tools/csec-mcq/data/*.json')):
    name = os.path.basename(fp)
    if name.startswith('_'):
        continue
    try:
        d = json.load(open(fp))
    except Exception:
        continue
    if not isinstance(d, dict) or 'questions' not in d:
        continue

    for q in d['questions']:
        # === 1. Slim passage attributions: drop CXC + Reproduced/fair-use ===
        if isinstance(q.get('stem'), str):
            s = q['stem']
            orig = s
            # Drop (attributed as Source unknown by CXC). variants
            s = re.sub(r'\(author attributed as ["‘’“”\']Source unknown["‘’“”\'] by CXC\)\.?\s*', '', s)
            s = re.sub(r'\(attributed as ["‘’“”\']Source unknown["‘’“”\'] by CXC\)\.?\s*', '', s)
            # Drop "Reproduced for educational fair-use under teacher-facilitated study practice."
            s = re.sub(r'Reproduced for educational fair[-\s]?use(?:\s+under teacher-facilitated study practice)?\.?\s*', '', s, flags=re.I)
            # Drop standalone "by CXC" mentions
            s = re.sub(r'\bby CXC\b\.?\s*', '', s)
            # Drop "Item N refers to (the following)" — the diagram is embedded
            s = re.sub(r'Items?\s+\d+(?:[-–]\d+)?\s+refers?\s+to\s+(?:the\s+)?(?:following\s+)?', '', s, flags=re.I)
            # Collapse empty passage-attrib tags
            s = re.sub(r'<p class="passage-attrib"><em>\s*</em></p>', '', s)
            s = re.sub(r'<p class="passage-attrib"><em>\s*\.?\s*</em></p>', '', s)
            # Whitespace cleanup
            s = re.sub(r'[ \t]{2,}', ' ', s).strip()
            if s != orig:
                q['stem'] = s
                fixes_applied += 1

        # === 2. Clean diagram alt text of internal IDs ===
        if isinstance(q.get('diagram'), dict) and isinstance(q['diagram'].get('alt'), str):
            alt = q['diagram']['alt']
            orig = alt
            alt = re.sub(r'Same figure as [a-z]+\d+[a-z]?-\d{3}', 'Same figure as the related question', alt)
            alt = re.sub(r'Diagram for [a-z]+\d+[a-z]?-\d{3}\.?', 'Question diagram', alt)
            alt = re.sub(r'\s*used in question \d+\.?', '', alt)
            alt = re.sub(r'[ \t]{2,}', ' ', alt).strip()
            if alt != orig:
                q['diagram']['alt'] = alt
                fixes_applied += 1

    with open(fp, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)

print(f'Fields cleaned: {fixes_applied}')

# Re-verify
hits = []
PATS = [
    (r'\bCXC\b', 'CXC mention'),
    (r'\bReproduced for educational', 'Reproduced phrase'),
    (r'Same figure as [a-z]+\d+[a-z]?-\d{3}', 'internal-id alt'),
    (r'Diagram for [a-z]+\d+[a-z]?-\d{3}', 'internal-id alt'),
    (r'used in question \d+', 'question-N alt'),
    (r'Items?\s+\d+(?:[-–]\d+)?\s+refers?', 'Item N refers'),
]
for fp in sorted(glob.glob('tools/csec-mcq/data/*.json')):
    name = os.path.basename(fp)
    if name.startswith('_'):
        continue
    d = json.load(open(fp))
    if not isinstance(d, dict) or 'questions' not in d:
        continue
    for q in d['questions']:
        blob = q.get('stem', '') + ' ' + q.get('explanation', '')
        diag = q.get('diagram')
        if isinstance(diag, dict):
            blob += ' ' + diag.get('alt', '')
        for pat, label in PATS:
            if re.search(pat, blob, re.I):
                hits.append((name, q.get('id'), label))

if hits:
    print(f'\nRemaining hits: {len(hits)}')
    from collections import Counter
    for cat, n in Counter(h[2] for h in hits).most_common():
        print(f'  {cat}: {n}')
    for h in hits[:5]:
        print(f'    {h[0]} {h[1]}: {h[2]}')
else:
    print('\nVerified: 0 dev/CXC/internal-id leaks remaining')
