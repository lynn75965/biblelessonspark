#!/usr/bin/env python3
"""
BibleLessonSpark -- Permanent Unicode Cleanup
=============================================
Replaces all non-ASCII characters in .ts/.tsx/.ps1 source files with
ASCII-safe equivalents that cannot be corrupted by encoding mismatches.

EXCEPTIONS (preserved as-is):
  - Language names with accented chars (Espanol, Francais) use Unicode escapes
  - Flag emojis in branding.ts language config use Unicode escapes
  - Copyright/registered/trademark symbols in legal text use Unicode escapes

Run: python3 fix_unicode_permanent.py [--dry-run] <root_directory>
"""

import os
import sys
import re

# ============================================================
# REPLACEMENT RULES
# ============================================================

# For COMMENTS: readable ASCII approximations
COMMENT_REPLACEMENTS = {
    '\u2014': '--',        # em-dash
    '\u2013': '-',         # en-dash
    '\u2192': '->',        # right arrow
    '\u2190': '<-',        # left arrow
    '\u2022': '*',         # bullet
    '\u2713': '[x]',       # check mark
    '\u2705': '[OK]',      # white heavy check mark
    '\u2500': '-',         # box drawing horizontal
    '\u2514': '+-',        # box drawing corner
    '\u1F6A8': '!!',       # siren emoji (won't match as single char)
    '\u00D7': 'x',         # multiplication sign
    '\uFFFD': '--',        # replacement char (was em-dash)
}

# For STRING LITERALS: Unicode escape sequences (render correctly, ASCII source)
STRING_ESCAPE_REPLACEMENTS = {
    '\u00A9': '\\u00A9',   # copyright
    '\u00AE': '\\u00AE',   # registered
    '\u2122': '\\u2122',   # trademark
}

# For ALL contexts: simple ASCII swap
UNIVERSAL_REPLACEMENTS = {
    '\u2014': '--',        # em-dash
    '\u2013': '-',         # en-dash
    '\u2192': '->',        # right arrow
    '\u2190': '<-',        # left arrow
    '\u2022': '*',         # bullet (in comments)
    '\u2713': '[x]',       # check mark
    '\u2705': '[OK]',      # heavy check mark
    '\u2500': '-',         # box drawing horizontal
    '\u2514': '+-',        # box drawing corner
    '\u00D7': 'x',         # multiplication sign
    '\uFFFD': '--',        # replacement char (corrupted em-dash)
}

# Emoji replacements (multi-codepoint safe)
EMOJI_TEXT_REPLACEMENTS = {
    '\U0001F389': '',       # party popper -> remove
    '\U0001F6A8': '!!',     # siren -> !!
}

# Language-specific preservations using escape sequences
LANGUAGE_REPLACEMENTS = {
    'Espa\u00F1ol': 'Espa\\u00F1ol',     # Espanol
    'Fran\u00E7ais': 'Fran\\u00E7ais',   # Francais
}

# Flag emoji replacements (remove - not needed in config)
FLAG_REPLACEMENTS = {
    '\U0001F1FA\U0001F1F8': '',   # US flag -> remove
    '\U0001F1F2\U0001F1FD': '',   # Mexico flag -> remove
    '\U0001F1EB\U0001F1F7': '',   # France flag -> remove
}


