#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# Cache-busting version bumper
# Usage:  ./bump-version.sh
#         (run before each git push when CSS/JS files have changed)
# ════════════════════════════════════════════════════════════════════════
# Replaces every "?v=YYYYMMDD" suffix on local CSS/JS refs with today's date.
# Forces every browser to fetch fresh copies on next visit.

cd "$(dirname "$0")"

python3 - << 'PY'
import os, re, datetime
NEW_VER = datetime.date.today().strftime("%Y%m%d")
EXCLUDE = {'tools-old.html', 'tools-sample.html', 'tools-v1-dark.html'}
pat = re.compile(r"\?v=\d{8}")

count_files = 0
count_refs = 0
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d != '.git']
    for fn in files:
        if not fn.endswith('.html'): continue
        if fn in EXCLUDE: continue
        path = os.path.join(root, fn)
        s = open(path, encoding='utf-8').read()
        new_s, n = pat.subn(f'?v={NEW_VER}', s)
        if n > 0 and new_s != s:
            open(path, 'w', encoding='utf-8').write(new_s)
            print(f'  ✓ {path} — {n} refs')
            count_files += 1
            count_refs += n

print()
print(f'Bumped {count_refs} refs across {count_files} files to v={NEW_VER}')
print('Now: git add -A && git commit -m "bump cache version" && git push')
PY
