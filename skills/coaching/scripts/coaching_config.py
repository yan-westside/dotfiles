"""Shared configuration for coaching skill scripts.

COACHING_DIR resolution order:
1. COACHING_DIR environment variable (if set)
2. Default: ~/coaching/
"""

import os
from datetime import datetime as _dt

COACHING_DIR = os.environ.get('COACHING_DIR', os.path.expanduser('~/coaching'))
INDEX_PATH = os.path.join(COACHING_DIR, 'index.md')
DEV_AREAS_PATH = os.path.join(COACHING_DIR, 'development-areas.md')
SESSION_LOG_PATH = os.path.join(COACHING_DIR, 'session-log.md')

CURRENT_YEAR = str(_dt.now().year)

def _resolve_projects_path() -> str:
    """Resolve the projects file path, preferring YYYY_projects.md."""
    yearly = os.path.join(COACHING_DIR, f'{CURRENT_YEAR}_projects.md')
    legacy = os.path.join(COACHING_DIR, 'projects.md')
    if os.path.exists(yearly):
        return yearly
    if os.path.exists(legacy):
        return legacy
    return yearly

PROJECTS_PATH = _resolve_projects_path()
