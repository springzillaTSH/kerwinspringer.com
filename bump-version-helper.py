#!/usr/bin/env python3
"""Cache-busting version bumper — invoked by bump-version.sh."""
import os, re, datetime

NEW_VER = datetime.datetime.now().strftime('%Y%m%d-%H%M')
EXCLUDE = {'tools-old.html', 'tools-sample.html', 'tools-v1-dark.html'}

# 1) Replace any existing ?v=YYYYMMDD or ?v=YYYYMMDD-HHMM with the new version
pat_v = re.compile(r'\?v=\d{8}(?:-\d{4})?')

# 2) Update <meta name="site-version" content="...">
pat_meta = re.compile(r'(<meta name="site-version" content=)"[^"]*"')

# 3) Stamp any naked local css/js refs that don't yet have a query
pat_naked = re.compile(r'(href|src)="([^"]+\.(?:css|js))"')

count_files = 0
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d != '.git']
    for fn in files:
        if not fn.endswith('.html'): continue
        if fn in EXCLUDE: continue
        path = os.path.join(root, fn)
        with open(path, encoding='utf-8') as f:
            s = f.read()
        original = s

        # Bump existing version stamps
        s = pat_v.sub('?v=' + NEW_VER, s)

        # Bump site-version meta
        s = pat_meta.sub(r'\1"' + NEW_VER + '"', s)

        # Stamp naked local refs (skip already-versioned, skip http(s)://, skip //protocol)
        def stamp_naked(m):
            attr, ref = m.group(1), m.group(2)
            if ref.startswith('http') or ref.startswith('//'):
                return m.group(0)
            return attr + '="' + ref + '?v=' + NEW_VER + '"'
        s = pat_naked.sub(stamp_naked, s)

        if s != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(s)
            print('  ✓ ' + path)
            count_files += 1

print()
print('Bumped {} files to v={}'.format(count_files, NEW_VER))
print('Now: git add -A && git commit -m "bump cache version" && git push')
