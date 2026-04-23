#!/usr/bin/env python3
"""Archive a development area by setting its status to archived.

Usage:
    python3 archive_area.py --area "Area Name" --reason "No longer relevant"
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import DEV_AREAS_PATH

TODAY = datetime.now().strftime('%Y-%m-%d')


def main():
    parser = argparse.ArgumentParser(description='Archive a coaching development area')
    parser.add_argument('--area', required=True, help='Name of the area to archive')
    parser.add_argument('--reason', required=True, help='Reason for archiving')
    args = parser.parse_args()

    if not os.path.exists(DEV_AREAS_PATH):
        print(json.dumps({'error': 'development-areas.md not found'}))
        sys.exit(1)

    with open(DEV_AREAS_PATH, 'r') as f:
        content = f.read()

    # Find the area section by name (case-insensitive match)
    area_pattern = re.compile(
        r'(### ' + re.escape(args.area) + r'\n)',
        re.IGNORECASE
    )

    if not area_pattern.search(content):
        print(json.dumps({'error': f'Area not found: {args.area}'}))
        sys.exit(1)

    # Update status to archived
    # Find the status line within this area's section
    # Area section runs from "### Name" to the next "### " or end of file
    sections = re.split(r'(?=^### )', content, flags=re.MULTILINE)
    updated_sections = []
    found = False

    for section in sections:
        if section.strip().lower().startswith(f'### {args.area.lower()}'):
            found = True
            # Replace status
            section = re.sub(
                r'\*\*Status:\*\*\s*\w+',
                '**Status:** archived',
                section
            )
            # Add archive note to progress
            if '**Progress:**' in section:
                section = section.replace(
                    '**Progress:**',
                    f'**Progress:**\n- {TODAY}: Archived — {args.reason}'
                )
            else:
                # Add progress section before current practice
                if '**Current practice:**' in section:
                    section = section.replace(
                        '**Current practice:**',
                        f'**Progress:**\n- {TODAY}: Archived — {args.reason}\n**Current practice:**'
                    )
                else:
                    section = section.rstrip() + f'\n**Progress:**\n- {TODAY}: Archived — {args.reason}\n'
        updated_sections.append(section)

    if not found:
        print(json.dumps({'error': f'Area section not found: {args.area}'}))
        sys.exit(1)

    content = ''.join(updated_sections)

    with open(DEV_AREAS_PATH, 'w') as f:
        f.write(content)

    print(json.dumps({'status': 'ok', 'area': args.area, 'action': 'archived', 'reason': args.reason}))


if __name__ == '__main__':
    main()
