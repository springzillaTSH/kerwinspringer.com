#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# Cache-busting version bumper
# Usage:  ./bump-version.sh
# ════════════════════════════════════════════════════════════════════════
# Stamps every local CSS/JS reference + every <meta name="site-version">
# with a fresh timestamp. Forces every browser to re-fetch on next visit.
# Always produces a new version, even within the same minute.

cd "$(dirname "$0")"

python3 bump-version-helper.py
