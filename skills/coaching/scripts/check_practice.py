#!/usr/bin/env python3
"""Check the last session's assigned practice for accountability follow-up.

Usage:
    python3 check_practice.py

Output: JSON with last practice, days since, and historical completion stats.
"""

import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import SESSION_LOG_PATH

TODAY = datetime.now().date()

PRACTICE_PATTERNS = [
    re.compile(r'^\*\*Practice(?:\s+assigned)?:\*\*\s*(.+)$', re.MULTILINE),
    re.compile(r'^\*\*Practice for next time:\*\*\s*(.+)$', re.MULTILINE | re.IGNORECASE),
]


def find_practice(text: str) -> str | None:
    for pattern in PRACTICE_PATTERNS:
        match = pattern.search(text)
        if match:
            val = match.group(1).strip()
            if val and val not in ('""', "''", 'None', ''):
                return val
    return None


def parse_sessions(content: str) -> list[dict]:
    """Parse session headers and extract practice from each block."""
    blocks = re.split(r'^(?=## \d{4}-\d{2}-\d{2})', content, flags=re.MULTILINE)
    sessions = []
    for block in blocks:
        header = re.match(r'^## (\d{4}-\d{2}-\d{2}) — (\w+) — (.+)$', block, re.MULTILINE)
        if not header:
            continue
        practice = find_practice(block)
        sessions.append({
            'date': header.group(1),
            'type': header.group(2),
            'topic': header.group(3).strip(),
            'practice': practice,
        })
    return sessions


def main():
    if not os.path.exists(SESSION_LOG_PATH):
        print(json.dumps({'status': 'no_sessions'}))
        return

    with open(SESSION_LOG_PATH, 'r') as f:
        content = f.read()

    sessions = parse_sessions(content)
    if not sessions:
        print(json.dumps({'status': 'no_sessions'}))
        return

    last = sessions[0]
    try:
        last_date = datetime.strptime(last['date'], '%Y-%m-%d').date()
        days_since = (TODAY - last_date).days
    except ValueError:
        days_since = -1

    total_with_practice = sum(1 for s in sessions if s['practice'])
    total_sessions = len(sessions)

    if not last['practice']:
        print(json.dumps({
            'status': 'no_practice',
            'last_session_date': last['date'],
            'last_session_type': last['type'],
            'last_session_topic': last['topic'],
            'days_since': days_since,
            'stats': {'total_sessions': total_sessions, 'sessions_with_practice': total_with_practice},
        }))
        return

    print(json.dumps({
        'status': 'has_practice',
        'last_session_date': last['date'],
        'last_session_type': last['type'],
        'last_session_topic': last['topic'],
        'practice': last['practice'],
        'days_since': days_since,
        'stats': {'total_sessions': total_sessions, 'sessions_with_practice': total_with_practice},
    }))


if __name__ == '__main__':
    main()