def fix_file(filepath, dry_run=False):
    """Fix all non-ASCII characters in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except (UnicodeDecodeError, PermissionError):
        return None

    content = original

    # 1. Replace flag emojis first (multi-codepoint)
    for flag, replacement in FLAG_REPLACEMENTS.items():
        if flag in content:
            content = content.replace(flag, replacement)

    # 2. Replace other emojis
    for emoji, replacement in EMOJI_TEXT_REPLACEMENTS.items():
        if emoji in content:
            content = content.replace(emoji, replacement)

    # 3. Replace language names with escaped versions
    for lang_name, escaped in LANGUAGE_REPLACEMENTS.items():
        if lang_name in content:
            content = content.replace(lang_name, escaped)

    # 4. Handle copyright/registered/trademark in string literals
    # These need Unicode escape sequences so they render correctly
    for char, escape_seq in STRING_ESCAPE_REPLACEMENTS.items():
        if char in content:
            content = content.replace(char, escape_seq)

    # 5. Replace all remaining Unicode with ASCII
    for char, replacement in UNIVERSAL_REPLACEMENTS.items():
        if char in content:
            content = content.replace(char, replacement)

    # 6. Special handling for bullet points used as UI separators
    #    Pattern: text • text or text · text (middle dot)
    content = content.replace('\u00B7', '|')  # middle dot -> pipe

    # 7. Context-aware post-processing

    # In <li> tags, remove bullet prefix (li already provides bullet marker)
    content = re.sub(r'(<li[^>]*>)\s*\*\s*', r'\1', content)

    # Clean up welcome message after emoji removal
    content = content.replace('BibleLessonSpark! "', 'BibleLessonSpark!"')
    content = content.replace("BibleLessonSpark! '", "BibleLessonSpark!'")
    # Clean up empty flag values (flags were emoji, now empty string)
    # Original: flag: "🇺🇸" -> After removal: flag: "" (which is correct)

    # Clean up "! !" patterns from emoji removal in welcome strings  
    content = content.replace('! !', '!')

    # Badge text: "Public Beta * Free" -> "Public Beta | Free"
    content = content.replace('Public Beta * Free', 'Public Beta | Free')

    if content == original:
        return None  # No changes

    changes = []
    orig_lines = original.split('\n')
    new_lines = content.split('\n')
    for i, (ol, nl) in enumerate(zip(orig_lines, new_lines), 1):
        if ol != nl:
            changes.append(f"  L{i}: {nl.strip()[:100]}")

    if not dry_run:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)

    return changes


def scan_directory(root_dir, dry_run=False):
    """Scan and fix all source files in directory."""
    extensions = ('.ts', '.tsx', '.ps1')
    skip_dirs = {'node_modules', '.git', 'dist', '.netlify', '.next'}

    total_files = 0
    fixed_files = 0
    all_changes = {}

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for fname in filenames:
            if any(fname.endswith(ext) for ext in extensions):
                fpath = os.path.join(dirpath, fname)
                total_files += 1
                changes = fix_file(fpath, dry_run)
                if changes:
                    fixed_files += 1
                    rel_path = os.path.relpath(fpath, root_dir)
                    all_changes[rel_path] = changes

    return total_files, fixed_files, all_changes


def main():
    dry_run = '--dry-run' in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith('--')]

    if not args:
        print("Usage: python3 fix_unicode_permanent.py [--dry-run] <root_directory>")
        print("  --dry-run  Show what would change without modifying files")
        sys.exit(1)

    root_dir = args[0]
    if not os.path.isdir(root_dir):
        print(f"Error: {root_dir} is not a directory")
        sys.exit(1)

    mode = "DRY RUN" if dry_run else "FIXING"
    print(f"\n{'='*60}")
    print(f"BibleLessonSpark Unicode Cleanup -- {mode}")
    print(f"{'='*60}")
    print(f"Root: {root_dir}\n")

    total, fixed, changes = scan_directory(root_dir, dry_run)

    if changes:
        for fpath, lines in sorted(changes.items()):
            print(f"\n--- {fpath} ({len(lines)} changes) ---")
            for line in lines:
                print(line)
    else:
        print("No non-ASCII characters found. Codebase is clean!")

    print(f"\n{'='*60}")
    print(f"Scanned: {total} files")
    print(f"{'Would fix' if dry_run else 'Fixed'}: {fixed} files")
    print(f"{'='*60}")

    if dry_run and fixed > 0:
        print("\nRun without --dry-run to apply changes.")


if __name__ == '__main__':
    main()
