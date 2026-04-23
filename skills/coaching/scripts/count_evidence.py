#!/usr/bin/env python3
"""Count evidence entries per development area and calculate trajectories.

Usage:
    python3 count_evidence.py [--window 30]

Window is in days (default 30). Compares current window vs prior window.

Output: JSON with per-area evidence counts and trajectory indicators.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import DEV_AREAS_PATH, SESSION_LOG_PATH

TODAY = datetime.now().date()


def parse_date(date_str: str):
    """Extract and parse a date from a string."""
    match = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
    if match:
        try:
            return datetime.strptime(match.group(1), '%Y-%m-%d').date()
        except ValueError:
            pass
    return None


def parse_development_areas(content: str) -> list[dict]:
    """Parse development areas with evidence and progress entries."""
    areas = []
    current_area = None
    current_field = None

    for line in content.split('\n'):
        stripped = line.strip()

        if stripped.startswith('### ') and not stripped.startswith('####'):
            if current_area:
                areas.append(current_area)
            current_area = {
                'name': stripped[4:].strip(),
                'status': 'active',
                'evidence': [],
                'progress': [],
            }
            current_field = None
            continue

        if current_area is None:
            continue

        if stripped.startswith('**Status:**'):
            current_area['status'] = stripped.replace('**Status:**', '').strip()
        elif stripped.startswith('**Evidence:**'):
            current_field = 'evidence'
        elif stripped.startswith('**Progress:**'):
            current_field = 'progress'
        elif stripped.startswith('**Current practice:**') or stripped.startswith('**First identified:**'):
            current_field = None
        elif stripped.startswith('- ') and current_field:
            entry = stripped[2:].strip()
            date = parse_date(entry)
            current_area[current_field].append({
                'text': entry,
                'date': date.isoformat() if date else None,
                'date_obj': date,
            })

    if current_area:
        areas.append(current_area)

    return areas


def count_sessions_mentioning_area(session_log_content: str, area_name: str) -> int:
    """Count how many session log entries mention this area."""
    count = 0
    area_lower = area_name.lower()
    # Split by session entries
    sessions = re.split(r'^## ', session_log_content, flags=re.MULTILINE)
    for session in sessions:
        if area_lower in session.lower():
            count += 1
    return count


def calculate_trajectory(current_count: int, prior_count: int) -> str:
    """Calculate trajectory symbol based on evidence frequency delta.

    Returns: ↑ (improving), ↗ (slight improvement), → (flat), ↘ (slight decline), ↓ (declining)
    """
    if current_count == 0 and prior_count == 0:
        return '—'  # no data

    if prior_count == 0:
        if current_count >= 2:
            return '↑'
        return '↗'

    ratio = current_count / prior_count

    if ratio >= 1.5:
        return '↑'
    elif ratio >= 1.1:
        return '↗'
    elif ratio >= 0.9:
        return '→'
    elif ratio >= 0.5:
        return '↘'
    else:
        return '↓'


def main():
    parser = argparse.ArgumentParser(description='Count evidence per development area')
    parser.add_argument('--window', type=int, default=30, help='Time window in days')
    args = parser.parse_args()

    if not os.path.exists(DEV_AREAS_PATH):
        print(json.dumps({'error': 'development-areas.md not found'}))
        sys.exit(1)

    with open(DEV_AREAS_PATH, 'r') as f:
        dev_content = f.read()

    session_content = ''
    if os.path.exists(SESSION_LOG_PATH):
        with open(SESSION_LOG_PATH, 'r') as f:
            session_content = f.read()

    areas = parse_development_areas(dev_content)
    window_start = TODAY - timedelta(days=args.window)
    prior_window_start = window_start - timedelta(days=args.window)

    results = []

    for area in areas:
        if area['status'] == 'archived':
            continue

        all_entries = area['evidence'] + area['progress']
        dated_entries = [e for e in all_entries if e['date_obj'] is not None]

        # Count entries in current window vs prior window
        current_window = [e for e in dated_entries if e['date_obj'] and e['date_obj'] >= window_start]
        prior_window = [e for e in dated_entries if e['date_obj'] and prior_window_start <= e['date_obj'] < window_start]

        # Find most recent entry
        dates = [e['date_obj'] for e in dated_entries if e['date_obj']]
        most_recent = max(dates).isoformat() if dates else None
        days_since_last = (TODAY - max(dates)).days if dates else None

        # Count sessions mentioning this area
        session_mentions = count_sessions_mentioning_area(session_content, area['name'])

        trajectory = calculate_trajectory(len(current_window), len(prior_window))

        results.append({
            'name': area['name'],
            'status': area['status'],
            'total_evidence': len(area['evidence']),
            'total_progress': len(area['progress']),
            'current_window_count': len(current_window),
            'prior_window_count': len(prior_window),
            'trajectory': trajectory,
            'most_recent_date': most_recent,
            'days_since_last_evidence': days_since_last,
            'session_mentions': session_mentions,
        })

    output = {
        'today': TODAY.isoformat(),
        'window_days': args.window,
        'window_start': window_start.isoformat(),
        'prior_window_start': prior_window_start.isoformat(),
        'areas': results,
    }

    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
