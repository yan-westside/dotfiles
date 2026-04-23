#!/usr/bin/env python3
"""Add a new project to the project portfolio.

Usage:
    python3 add_project.py --name "Project Name" --quarter "Q2 2026" \
        --slot "Own #1" --areas "Area1, Area2" --target "Expected outcome"

    python3 add_project.py --name "Delegated Project" --quarter "Q2 2026" \
        --status delegated --delegated-to "Person" --reason "Why delegated"
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import PROJECTS_PATH

VALID_STATUSES = {'planned', 'active', 'delegated', 'advise', 'shipped', 'cut'}
SECTION_MAP = {
    'planned': 'Active',
    'active': 'Active',
    'delegated': 'Delegated / Advised',
    'advise': 'Delegated / Advised',
    'shipped': 'Shipped',
    'cut': 'Cut',
}


def find_section_end(content: str, section_name: str) -> int:
    """Find the insert position at the end of a section (before next ## or EOF)."""
    pattern = rf'^## {re.escape(section_name)}$'
    match = re.search(pattern, content, re.MULTILINE)
    if not match:
        return len(content)

    rest = content[match.end():]
    next_section = re.search(r'^## ', rest, re.MULTILINE)
    if next_section:
        return match.end() + next_section.start()
    return len(content)


def main():
    parser = argparse.ArgumentParser(description='Add a project to the portfolio')
    parser.add_argument('--name', required=True, help='Project name')
    parser.add_argument('--quarter', required=True, help='Quarter (e.g., Q2 2026)')
    parser.add_argument('--status', default='active', help='Status: planned, active, delegated, advise')
    parser.add_argument('--slot', default='', help='Portfolio slot (e.g., Own #1)')
    parser.add_argument('--areas', default='', help='Comma-separated development areas this project targets')
    parser.add_argument('--target', default='', help='Target outcome description')
    parser.add_argument('--delegated-to', default='', help='Person/team delegated to')
    parser.add_argument('--reason', default='', help='Reason for delegation/advise/cut')
    parser.add_argument('--directory', default='', help='Workspace directory for this project (relative to personal workspace)')
    args = parser.parse_args()

    if args.status not in VALID_STATUSES:
        print(json.dumps({'error': f'Invalid status: {args.status}. Must be one of: {", ".join(sorted(VALID_STATUSES))}'}))
        sys.exit(1)

    if not os.path.exists(PROJECTS_PATH):
        with open(PROJECTS_PATH, 'w') as f:
            f.write('# Project Portfolio\n\n## Active\n\n## Delegated / Advised\n\n## Shipped\n\n## Cut\n')

    with open(PROJECTS_PATH, 'r') as f:
        content = f.read()

    if f'### {args.name}' in content:
        print(json.dumps({'error': f'Project already exists: {args.name}'}))
        sys.exit(1)

    section = SECTION_MAP.get(args.status, 'Active')

    if args.status in ('active', 'planned'):
        entry = f'\n### {args.name}\n'
        entry += f'**Status:** {args.status}\n'
        entry += f'**Quarter:** {args.quarter}\n'
        if args.slot:
            entry += f'**Portfolio Slot:** {args.slot}\n'
        if args.areas:
            entry += f'**Development Areas:** {args.areas}\n'
        if args.directory:
            entry += f'**Directory:** {args.directory}\n'
        if args.target:
            entry += f'**Target Outcome:** {args.target}\n'
        entry += '**Growth Evidence:**\n\n'
        entry += '**Impact:**\n\n'
    elif args.status in ('delegated', 'advise'):
        entry = f'\n### {args.name}\n'
        entry += f'**Status:** {args.status}\n'
        entry += f'**Quarter:** {args.quarter}\n'
        if args.delegated_to:
            entry += f'**Delegated to:** {args.delegated_to}\n'
        if args.reason:
            entry += f'**Reason:** {args.reason}\n'
        entry += '\n'
    else:
        entry = f'\n### {args.name}\n'
        entry += f'**Status:** {args.status}\n'
        entry += f'**Quarter:** {args.quarter}\n'
        if args.reason:
            entry += f'**Reason:** {args.reason}\n'
        entry += '\n'

    insert_pos = find_section_end(content, section)
    content = content[:insert_pos].rstrip() + '\n' + entry + content[insert_pos:]

    with open(PROJECTS_PATH, 'w') as f:
        f.write(content)

    print(json.dumps({'status': 'ok', 'project': args.name, 'section': section}))


if __name__ == '__main__':
    main()
