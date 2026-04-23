#!/usr/bin/env python3
"""Load all coaching files and return structured JSON.

Usage:
    python3 load_coaching_state.py

Output: JSON with profile, development_areas, session_log, metadata.
Returns {"status": "not_initialized"} if coaching directory doesn't exist.
"""

import json
import os
import re
import sys

# Allow running from any directory by adding script dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import COACHING_DIR, INDEX_PATH, DEV_AREAS_PATH, SESSION_LOG_PATH, PROJECTS_PATH


def parse_index(content: str) -> dict:
    """Parse index.md into structured data."""
    profile = {
        'identity': {},
        'career_vision': {},
        'current_challenges': [],
        'strengths': [],
        'gaps': [],
        'recent_wins': [],
        'active_focus_areas': [],
        'related_memory': [],
    }

    current_section = None
    lines = content.split('\n')

    for line in lines:
        stripped = line.strip()

        # Detect sections
        if stripped.startswith('## '):
            section_name = stripped[3:].strip().lower()
            if 'identity' in section_name:
                current_section = 'identity'
            elif 'career vision' in section_name:
                current_section = 'career_vision'
            elif 'current challenges' in section_name:
                current_section = 'current_challenges'
            elif 'strengths' in section_name:
                current_section = 'strengths'
            elif 'gaps' in section_name:
                current_section = 'gaps'
            elif 'recent wins' in section_name:
                current_section = 'recent_wins'
            elif 'active focus' in section_name:
                current_section = 'active_focus_areas'
            elif 'related memory' in section_name:
                current_section = 'related_memory'
            elif 'files' in section_name:
                current_section = 'files'
            else:
                current_section = None
            continue

        if not stripped or stripped.startswith('#'):
            continue

        # Parse based on current section
        if current_section == 'identity' and stripped.startswith('- '):
            match = re.match(r'-\s+(.+?):\s*(.+)', stripped)
            if match:
                key = match.group(1).strip().lower().replace(' ', '_')
                value = match.group(2).strip()
                profile['identity'][key] = value

        elif current_section == 'career_vision' and stripped.startswith('- '):
            match = re.match(r'-\s+\*\*(.+?):\*\*\s*(.+)', stripped)
            if match:
                key = match.group(1).strip().lower().replace(' ', '_').replace('-', '_')
                value = match.group(2).strip()
                profile['career_vision'][key] = value

        elif current_section == 'current_challenges' and stripped.startswith('- '):
            profile['current_challenges'].append(stripped[2:].strip())

        elif current_section == 'strengths' and stripped.startswith('- '):
            profile['strengths'].append(stripped[2:].strip())

        elif current_section == 'gaps' and stripped.startswith('- '):
            if not stripped.startswith('- Linked'):
                profile['gaps'].append(stripped[2:].strip())

        elif current_section == 'recent_wins' and stripped.startswith('- '):
            profile['recent_wins'].append(stripped[2:].strip())

        elif current_section == 'active_focus_areas' and re.match(r'\d+\.', stripped):
            match = re.match(r'\d+\.\s+(.+)', stripped)
            if match:
                profile['active_focus_areas'].append(match.group(1).strip())

        elif current_section == 'related_memory' and stripped.startswith('- '):
            profile['related_memory'].append(stripped[2:].strip())

    return profile


def parse_development_areas(content: str) -> list:
    """Parse development-areas.md into a list of area objects."""
    areas = []
    current_area = None

    lines = content.split('\n')
    current_field = None

    for line in lines:
        stripped = line.strip()

        # New area starts with ###
        if stripped.startswith('### ') and not stripped.startswith('####'):
            if current_area:
                areas.append(current_area)
            current_area = {
                'name': stripped[4:].strip(),
                'status': 'active',
                'first_identified': '',
                'evidence': [],
                'progress': [],
                'current_practice': '',
            }
            current_field = None
            continue

        if current_area is None:
            continue

        # Parse fields within an area
        if stripped.startswith('**Status:**'):
            current_area['status'] = stripped.replace('**Status:**', '').strip()
            current_field = None
        elif stripped.startswith('**First identified:**'):
            current_area['first_identified'] = stripped.replace('**First identified:**', '').strip()
            current_field = None
        elif stripped.startswith('**Evidence:**'):
            current_field = 'evidence'
        elif stripped.startswith('**Progress:**'):
            current_field = 'progress'
        elif stripped.startswith('**Current practice:**'):
            current_area['current_practice'] = stripped.replace('**Current practice:**', '').strip()
            current_field = None
        elif stripped.startswith('- ') and current_field:
            entry = stripped[2:].strip()
            current_area[current_field].append(entry)

    if current_area:
        areas.append(current_area)

    return areas


