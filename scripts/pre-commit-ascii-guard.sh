#!/bin/sh
#
# BibleLessonSpark -- ASCII Guard (authoritative implementation)
# ================================================================
# Blocks non-ASCII characters in .ts/.tsx source files. Prevents the
# recurring Unicode-corruption bug (em-dashes, curly quotes, arrows,
# checkmarks) silently mangling into ? or garbled bytes across editors
# and encodings.
#
# Two modes:
#   --staged   scan currently staged files (used by the local pre-commit hook)
#   --tracked  scan every git-tracked file (used by CI -- the authoritative run)
#
# This script is the single source of truth for the guard. The local
# .git/hooks/pre-commit is a 2-line delegator to --staged mode; .git/hooks/
# is never versioned by git, so on a fresh clone that hook does not exist
# until reinstalled (see README.md "Local Development"). CI
# (.github/workflows/ci.yml) runs this same script in --tracked mode on
# every push/PR to main -- that run is authoritative regardless of whether
# any local hook is installed or was bypassed with --no-verify.

MODE="$1"

case "$MODE" in
  --staged)
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
    ;;
  --tracked)
    FILES=$(git ls-files | grep -E '\.(ts|tsx)$')
    ;;
  *)
    echo "Usage: $0 --staged|--tracked"
    exit 2
    ;;
esac

if [ -z "$FILES" ]; then
  echo "No .ts/.tsx files to check."
  exit 0
fi

FOUND_ISSUES=0

for FILE in $FILES; do
  case "$FILE" in
    node_modules/*|dist/*|.netlify/*) continue ;;
  esac

  [ -f "$FILE" ] || continue

  RESULTS=$(grep -Pn '[^\x00-\x7F]' "$FILE" 2>/dev/null)

  if [ -n "$RESULTS" ]; then
    if [ "$FOUND_ISSUES" -eq 0 ]; then
      echo ""
      echo "=========================================="
      echo "  BLOCKED: Non-ASCII characters detected!"
      echo "=========================================="
      echo ""
      echo "BibleLessonSpark uses ASCII-only source files"
      echo "to prevent recurring Unicode corruption."
      echo ""
    fi

    echo "--- $FILE ---"
    echo "$RESULTS" | head -10
    echo ""
    FOUND_ISSUES=1
  fi
done

if [ "$FOUND_ISSUES" -eq 1 ]; then
  echo "=========================================="
  echo "  HOW TO FIX:"
  echo "=========================================="
  echo ""
  echo "  Replace:  --  instead of em-dash"
  echo "  Replace:  ->  instead of arrow"
  echo "  Replace:  *   instead of bullet"
  echo "  Replace:  |   instead of separator"
  echo "  Replace:  [x] instead of checkmark"
  echo ""
  echo "  For copyright/legal text, use Unicode"
  echo "  escape sequences: \\u00A9 \\u00AE \\u2122"
  echo ""
  if [ "$MODE" = "--staged" ]; then
    echo "  To bypass (emergency only):"
    echo "    git commit --no-verify"
    echo ""
  fi
  exit 1
fi

echo "All checked files are ASCII-clean."
exit 0
