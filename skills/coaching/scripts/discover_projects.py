#!/usr/bin/env python3
"""Auto-discover analysis projects in the user's personal workspace.

Usage:
    python3 discover_projects.py
    python3 discover_projects.py --workspace /path/to/personal/workspace

Scans for directories with analysis artifacts (manifest.md, outputs/, sql/,
python/, mode_imports/) and reports which are already tracked in projects.md
vs. untracked.

Output: JSON with discovered projects, their artifacts, and tracking status.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import COACHING_DIR, PROJECTS_PATH

CURRENT_YEAR = str(datetime.now().year)

SKIP_DIRS = {
    'coaching', 'skills', '.cache', '__pycache__', 'node_modules',
    '.git', '.cursor', '.claude', '.agents', 'logs', 'tmp',
}

ARTIFACT_SIGNALS = {
    'manifest.md': 3,
    'outputs': 2,
    'sql': 2,
    'python': 1,
    'mode_imports': 1,
}


def get_workspace_dir() -> str:
    """Derive the user's personal workspace from COACHING_DIR."""
    return os.path.dirname(COACHING_DIR)


def get_tracked_projects() -> dict[str, dict]:
    """Parse projects.md and return dict of name -> {directory, status}."""
    tracked = {}
    if not os.path.exists(PROJECTS_PATH):
        return tracked

    with open(PROJECTS_PATH) as f:
        content = f.read()

    current_name = None
    current = {}
    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('### '):
            if current_name:
                tracked[current_name] = current
            current_name = stripped[4:].strip()
            current = {'status': '', 'directory': ''}
        elif current_name:
            if stripped.startswith('**Status:**'):
                current['status'] = stripped.split('**Status:**')[1].strip()
            elif stripped.startswith('**Directory:**'):
                current['directory'] = stripped.split('**Directory:**')[1].strip()

    if current_name:
        tracked[current_name] = current

    return tracked


def scan_directory(path: str) -> dict | None:
    """Check if a directory looks like an analysis project."""
    if not os.path.isdir(path):
        return None

    dirname = os.path.basename(path)
    if dirname.startswith('.') or dirname in SKIP_DIRS:
        return None

    score = 0
    artifacts = []

    for signal, weight in ARTIFACT_SIGNALS.items():
        signal_path = os.path.join(path, signal)
        if os.path.exists(signal_path):
            score += weight
            artifacts.append(signal)

    md_in_outputs = 0
    csv_in_outputs = 0
    outputs_dir = os.path.join(path, 'outputs')
    if os.path.isdir(outputs_dir):
        for root, _, files in os.walk(outputs_dir):
            for f in files:
                if f.endswith('.md'):
                    md_in_outputs += 1
                elif f.endswith('.csv'):
                    csv_in_outputs += 1

    if score < 2:
        return None

    purpose = ''
    manifest_path = os.path.join(path, 'manifest.md')
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path) as f:
                content = f.read()
            purpose_match = re.search(r'## Purpose\s*\n+(.*?)(?=\n## |\Z)', content, re.DOTALL)
            if purpose_match:
                purpose = purpose_match.group(1).strip()[:200]
            elif content.strip():
                first_para = content.split('\n\n')[0].strip()
                purpose = first_para[:200]
        except Exception:
            pass

    try:
        mtime = os.path.getmtime(path)
        last_modified = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')
    except Exception:
        last_modified = ''

    output_files = []
    if os.path.isdir(outputs_dir):
        for f in sorted(os.listdir(outputs_dir)):
            if f.endswith(('.md', '.csv', '.html', '.png')):
                output_files.append(f)

    return {
        'directory': dirname,
        'path': path,
        'score': score,
        'artifacts': artifacts,
        'purpose': purpose,
        'last_modified': last_modified,
        'md_outputs': md_in_outputs,
        'csv_outputs': csv_in_outputs,
        'output_files': output_files[:10],
        'year': last_modified[:4] if last_modified else '',
    }


def main():
    parser = argparse.ArgumentParser(description='Discover analysis projects')
    parser.add_argument('--workspace', help='Personal workspace directory (auto-derived if not set)')
    parser.add_argument('--year', default=CURRENT_YEAR, help=f'Filter to projects modified in this year (default: {CURRENT_YEAR})')
    args = parser.parse_args()

    workspace = args.workspace or get_workspace_dir()

    if not os.path.isdir(workspace):
        print(json.dumps({'error': f'Workspace not found: {workspace}'}))
        sys.exit(1)

    tracked = get_tracked_projects()
    tracked_dirs = {v['directory'] for v in tracked.values() if v['directory']}

    discovered = []
    for entry in sorted(os.listdir(workspace)):
        entry_path = os.path.join(workspace, entry)
        project = scan_directory(entry_path)
        if project:
            project['tracked'] = entry in tracked_dirs
            project['tracked_as'] = next(
                (name for name, info in tracked.items() if info['directory'] == entry),
                None,
            )

            for sub in sorted(os.listdir(entry_path)):
                sub_path = os.path.join(entry_path, sub)
                sub_project = scan_directory(sub_path)
                if sub_project:
                    sub_project['directory'] = f'{entry}/{sub}'
                    sub_project['tracked'] = sub_project['directory'] in tracked_dirs
                    sub_project['tracked_as'] = next(
                        (name for name, info in tracked.items() if info['directory'] == sub_project['directory']),
                        None,
                    )
                    discovered.append(sub_project)

            discovered.append(project)

    if args.year:
        year_filtered = [d for d in discovered if d.get('year', '') == args.year]
    else:
        year_filtered = discovered

    untracked = [d for d in year_filtered if not d['tracked']]
    already_tracked = [d for d in year_filtered if d['tracked']]

    result = {
        'status': 'ok',
        'workspace': workspace,
        'year': args.year,
        'total_discovered': len(year_filtered),
        'untracked': len(untracked),
        'already_tracked': len(already_tracked),
        'untracked_projects': sorted(untracked, key=lambda x: x['score'], reverse=True),
        'tracked_projects': already_tracked,
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