def parse_session_log(content: str) -> list:
    """Parse session-log.md into a list of session objects."""
    sessions = []
    current_session = None

    lines = content.split('\n')

    for line in lines:
        stripped = line.strip()

        # New session starts with ##
        if stripped.startswith('## ') and not stripped.startswith('###'):
            if current_session:
                sessions.append(current_session)
            # Parse header: ## [Date] — [Type] — [Topic]
            header = stripped[3:].strip()
            parts = [p.strip() for p in header.split('—')]
            current_session = {
                'header': header,
                'date': parts[0] if len(parts) > 0 else '',
                'type': parts[1] if len(parts) > 1 else '',
                'topic': parts[2] if len(parts) > 2 else '',
                'key_insight': '',
                'areas_touched': '',
                'practice_assigned': '',
            }
            continue

        if current_session is None:
            continue

        if stripped.startswith('**Key insight:**'):
            current_session['key_insight'] = stripped.replace('**Key insight:**', '').strip()
        elif stripped.startswith('**Areas touched:**'):
            current_session['areas_touched'] = stripped.replace('**Areas touched:**', '').strip()
        elif stripped.startswith('**Practice assigned:**'):
            current_session['practice_assigned'] = stripped.replace('**Practice assigned:**', '').strip()

    if current_session:
        sessions.append(current_session)

    return sessions


def build_metadata(profile: dict, areas: list, sessions: list) -> dict:
    """Build metadata from parsed coaching state."""
    last_session = profile.get('identity', {}).get('last_session', '')
    last_periodic = profile.get('identity', {}).get('last_periodic_review', '')
    vision_reviewed = profile.get('career_vision', {}).get('last_reviewed', '')

    return {
        'last_session': last_session,
        'last_periodic_review': last_periodic,
        'vision_last_reviewed': vision_reviewed,
        'total_sessions': len(sessions),
        'active_areas': len([a for a in areas if a['status'] == 'active']),
        'watch_areas': len([a for a in areas if a['status'] == 'watch']),
        'archived_areas': len([a for a in areas if a['status'] == 'archived']),
    }


def main():
    # Check if coaching directory exists
    if not os.path.exists(INDEX_PATH):
        print(json.dumps({'status': 'not_initialized'}))
        return

    # Read all files
    try:
        with open(INDEX_PATH, 'r') as f:
            index_content = f.read()
    except Exception:
        index_content = ''

    try:
        with open(DEV_AREAS_PATH, 'r') as f:
            dev_areas_content = f.read()
    except Exception:
        dev_areas_content = ''

    try:
        with open(SESSION_LOG_PATH, 'r') as f:
            session_log_content = f.read()
    except Exception:
        session_log_content = ''

    has_projects = os.path.exists(PROJECTS_PATH)
    project_count = 0
    if has_projects:
        try:
            with open(PROJECTS_PATH, 'r') as f:
                projects_content = f.read()
            project_count = len(re.findall(r'^### ', projects_content, re.MULTILINE))
        except Exception:
            pass

    # Parse
    profile = parse_index(index_content)
    areas = parse_development_areas(dev_areas_content)
    sessions = parse_session_log(session_log_content)
    metadata = build_metadata(profile, areas, sessions)
    metadata['has_projects'] = has_projects
    metadata['project_count'] = project_count

    result = {
        'status': 'loaded',
        'profile': profile,
        'development_areas': areas,
        'session_log': sessions,
        'metadata': metadata,
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
