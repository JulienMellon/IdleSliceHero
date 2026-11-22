#!/usr/bin/env bash
# One-time setup for a fresh cloud container (S9 lessons, 2026-11-22).
# Idempotent: each step is skipped when already done. Prints one line per step.
# The orchestrator runs it at session start (README section 6) before any wave or verify.
set -u
cd "$(dirname "$0")/.."

if [ -x node_modules/.bin/tsc ]; then echo "node_modules: ok"
else npm ci > /tmp/npmci.log 2>&1 && echo "node_modules: installed" || { echo "node_modules: npm ci FAILED (see /tmp/npmci.log)"; exit 1; }; fi

# The screenshot scripts use Python Playwright against the pre-installed Chromium (/opt/pw-browsers).
if python3 -c "import playwright" 2>/dev/null; then echo "playwright (python): ok"
else pip install -q playwright==1.63.0 > /tmp/pw.log 2>&1 && echo "playwright (python): installed 1.63.0" || { echo "playwright (python): install FAILED (see /tmp/pw.log)"; exit 1; }; fi

# The audio bank (R0 chose bank C). Only the music track needs it; a failure here does not stop the session.
if ls tools/audio/banks/*.sf3 > /dev/null 2>&1; then echo "audio bank: ok"
else (apt-get update -qq > /tmp/apt.log 2>&1; cd tools/audio && ./fetch_bank.sh C > /tmp/bank.log 2>&1) && echo "audio bank: fetched C" || echo "audio bank: fetch FAILED (see /tmp/bank.log); only the music track needs it"; fi
