#!/usr/bin/env python3
"""Scan workspace artifacts for a project to extract impact evidence.

Usage:
    python3 scan_impact.py --directory jan_bp_test_final_readout
    python3 scan_impact.py --directory /absolute/path/to/project

Scans:
- manifest.md (purpose, key findings, status, methodology)
- outputs/*.md (readout files with quantified results)
- outputs/**/*.csv (result data files — reports headers and row counts, not full data)

Output: JSON with structured evidence from local artifacts.
MCP sources (Slack, Google Docs, Glean) are handled by the AI, not this script.
"""

import argparse
import csv
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import COACHING_DIR

MAX_MD_CHARS = 5000
MAX_CSV_PREVIEW_ROWS = 5


def resolve_directory(directory: str) -> str:
    """Resolve a project directory path."""
    if os.path.isabs(directory):
        return directory

    coaching_parent = os.path.dirname(COACHING_DIR)
    candidate = os.path.join(coaching_parent, directory)
    if os.path.isdir(candidate):
        return candidate

    if os.path.isdir(directory):
        return os.path.abspath(directory)

    return candidate


def parse_manifest(path: str) -> dict:
    """Extract structured info from manifest.md."""
    with open(path) as f:
        content = f.read()

    result = {
        'exists': True,
        'purpose': '',
        'status': '',
        'key_findings': [],
        'key_artifacts': [],
        'open_questions': [],
        'raw_excerpt': content[:MAX_MD_CHARS],
    }

    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('## Purpose'):
            section = 'purpose'
            continue
        elif stripped.startswith('## Status') or stripped.startswith('**Status:**'):
            section = 'status'
            if '**Status:**' in stripped:
                result['status'] = stripped.split('**Status:**')[1].strip()
                section = None
            continue
        elif stripped.startswith('## Key') and 'Finding' in stripped:
            section = 'key_findings'
            continue
        elif stripped.startswith('## Key') and 'Artifact' in stripped:
            section = 'key_artifacts'
            continue
        elif stripped.startswith('## Open'):
            section = 'open_questions'
            continue
        elif stripped.startswith('## '):
            section = None
            continue

    purpose_match = re.search(r'## Purpose\s*\n+(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if purpose_match:
        result['purpose'] = purpose_match.group(1).strip()[:500]

    findings_match = re.search(r'## Key (?:Findings|Decisions|Results).*?\n+(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if findings_match:
        for line in findings_match.group(1).strip().split('\n'):
            stripped = line.strip()
            if stripped.startswith('- ') or stripped.startswith('* '):
                result['key_findings'].append(stripped[2:])

    artifacts_match = re.search(r'## Key Artifacts\s*\n+(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if artifacts_match:
        for line in artifacts_match.group(1).strip().split('\n'):
            stripped = line.strip()
            if stripped.startswith('- ') or stripped.startswith('* '):
                result['key_artifacts'].append(stripped[2:])

    status_match = re.search(r'\*\*Status:\*\*\s*(.+)', content)
    if status_match and not result['status']:
        result['status'] = status_match.group(1).strip()

    return result


def scan_markdown_outputs(directory: str) -> list[dict]:
    """Scan outputs/ for markdown files and extract key content."""
    outputs_dir = os.path.join(directory, 'outputs')
    results = []

    patterns = [
        os.path.join(outputs_dir, '*.md'),
        os.path.join(outputs_dir, '**', '*.md'),
    ]

    seen = set()
    for pattern in patterns:
        for path in glob.glob(pattern, recursive=True):
            if path in seen:
                continue
            seen.add(path)
            try:
                with open(path) as f:
                    content = f.read()

                numbers = re.findall(r'[-+]?\d+\.?\d*%|\$[\d,.]+[MBK]?|\d+\.?\d*x|\d{1,3}(?:,\d{3})+', content)

                results.append({
                    'file': os.path.relpath(path, directory),
                    'title': content.split('\n')[0].strip().lstrip('# ') if content else '',
                    'size_chars': len(content),
                    'quantified_values': numbers[:20],
                    'excerpt': content[:MAX_MD_CHARS],
                })
            except Exception:
                continue

    return results


def scan_csv_outputs(directory: str) -> list[dict]:
    """Scan for CSV files and report metadata + headers."""
    outputs_dir = os.path.join(directory, 'outputs')
    results = []

    patterns = [
        os.path.join(outputs_dir, '*.csv'),
        os.path.join(outputs_dir, '**', '*.csv'),
    ]

    seen = set()
    for pattern in patterns:
        for path in glob.glob(pattern, recursive=True):
            if path in seen:
                continue
            seen.add(path)
            try:
                size = os.path.getsize(path)
                with open(path) as f:
                    reader = csv.reader(f)
                    headers = next(reader, [])
                    preview_rows = []
                    row_count = 0
                    for row in reader:
                        row_count += 1
                        if row_count <= MAX_CSV_PREVIEW_ROWS:
                            preview_rows.append(row)

                results.append({
                    'file': os.path.relpath(path, directory),
                    'size_bytes': size,
                    'headers': headers,
                    'row_count': row_count,
                    'preview': preview_rows,
                })
            except Exception:
                continue

    return results


def main():
    parser = argparse.ArgumentParser(description='Scan workspace artifacts for impact evidence')
    parser.add_argument('--directory', required=True, help='Project directory (relative to personal workspace or absolute)')
    args = parser.parse_args()

    project_dir = resolve_directory(args.directory)

    if not os.path.isdir(project_dir):
        print(json.dumps({'error': f'Directory not found: {project_dir}', 'resolved_path': project_dir}))
        sys.exit(1)

    result = {
        'status': 'ok',
        'directory': project_dir,
        'manifest': None,
        'markdown_outputs': [],
        'csv_outputs': [],
        'file_tree': [],
    }

    manifest_path = os.path.join(project_dir, 'manifest.md')
    if os.path.exists(manifest_path):
        result['manifest'] = parse_manifest(manifest_path)
    else:
        result['manifest'] = {'exists': False}

    result['markdown_outputs'] = scan_markdown_outputs(project_dir)
    result['csv_outputs'] = scan_csv_outputs(project_dir)

    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ('__pycache__', '.cache', 'node_modules', '.git')]
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), project_dir)
            result['file_tree'].append(rel)

    result['summary'] = {
        'has_manifest': result['manifest']['exists'],
        'manifest_purpose': result['manifest'].get('purpose', '')[:200] if result['manifest']['exists'] else '',
        'markdown_output_count': len(result['markdown_outputs']),
        'csv_output_count': len(result['csv_outputs']),
        'total_files': len(result['file_tree']),
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
