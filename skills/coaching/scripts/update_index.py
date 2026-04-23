#!/usr/bin/env python3
"""Update specific fields in index.md while preserving the rest.

Usage:
    python3 update_index.py --last-session "2026-03-28"
    python3 update_index.py --last-periodic-review "2026-03-28"
    python3 update_index.py --focus-areas "Area1,Area2,Area3"
    python3 update_index.py --vision-reviewed "2026-03-28"

Multiple flags can be combined in one call.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import INDEX_PATH


def update_line(content: str, pattern: str, replacement: str) -> str:
    """Replace a line matching pattern with replacement."""
    return re.sub(pattern, replacement, content, flags=re.MULTILINE)


def update_focus_areas(content: str, areas_str: str) -> str:
    """Replace the Active Focus Areas section with new areas."""
    areas = [a.strip() for a in areas_str.split(',') if a.strip()]

    new_lines = []
    for i, area in enumerate(areas[:3], 1):
        new_lines.append(f'{i}. {area}')

    new_section = '\n'.join(new_lines)

    pattern = r'(## Active Focus Areas\n).*?(?=\n## |\Z)'
    return re.sub(pattern, lambda m: m.group(1) + new_section + '\n', content, flags=re.DOTALL)


def main():
    parser = argparse.ArgumentParser(description='Update coaching index.md fields')
    parser.add_argument('--last-session', help='Update last session date')
    parser.add_argument('--last-periodic-review', help='Update last periodic review date')
    parser.add_argument('--focus-areas', help='Update active focus areas (comma-separated)')
    parser.add_argument('--vision-reviewed', help='Update vision last reviewed date')
    args = parser.parse_args()

    if not os.path.exists(INDEX_PATH):
        print(json.dumps({'error': 'index.md not found'}))
        sys.exit(1)

    with open(INDEX_PATH, 'r') as f:
        content = f.read()

    original = content
    updates = []

    if args.last_session:
        content = update_line(content, r'^- Last session:.*$', f'- Last session: {args.last_session}')
        updates.append(f'last_session={args.last_session}')

    if args.last_periodic_review:
        if 'Last periodic review:' in content:
            content = update_line(content, r'^- Last periodic review:.*$', f'- Last periodic review: {args.last_periodic_review}')
        else:
            # Insert after "Last session:" line
            content = update_line(content, r'^(- Last session:.*)$', f'\\1\n- Last periodic review: {args.last_periodic_review}')
        updates.append(f'last_periodic_review={args.last_periodic_review}')

    if args.vision_reviewed:
        content = update_line(content, r'^- \*\*Last reviewed:\*\*.*$', f'- **Last reviewed:** {args.vision_reviewed}')
        updates.append(f'vision_reviewed={args.vision_reviewed}')

    if args.focus_areas:
        content = update_focus_areas(content, args.focus_areas)
        updates.append(f'focus_areas={args.focus_areas}')

    if content != original:
        with open(INDEX_PATH, 'w') as f:
            f.write(content)
        print(json.dumps({'status': 'ok', 'updates': updates}))
    else:
        print(json.dumps({'status': 'no_changes', 'updates': []}))


if __name__ == '__main__':
    main()
