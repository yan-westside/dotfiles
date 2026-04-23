#!/usr/bin/env python3
"""Generate structured context for 1:1 prep from coaching state.

Usage:
    python3 generate_prep.py

Output: JSON with active projects, development areas, last practice,
recent evidence, and coaching question for AI to build a prep doc from.
"""

import json
import os
import re
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import INDEX_PATH, DEV_AREAS_PATH, SESSION_LOG_PATH, PROJECTS_PATH

TODAY = datetime.now().date()
WINDOW = timedelta(days=30)


def extract_field(content: str, field: str) -> str:
    pattern = re.compile(rf'^-\s+\*\*{re.escape(field)}:\*\*\s*(.+)$', re.MULTILINE)
    match = pattern.search(content)
    return match.group(1).strip() if match else ''


def extract_section_items(content: str, section: str) -> list[str]:
    pattern = re.compile(rf'^## {re.escape(section)}\s*$(.*?)(?=^## |\Z)', re.MULTILINE | re.DOTALL)
    match = pattern.search(content)
    if not match:
        return []
    items = []
    for line in match.group(1).strip().split('\n'):
        stripped = line.strip()
        if stripped.startswith('- ') and stripped != '- [bootstrapped memory file links, if any]':
            items.append(stripped[2:])
    return items


def parse_recent_evidence(content: str) -> list[dict]:
    """Extract development areas with their most recent evidence."""
    areas = []
    current = None
    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('### ') and not stripped.startswith('####'):
            if current:
                areas.append(current)
            current = {'name': stripped[4:].strip(), 'status': 'active', 'recent_evidence': [], 'practice': ''}
        elif current:
            if stripped.startswith('**Status:**'):
                current['status'] = stripped.split('**Status:**')[1].strip()
            elif stripped.startswith('**Current practice:**'):
                current['practice'] = stripped.split('**Current practice:**')[1].strip()
            elif stripped.startswith('- ') and re.match(r'^- \d{4}-\d{2}-\d{2}:', stripped):
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', stripped)
                if date_match:
                    try:
                        d = datetime.strptime(date_match.group(1), '%Y-%m-%d').date()
                        if d >= TODAY - WINDOW:
                            current['recent_evidence'].append(stripped[2:])
                    except ValueError:
                        pass
    if current:
        areas.append(current)
    return [a for a in areas if a['status'] == 'active']


def parse_active_projects(content: str) -> list[dict]:
    """Extract active projects with growth evidence."""
    projects = []
    current = None
    current_field = None
    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('### '):
            if current and current.get('status') in ('active', 'planned'):
                projects.append(current)
            current = {'name': stripped[4:].strip(), 'status': 'active', 'areas': '', 'target': '', 'growth': []}
            current_field = None
        elif current:
            if stripped.startswith('**Status:**'):
                current['status'] = stripped.split('**Status:**')[1].strip()
            elif stripped.startswith('**Development Areas:**'):
                current['areas'] = stripped.split('**Development Areas:**')[1].strip()
            elif stripped.startswith('**Target Outcome:**'):
                current['target'] = stripped.split('**Target Outcome:**')[1].strip()
            elif stripped.startswith('**Growth Evidence:**'):
                current_field = 'growth'
            elif stripped.startswith('**') and current_field == 'growth':
                current_field = None
            elif stripped.startswith('- ') and current_field == 'growth':
                current['growth'].append(stripped[2:])
    if current and current.get('status') in ('active', 'planned'):
        projects.append(current)
    return projects


def get_last_practice(content: str) -> dict | None:
    blocks = re.split(r'^(?=## \d{4}-\d{2}-\d{2})', content, flags=re.MULTILINE)
    for block in blocks:
        header = re.match(r'^## (\d{4}-\d{2}-\d{2}) — (\w+) — (.+)$', block, re.MULTILINE)
        if not header:
            continue
        practice_match = re.search(r'\*\*Practice(?:\s+assigned)?:\*\*\s*(.+)', block)
        if practice_match and practice_match.group(1).strip():
            return {'date': header.group(1), 'practice': practice_match.group(1).strip()}
    return None


def main():
    result = {'status': 'ok'}

    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH) as f:
            idx = f.read()
        ccq_match = re.search(r'^>\s*(.+)$', idx, re.MULTILINE)
        result['core_question'] = ccq_match.group(1).strip() if ccq_match else ''
        result['challenges'] = extract_section_items(idx, 'Current Challenges')
        result['focus_areas'] = extract_section_items(idx, 'Active Focus Areas')
    else:
        result['core_question'] = ''
        result['challenges'] = []
        result['focus_areas'] = []

    if os.path.exists(DEV_AREAS_PATH):
        with open(DEV_AREAS_PATH) as f:
            result['development_areas'] = parse_recent_evidence(f.read())
    else:
        result['development_areas'] = []

    if os.path.exists(PROJECTS_PATH):
        with open(PROJECTS_PATH) as f:
            result['active_projects'] = parse_active_projects(f.read())
    else:
        result['active_projects'] = []

    if os.path.exists(SESSION_LOG_PATH):
        with open(SESSION_LOG_PATH) as f:
            result['last_practice'] = get_last_practice(f.read())
    else:
        result['last_practice'] = None

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
