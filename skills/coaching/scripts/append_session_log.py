#!/usr/bin/env python3
"""Append a session entry to session-log.md with automatic rotation.

Usage:
    python3 append_session_log.py --date "2026-03-28" --type "transcript" \
        --topic "Manager 1:1" --insight "Key insight here" \
        --areas "Area1, Area2" --practice "Practice to try"

Keeps last 20 full entries. Older entries are collapsed to single-line summaries.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import SESSION_LOG_PATH

MAX_FULL_ENTRIES = 20


def parse_sessions(content: str) -> tuple[str, list[dict]]:
    """Parse session log into header and list of session blocks.

    Returns (header_text, list_of_sessions).
    Each session is {header: str, body: str, is_summary: bool}.
    """
    lines = content.split('\n')
    header_lines = []
    sessions = []
    current_session = None
    in_header = True

    for line in lines:
        # Detect session entry (## header)
        if line.startswith('## ') and not line.startswith('###'):
            in_header = False
            if current_session:
                sessions.append(current_session)
            current_session = {
                'header': line,
                'body_lines': [],
                'is_summary': False,
            }
            continue

        # Detect collapsed summary line (starts with "- " at top level after header section)
        if not in_header and current_session is None and line.startswith('- '):
            sessions.append({
                'header': line,
                'body_lines': [],
                'is_summary': True,
            })
            continue

        if in_header:
            header_lines.append(line)
        elif current_session:
            current_session['body_lines'].append(line)

    if current_session:
        sessions.append(current_session)

    header = '\n'.join(header_lines)
    return header, sessions


def session_to_text(session: dict) -> str:
    """Convert a session dict back to text."""
    if session['is_summary']:
        return session['header']
    parts = [session['header']]
    parts.extend(session['body_lines'])
    return '\n'.join(parts)


def collapse_session(session: dict) -> str:
    """Collapse a full session entry into a single summary line."""
    # Extract date, type, topic from header
    header = session['header']
    # Remove "## " prefix
    header_text = header[3:].strip() if header.startswith('## ') else header.strip()

    # Try to extract key insight
    insight = ''
    for line in session['body_lines']:
        if line.strip().startswith('**Key insight:**'):
            insight = line.strip().replace('**Key insight:**', '').strip()
            break

    if insight:
        return f'- {header_text} — {insight}'
    return f'- {header_text}'


def main():
    parser = argparse.ArgumentParser(description='Append coaching session log entry')
    parser.add_argument('--date', required=True, help='Session date (YYYY-MM-DD)')
    parser.add_argument('--type', required=True, help='Session type (transcript/situation/review/debrief/periodic)')
    parser.add_argument('--topic', required=True, help='Brief topic description')
    parser.add_argument('--insight', required=True, help='Key insight (1 sentence)')
    parser.add_argument('--areas', default='', help='Development areas touched (comma-separated)')
    parser.add_argument('--practice', default='', help='Practice assigned')
    args = parser.parse_args()

    # Build new entry
    type_label = args.type.capitalize()
    new_entry_lines = [
        f'## {args.date} — {type_label} — {args.topic}',
        f'**Key insight:** {args.insight}',
        f'**Areas touched:** {args.areas}',
        f'**Practice assigned:** {args.practice if args.practice else "None"}',
        '',
    ]
    new_entry_text = '\n'.join(new_entry_lines)

    # Read existing log
    if os.path.exists(SESSION_LOG_PATH):
        with open(SESSION_LOG_PATH, 'r') as f:
            content = f.read()
    else:
        content = '# Session Log\n\n[Entries are added after each coaching session, newest first.]\n'

    header, sessions = parse_sessions(content)

    # Separate full entries from summaries
    full_sessions = [s for s in sessions if not s['is_summary']]
    summary_sessions = [s for s in sessions if s['is_summary']]

    # If we already have MAX_FULL_ENTRIES, collapse the oldest
    while len(full_sessions) >= MAX_FULL_ENTRIES:
        oldest = full_sessions.pop()  # Remove oldest (last in list, since newest first)
        summary_line = collapse_session(oldest)
        summary_sessions.insert(0, {
            'header': summary_line,
            'body_lines': [],
            'is_summary': True,
        })

    # Rebuild the file: header + new entry + existing full entries + summaries
    parts = [header.rstrip()]
    parts.append('')
    parts.append(new_entry_text)

    for session in full_sessions:
        parts.append(session_to_text(session))

    if summary_sessions:
        parts.append('')
        parts.append('---')
        parts.append('### Collapsed History')
        for s in summary_sessions:
            parts.append(s['header'])

    output = '\n'.join(parts) + '\n'

    with open(SESSION_LOG_PATH, 'w') as f:
        f.write(output)

    print(json.dumps({
        'status': 'ok',
        'total_full_entries': len(full_sessions) + 1,  # +1 for the new entry
        'total_collapsed': len(summary_sessions),
        'rotated': len(full_sessions) >= MAX_FULL_ENTRIES - 1,
    }))


if __name__ == '__main__':
    main()
