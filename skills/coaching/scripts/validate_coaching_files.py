#!/usr/bin/env python3
"""Validate structural integrity of all coaching files.

Usage:
    python3 validate_coaching_files.py

Output: JSON with errors list. Empty errors = valid.
Checks:
- Required fields in each development area
- Valid date formats
- No duplicate area names
- Session log entries have required fields
- Index focus areas reference existing development areas
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import INDEX_PATH, DEV_AREAS_PATH, SESSION_LOG_PATH

DATE_PATTERN = re.compile(r'\d{4}-\d{2}-\d{2}')


def validate_development_areas(content: str) -> tuple[list[str], list[str]]:
    """Validate development-areas.md. Returns (errors, area_names)."""
    errors = []
    area_names = []
    current_area = None
    current_area_line = 0
    has_status = False
    has_first_identified = False
    has_evidence = False
    line_num = 0

    for line in content.split('\n'):
        line_num += 1
        stripped = line.strip()

        if stripped.startswith('### ') and not stripped.startswith('####'):
            # Validate previous area
            if current_area:
                if not has_status:
                    errors.append(f'Area "{current_area}" (line {current_area_line}): missing **Status:** field')
                if not has_first_identified:
                    errors.append(f'Area "{current_area}" (line {current_area_line}): missing **First identified:** field')

            current_area = stripped[4:].strip()
            current_area_line = line_num

            if current_area.lower() in [n.lower() for n in area_names]:
                errors.append(f'Duplicate area name: "{current_area}" (line {line_num})')

            area_names.append(current_area)
            has_status = False
            has_first_identified = False
            has_evidence = False

        elif current_area:
            if stripped.startswith('**Status:**'):
                has_status = True
                status_val = stripped.replace('**Status:**', '').strip()
                if status_val not in ('active', 'watch', 'archived'):
                    errors.append(f'Area "{current_area}": invalid status "{status_val}" (must be active/watch/archived)')
            elif stripped.startswith('**First identified:**'):
                has_first_identified = True
            elif stripped.startswith('**Evidence:**'):
                has_evidence = True

    # Validate last area
    if current_area:
        if not has_status:
            errors.append(f'Area "{current_area}" (line {current_area_line}): missing **Status:** field')
        if not has_first_identified:
            errors.append(f'Area "{current_area}" (line {current_area_line}): missing **First identified:** field')

    return errors, area_names


def validate_session_log(content: str) -> list[str]:
    """Validate session-log.md entries."""
    errors = []
    session_count = 0
    line_num = 0
    in_session = False
    has_insight = False
    has_areas = False
    current_header = ''

    for line in content.split('\n'):
        line_num += 1
        stripped = line.strip()

        if stripped.startswith('## ') and not stripped.startswith('###'):
            # Validate previous session
            if in_session and current_header:
                if not has_insight:
                    errors.append(f'Session "{current_header}" (line ~{line_num}): missing **Key insight:** field')
                if not has_areas:
                    errors.append(f'Session "{current_header}" (line ~{line_num}): missing **Areas touched:** field')

            in_session = True
            session_count += 1
            current_header = stripped[3:].strip()
            has_insight = False
            has_areas = False

            # Check header format: should contain date
            if not DATE_PATTERN.search(current_header):
                errors.append(f'Session header missing date: "{current_header}" (line {line_num})')

        elif in_session:
            if stripped.startswith('**Key insight:**'):
                has_insight = True
            elif stripped.startswith('**Areas touched:**'):
                has_areas = True

    # Validate last session
    if in_session and current_header:
        if not has_insight:
            errors.append(f'Session "{current_header}": missing **Key insight:** field')
        if not has_areas:
            errors.append(f'Session "{current_header}": missing **Areas touched:** field')

    return errors


def validate_index(content: str, area_names: list[str]) -> list[str]:
    """Validate index.md structure."""
    errors = []

    required_sections = [
        '## Identity',
        '## Career Vision',
        '## Current Challenges',
        '## Active Focus Areas',
    ]

    for section in required_sections:
        if section not in content:
            errors.append(f'index.md missing required section: {section}')

    # Check that focus areas reference existing development areas
    in_focus = False
    for line in content.split('\n'):
        stripped = line.strip()

        if stripped == '## Active Focus Areas':
            in_focus = True
            continue
        elif stripped.startswith('## '):
            in_focus = False
            continue

        if in_focus and re.match(r'\d+\.', stripped):
            # Extract area name (before " — ")
            match = re.match(r'\d+\.\s+(.+?)(?:\s+—|$)', stripped)
            if match and area_names:
                focus_name = match.group(1).strip()
                # Fuzzy match: check if any area name is contained in the focus line
                found = any(
                    area.lower() in focus_name.lower() or focus_name.lower() in area.lower()
                    for area in area_names
                )
                if not found:
                    errors.append(f'Focus area "{focus_name}" does not match any development area')

    # Check last session date exists
    if 'Last session:' not in content:
        errors.append('index.md missing "Last session:" field in Identity section')

    return errors


def main():
    all_errors = []

    # Check files exist
    for path, name in [(INDEX_PATH, 'index.md'), (DEV_AREAS_PATH, 'development-areas.md'), (SESSION_LOG_PATH, 'session-log.md')]:
        if not os.path.exists(path):
            all_errors.append(f'Missing file: {name}')

    if all_errors:
        print(json.dumps({'valid': False, 'errors': all_errors}))
        sys.exit(1)

    # Read files
    with open(INDEX_PATH, 'r') as f:
        index_content = f.read()
    with open(DEV_AREAS_PATH, 'r') as f:
        dev_content = f.read()
    with open(SESSION_LOG_PATH, 'r') as f:
        session_content = f.read()

    # Validate each
    dev_errors, area_names = validate_development_areas(dev_content)
    session_errors = validate_session_log(session_content)
    index_errors = validate_index(index_content, area_names)

    all_errors = dev_errors + session_errors + index_errors

    result = {
        'valid': len(all_errors) == 0,
        'errors': all_errors,
        'stats': {
            'development_areas': len(area_names),
            'area_names': area_names,
        },
    }

    print(json.dumps(result, indent=2))

    if all_errors:
        sys.exit(1)


if __name__ == '__main__':
    main()
