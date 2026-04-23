#!/usr/bin/env python3
"""Detect stale development areas, vision, and challenges.

Usage:
    python3 detect_stale.py [--area-threshold 14] [--vision-threshold 60] [--challenge-threshold 30]

Thresholds are in days. Defaults: areas=14, vision=60, challenges=30.

Output: JSON with stale items and days since last activity.
"""

import argparse
import json
import os
import re
import sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import INDEX_PATH, DEV_AREAS_PATH

TODAY = date.today()

# Common date formats to try
DATE_FORMATS = [
    '%Y-%m-%d',
    '%m/%d/%Y',
    '%B %d, %Y',
    '%b %d, %Y',
    '%Y-%m-%dT%H:%M:%S',
]


def parse_date(date_str: str) -> date | None:
    """Try multiple date formats to parse a date string."""
    date_str = date_str.strip().split(' — ')[0].strip()  # Handle "2026-03-28 — source" format
    date_str = date_str.split(':')[0].strip() if re.match(r'\d{4}-\d{2}-\d{2}', date_str) else date_str

    # Extract date-like pattern from string
    match = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
    if match:
        date_str = match.group(1)

    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def extract_dates_from_evidence(entries: list[str]) -> list[date]:
    """Extract dates from evidence/progress entries like '- 2026-03-28: observation'."""
    dates = []
    for entry in entries:
        date = parse_date(entry)
        if date:
            dates.append(date)
    return dates


def parse_development_areas(content: str) -> list[dict]:
    """Parse development areas with their dates."""
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
                'evidence_entries': [],
                'progress_entries': [],
            }
            current_field = None
            continue

        if current_area is None:
            continue

        if stripped.startswith('**Status:**'):
            current_area['status'] = stripped.replace('**Status:**', '').strip()
        elif stripped.startswith('**Evidence:**'):
            current_field = 'evidence_entries'
        elif stripped.startswith('**Progress:**'):
            current_field = 'progress_entries'
        elif stripped.startswith('**Current practice:**') or stripped.startswith('**First identified:**'):
            current_field = None
        elif stripped.startswith('- ') and current_field:
            current_area[current_field].append(stripped[2:].strip())

    if current_area:
        areas.append(current_area)

    return areas


def check_stale_areas(areas: list[dict], threshold_days: int) -> list[dict]:
    """Find areas with no evidence in threshold_days."""
    stale = []
    for area in areas:
        if area['status'] != 'active':
            continue

        all_entries = area['evidence_entries'] + area['progress_entries']
        dates = extract_dates_from_evidence(all_entries)

        if not dates:
            stale.append({
                'name': area['name'],
                'days_since_last_evidence': None,
                'reason': 'No dated evidence entries found',
            })
            continue

        most_recent = max(dates)
        days_since = (TODAY - most_recent).days

        if days_since > threshold_days:
            stale.append({
                'name': area['name'],
                'last_evidence_date': most_recent.isoformat(),
                'days_since_last_evidence': days_since,
                'reason': f'No evidence in {days_since} days (threshold: {threshold_days})',
            })

    return stale


def check_stale_vision(index_content: str, threshold_days: int) -> dict | None:
    """Check if career vision was reviewed recently."""
    match = re.search(r'\*\*Last reviewed:\*\*\s*(.+?)(?:\n|$)', index_content)
    if not match:
        return {'stale': True, 'reason': 'No last_reviewed date found for career vision'}

    date = parse_date(match.group(1))
    if not date:
        return {'stale': True, 'reason': f'Could not parse vision review date: {match.group(1)}'}

    days_since = (TODAY - date).days
    if days_since > threshold_days:
        return {
            'stale': True,
            'last_reviewed': date.isoformat(),
            'days_since_review': days_since,
            'reason': f'Vision not reviewed in {days_since} days (threshold: {threshold_days})',
        }

    return {'stale': False, 'last_reviewed': date.isoformat(), 'days_since_review': days_since}


def check_stale_challenges(index_content: str, threshold_days: int) -> dict:
    """Check if challenges section was updated recently (based on last session date as proxy)."""
    match = re.search(r'Last session:\s*(.+?)(?:\n|$)', index_content)
    if not match:
        return {'stale': True, 'reason': 'No last session date found'}

    date = parse_date(match.group(1))
    if not date:
        return {'stale': True, 'reason': f'Could not parse last session date: {match.group(1)}'}

    days_since = (TODAY - date).days
    if days_since > threshold_days:
        return {
            'stale': True,
            'last_updated': date.isoformat(),
            'days_since_update': days_since,
            'reason': f'Challenges not updated in {days_since} days (threshold: {threshold_days})',
        }

    return {'stale': False, 'last_updated': date.isoformat(), 'days_since_update': days_since}


def main():
    parser = argparse.ArgumentParser(description='Detect stale coaching items')
    parser.add_argument('--area-threshold', type=int, default=14, help='Days before area is stale')
    parser.add_argument('--vision-threshold', type=int, default=60, help='Days before vision is stale')
    parser.add_argument('--challenge-threshold', type=int, default=30, help='Days before challenges are stale')
    args = parser.parse_args()

    if not os.path.exists(INDEX_PATH):
        print(json.dumps({'error': 'Coaching not initialized'}))
        sys.exit(1)

    with open(INDEX_PATH, 'r') as f:
        index_content = f.read()

    dev_content = ''
    if os.path.exists(DEV_AREAS_PATH):
        with open(DEV_AREAS_PATH, 'r') as f:
            dev_content = f.read()

    areas = parse_development_areas(dev_content)
    stale_areas = check_stale_areas(areas, args.area_threshold)
    vision_status = check_stale_vision(index_content, args.vision_threshold)
    challenge_status = check_stale_challenges(index_content, args.challenge_threshold)

    result = {
        'today': TODAY.isoformat(),
        'thresholds': {
            'area_days': args.area_threshold,
            'vision_days': args.vision_threshold,
            'challenge_days': args.challenge_threshold,
        },
        'stale_areas': stale_areas,
        'vision': vision_status,
        'challenges': challenge_status,
        'summary': {
            'stale_area_count': len(stale_areas),
            'vision_stale': vision_status.get('stale', True) if vision_status else True,
            'challenges_stale': challenge_status.get('stale', True),
        },
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
