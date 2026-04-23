#!/usr/bin/env python3
"""Update a project in the portfolio: add growth evidence, log impact, change status.

Usage:
    # Add growth evidence
    python3 update_project.py --name "Project Name" --growth "2026-04-15: Presented recommendation to VP, defended POV on market allocation"

    # Log impact (when shipped)
    python3 update_project.py --name "Project Name" --impact "Analysis changed how $2M in pay was allocated across 5 markets"

    # Change status
    python3 update_project.py --name "Project Name" --status shipped

    # Add reason (for cut/delegated)
    python3 update_project.py --name "Project Name" --status cut --reason "Deprioritized in favor of higher-leverage work"
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import PROJECTS_PATH

TODAY = datetime.now().strftime('%Y-%m-%d')
VALID_STATUSES = {'planned', 'active', 'delegated', 'advise', 'shipped', 'cut'}
SECTION_MAP = {
    'planned': 'Active',
    'active': 'Active',
    'delegated': 'Delegated / Advised',
    'advise': 'Delegated / Advised',
    'shipped': 'Shipped',
    'cut': 'Cut',
}


def extract_project_block(content: str, name: str) -> tuple[int, int, str] | None:
    """Find a project block by name. Returns (start, end, block_text) or None."""
    pattern = re.compile(
        rf'^### {re.escape(name)}\s*$',
        re.MULTILINE | re.IGNORECASE,
    )
    match = pattern.search(content)
    if not match:
        return None

    start = match.start()
    rest = content[match.end():]

    next_header = re.search(r'^### ', rest, re.MULTILINE)
    next_section = re.search(r'^## ', rest, re.MULTILINE)

    if next_header and next_section:
        end_offset = min(next_header.start(), next_section.start())
    elif next_header:
        end_offset = next_header.start()
    elif next_section:
        end_offset = next_section.start()
    else:
        end_offset = len(rest)

    end = match.end() + end_offset
    return start, end, content[start:end]


def add_growth_evidence(block: str, evidence: str) -> str:
    """Append a growth evidence entry."""
    marker = '**Growth Evidence:**'
    if marker not in block:
        block = block.rstrip() + f'\n{marker}\n- {evidence}\n\n'
        return block

    idx = block.index(marker) + len(marker)
    rest = block[idx:]

    next_field = re.search(r'^\*\*[A-Z]', rest, re.MULTILINE)
    if next_field:
        insert_at = idx + next_field.start()
        block = block[:insert_at].rstrip() + f'\n- {evidence}\n\n' + block[insert_at:]
    else:
        block = block.rstrip() + f'\n- {evidence}\n\n'

    return block


def set_impact(block: str, impact: str) -> str:
    """Set or replace the impact line."""
    pattern = r'\*\*Impact:\*\*.*'
    if re.search(pattern, block):
        return re.sub(pattern, f'**Impact:** {impact}', block)
    block = block.rstrip() + f'\n**Impact:** {impact}\n\n'
    return block


def set_status(block: str, new_status: str) -> str:
    """Update the status field."""
    return re.sub(r'\*\*Status:\*\*\s*\w+', f'**Status:** {new_status}', block)


def move_to_section(content: str, block: str, old_start: int, old_end: int, target_section: str) -> str:
    """Remove block from current position and append to target section."""
    content_without = content[:old_start] + content[old_end:]

    section_pattern = rf'^## {re.escape(target_section)}$'
    match = re.search(section_pattern, content_without, re.MULTILINE)
    if not match:
        content_without = content_without.rstrip() + f'\n\n## {target_section}\n'
        match = re.search(section_pattern, content_without, re.MULTILINE)

    rest = content_without[match.end():]
    next_section = re.search(r'^## ', rest, re.MULTILINE)
    if next_section:
        insert_pos = match.end() + next_section.start()
    else:
        insert_pos = len(content_without)

    content_without = content_without[:insert_pos].rstrip() + '\n' + block + content_without[insert_pos:]
    return content_without


def main():
    parser = argparse.ArgumentParser(description='Update a project in the portfolio')
    parser.add_argument('--name', required=True, help='Project name (case-insensitive match)')
    parser.add_argument('--growth', help='Growth evidence entry (will be appended)')
    parser.add_argument('--impact', help='Impact statement (set or replace)')
    parser.add_argument('--status', help='New status')
    parser.add_argument('--reason', help='Reason (for cut/delegated status changes)')
    parser.add_argument('--directory', help='Set workspace directory for this project')
    args = parser.parse_args()

    if not os.path.exists(PROJECTS_PATH):
        print(json.dumps({'error': 'projects.md not found'}))
        sys.exit(1)

    with open(PROJECTS_PATH, 'r') as f:
        content = f.read()

    result = extract_project_block(content, args.name)
    if not result:
        print(json.dumps({'error': f'Project not found: {args.name}'}))
        sys.exit(1)

    start, end, block = result
    updates = []
    needs_move = False
    target_section = None

    if args.directory:
        if '**Directory:**' in block:
            block = re.sub(r'\*\*Directory:\*\*.*', f'**Directory:** {args.directory}', block)
        else:
            block = re.sub(r'(\*\*Target Outcome:\*\*.*\n)', f'\\1**Directory:** {args.directory}\n', block)
            if f'**Directory:** {args.directory}' not in block:
                block = re.sub(r'(\*\*Development Areas:\*\*.*\n)', f'\\1**Directory:** {args.directory}\n', block)
        updates.append(f'directory={args.directory}')

    if args.growth:
        block = add_growth_evidence(block, args.growth)
        updates.append('growth_evidence')

    if args.impact:
        block = set_impact(block, args.impact)
        updates.append('impact')

    if args.status:
        if args.status not in VALID_STATUSES:
            print(json.dumps({'error': f'Invalid status: {args.status}'}))
            sys.exit(1)

        old_status_match = re.search(r'\*\*Status:\*\*\s*(\w+)', block)
        old_status = old_status_match.group(1) if old_status_match else 'unknown'

        block = set_status(block, args.status)
        updates.append(f'status={args.status}')

        if args.reason:
            if '**Reason:**' in block:
                block = re.sub(r'\*\*Reason:\*\*.*', f'**Reason:** {args.reason}', block)
            else:
                block = block.rstrip() + f'\n**Reason:** {args.reason}\n\n'

        old_section = SECTION_MAP.get(old_status, 'Active')
        new_section = SECTION_MAP.get(args.status, 'Active')
        if old_section != new_section:
            needs_move = True
            target_section = new_section

    if needs_move:
        content = move_to_section(content, block, start, end, target_section)
    else:
        content = content[:start] + block + content[end:]

    with open(PROJECTS_PATH, 'w') as f:
        f.write(content)

    print(json.dumps({'status': 'ok', 'project': args.name, 'updates': updates}))


if __name__ == '__main__':
    main()
