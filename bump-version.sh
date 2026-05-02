#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# Cache-busting version bumper
# Usage:  ./bump-version.sh
#         (run before each git push when CSS/JS files have changed)
# ════════════════════════════════════════════════════════════════════════
# Replaces every "?v=YYYYMMDD" suffix on local CSS/JS refs with today's date.
# Forces every browser to fetch fresh copies on next visit.

NEW_VER=$(date +%Y%m%d)
cd "$(dirname "$0")"

# Find HTML files at the repo root and update their ?v= queries
FILES=$(ls *.html 2>/dev/null)
COUNT=0

for f in $FILES; do
  # Only touch local refs (skip http/https URLs)
  if grep -qE '\?v=[0-9]{8}' "$f"; then
    # In-place replace any ?v=DDDDDDDD with today's
    sed -i.tmp -E "s/\\?v=[0-9]{8}/?v=$NEW_VER/g" "$f" && rm -f "$f.tmp"
    n=$(grep -cE "\\?v=$NEW_VER" "$f")
    echo "  ✓ $f — $n refs bumped to $NEW_VER"
    COUNT=$((COUNT + 1))
  fi
done

echo
echo "Bumped $COUNT files to v=$NEW_VER"
echo "Now: git add -A && git commit -m 'bump cache version' && git push"
