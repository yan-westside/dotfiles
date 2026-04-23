#!/usr/bin/env python3
"""Analyze project portfolio health against development areas.

Usage:
    python3 project_health.py [--window 30]

Output: JSON with per-project health, development area coverage, portfolio cap status,
and staleness alerts.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import PROJECTS_PATH, DEV_AREAS_PATH

TODAY = datetime.now().date()


def parse_date(text: str):
    """Extract a date from a string."""
    match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if match:
        try:
            return datetime.strptime(match.group(1), '%Y-%m-%d').date()
        except ValueError:
            pass
    return None


def parse_projects(content: str) -> list[dict]:
    """Parse projects.md into structured project list."""
    projects = []
    current = None
    current_field = None

    for line in content.split('\n'):
        stripped = line.strip()

        if stripped.startswith('### ') and not stripped.startswith('####'):
            if current:
                projects.append(current)
            current = {
                'name': stripped[4:].strip(),
                'status': 'active',
                'quarter': '',
                'slot': '',
                'areas': [],
                'directory': '',
                'target': '',
                'growth_evidence': [],
                'impact': '',
                'delegated_to': '',
                'reason': '',
            }
            current_field = None
            continue

        if current is None:
            continue

        if stripped.startswith('**Status:**'):
            current['status'] = stripped.split('**Status:**')[1].strip().lower()
            current_field = None
        elif stripped.startswith('**Quarter:**'):
            current['quarter'] = stripped.split('**Quarter:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Portfolio Slot:**'):
            current['slot'] = stripped.split('**Portfolio Slot:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Development Areas:**'):
            areas_str = stripped.split('**Development Areas:**')[1].strip()
            current['areas'] = [a.strip() for a in areas_str.split(',') if a.strip()]
            current_field = None
        elif stripped.startswith('**Directory:**'):
            current['directory'] = stripped.split('**Directory:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Target Outcome:**'):
            current['target'] = stripped.split('**Target Outcome:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Growth Evidence:**'):
            current_field = 'growth_evidence'
        elif stripped.startswith('**Impact:**'):
            current['impact'] = stripped.split('**Impact:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Delegated to:**'):
            current['delegated_to'] = stripped.split('**Delegated to:**')[1].strip()
            current_field = None
        elif stripped.startswith('**Reason:**'):
            current['reason'] = stripped.split('**Reason:**')[1].strip()
            current_field = None
        elif stripped.startswith('- ') and current_field == 'growth_evidence':
            current['growth_evidence'].append(stripped[2:])

    if current:
        projects.append(current)

    return projects


def parse_active_dev_areas(content: str) -> list[str]:
    """Extract names of active development areas."""
    areas = []
    current_name = None
    current_status = None

    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('### ') and not stripped.startswith('####'):
            if current_name and current_status in ('active', None):
                areas.append(current_name)
            current_name = stripped[4:].strip()
            current_status = None
        elif stripped.startswith('**Status:**'):
            current_status = stripped.split('**Status:**')[1].strip().lower()

    if current_name and current_status in ('active', None):
        areas.append(current_name)

    return areas


def main():
    parser = argparse.ArgumentParser(description='Analyze project portfolio health')
    parser.add_argument('--window', type=int, default=30, help='Window in days for recent evidence (default: 30)')
    args = parser.parse_args()

    if not os.path.exists(PROJECTS_PATH):
        print(json.dumps({'error': 'projects.md not found'}))
        sys.exit(1)

    with open(PROJECTS_PATH, 'r') as f:
        projects_content = f.read()

    dev_areas = []
    if os.path.exists(DEV_AREAS_PATH):
        with open(DEV_AREAS_PATH, 'r') as f:
            dev_areas = parse_active_dev_areas(f.read())

    projects = parse_projects(projects_content)
    window_start = TODAY - timedelta(days=args.window)

    owned = [p for p in projects if p['status'] in ('active', 'planned') and p.get('slot', '').startswith('Own')]
    active_projects = [p for p in projects if p['status'] in ('active', 'planned')]

    project_health = []
    for p in active_projects:
        total_evidence = len(p['growth_evidence'])
        recent_evidence = 0
        last_date = None

        for entry in p['growth_evidence']:
            d = parse_date(entry)
            if d:
                if last_date is None or d > last_date:
                    last_date = d
                if d >= window_start:
                    recent_evidence += 1

        if total_evidence == 0:
            health = 'no_evidence'
        elif recent_evidence == 0:
            health = 'stale'
        elif recent_evidence >= 2:
            health = 'growing'
        else:
            health = 'on_track'

        project_health.append({
            'name': p['name'],
            'status': p['status'],
            'slot': p.get('slot', ''),
            'areas': p['areas'],
            'directory': p.get('directory', ''),
            'total_evidence': total_evidence,
            'recent_evidence': recent_evidence,
            'last_activity': str(last_date) if last_date else None,
            'has_impact': bool(p['impact']),
            'health': health,
        })

    area_coverage = {}
    for area in dev_areas:
        covering_projects = []
        total_evidence = 0
        for p in active_projects:
            if area in p['areas']:
                covering_projects.append(p['name'])
                total_evidence += len(p['growth_evidence'])

        area_coverage[area] = {
            'projects': covering_projects,
            'project_count': len(covering_projects),
            'total_evidence': total_evidence,
            'covered': len(covering_projects) > 0,
        }

    uncovered_areas = [a for a, c in area_coverage.items() if not c['covered']]

    alerts = []
    for ph in project_health:
        if ph['health'] == 'no_evidence':
            alerts.append(f'{ph["name"]}: no growth evidence logged yet')
        elif ph['health'] == 'stale':
            alerts.append(f'{ph["name"]}: no growth evidence in the last {args.window} days')

    if len(owned) > 3:
        alerts.append(f'Portfolio Cap exceeded: {len(owned)} owned projects (max 3)')

    for area in uncovered_areas:
        alerts.append(f'Development area "{area}" has no active project targeting it')

    result = {
        'portfolio_cap': {
            'owned': len(owned),
            'limit': 3,
            'status': 'ok' if len(owned) <= 3 else 'over_limit',
        },
        'projects': project_health,
        'area_coverage': area_coverage,
        'uncovered_areas': uncovered_areas,
        'alerts': alerts,
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
