#!/usr/bin/env python3
"""Parse raw leveling guide sheet data into structured JSON.

Usage:
    python3 parse_rubric.py --input raw_rows.json --output rubric.json
    python3 parse_rubric.py --input raw_rows.json  # prints to stdout

Input: JSON file containing an array of rows (each row is an array of cell values),
as returned by Google Sheets MCP read action.

Output: Structured JSON with levels and dimensions, suitable for gap analysis.
"""

import argparse
import json
import os
import sys


def find_level_row(rows: list[list]) -> tuple[int, list[str]]:
    """Find the row containing level identifiers (DS0, DS1, etc. or I3, I4, etc.)."""
    for i, row in enumerate(rows):
        cells = [str(c).strip() for c in row]
        if any(c.startswith('DS') and len(c) <= 3 for c in cells):
            return i, cells
        if any(c.startswith('I') and c[1:].isdigit() for c in cells):
            return i, cells
    return -1, []


def find_title_row(rows: list[list], level_row_idx: int) -> list[str]:
    """Find the row with role titles (usually one above the level row)."""
    if level_row_idx > 0:
        return [str(c).strip() for c in rows[level_row_idx - 1]]
    return []


def extract_levels(title_row: list[str], level_row: list[str], dd_level_row: list[str] | None) -> list[dict]:
    """Extract structured level info from header rows."""
    levels = []
    for i in range(len(level_row)):
        ds_level = level_row[i].strip() if i < len(level_row) else ''
        if not ds_level or not any(c.isdigit() for c in ds_level):
            continue
        title = title_row[i].strip() if i < len(title_row) else ''
        dd_level = dd_level_row[i].strip() if dd_level_row and i < len(dd_level_row) else ''
        levels.append({
            'column_index': i,
            'ds_level': ds_level,
            'dd_level': dd_level,
            'title': title,
        })
    return levels


def extract_dimensions(rows: list[list], start_row: int, level_columns: list[int]) -> list[dict]:
    """Extract dimension rows with requirements per level."""
    dimensions = []
    current_dim = None

    for row in rows[start_row:]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 2:
            continue

        dim_name = cells[1].strip() if len(cells) > 1 else ''
        has_content = any(cells[col].strip() for col in level_columns if col < len(cells))

        if not dim_name and not has_content:
            continue

        if dim_name and has_content:
            requirements = {}
            for level_info_idx, col in enumerate(level_columns):
                if col < len(cells) and cells[col].strip():
                    requirements[col] = cells[col].strip()

            current_dim = {
                'name': dim_name.split('\n')[0].strip(),
                'full_name': dim_name,
                'requirements': requirements,
            }
            dimensions.append(current_dim)

    return dimensions


def parse_rubric(rows: list[list]) -> dict:
    """Parse raw sheet rows into structured rubric JSON."""
    level_row_idx, level_cells = find_level_row(rows)
    if level_row_idx < 0:
        return {'error': 'Could not find level row (looking for DS0-DS5 or I3-I8 patterns)'}

    title_cells = find_title_row(rows, level_row_idx)

    dd_level_cells = None
    if level_row_idx + 1 < len(rows):
        next_row = [str(c).strip() for c in rows[level_row_idx + 1]]
        if any(c.startswith('I') and len(c) <= 3 and c[1:].isdigit() for c in next_row):
            dd_level_cells = next_row
            dim_start = level_row_idx + 3
        else:
            dd_level_cells = next_row if any(c.startswith('I') for c in next_row) else None
            dim_start = level_row_idx + 2
    else:
        dim_start = level_row_idx + 2

    levels = extract_levels(title_cells, level_cells, dd_level_cells)
    if not levels:
        return {'error': 'Could not extract level information from header rows'}

    level_columns = [l['column_index'] for l in levels]
    dimensions = extract_dimensions(rows, dim_start, level_columns)

    rubric = {
        'levels': [],
        'dimensions': [],
    }

    for level in levels:
        rubric['levels'].append({
            'ds_level': level['ds_level'],
            'dd_level': level['dd_level'],
            'title': level['title'],
        })

    for dim in dimensions:
        dim_entry = {
            'name': dim['name'],
            'by_level': {},
        }
        for level in levels:
            col = level['column_index']
            if col in dim['requirements']:
                dim_entry['by_level'][level['ds_level']] = dim['requirements'][col]
        if dim_entry['by_level']:
            rubric['dimensions'].append(dim_entry)

    return rubric


def main():
    parser = argparse.ArgumentParser(description='Parse leveling guide sheet data')
    parser.add_argument('--input', required=True, help='Path to JSON file with raw sheet rows')
    parser.add_argument('--output', help='Output path for structured rubric JSON (default: stdout)')
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(json.dumps({'error': f'Input file not found: {args.input}'}))
        sys.exit(1)

    with open(args.input) as f:
        raw = json.load(f)

    if isinstance(raw, dict) and 'rows' in raw:
        rows = raw['rows']
    elif isinstance(raw, list):
        rows = raw
    else:
        print(json.dumps({'error': 'Input must be a JSON array of rows or {"rows": [...]}'}))
        sys.exit(1)

    rubric = parse_rubric(rows)

    output = json.dumps(rubric, indent=2)
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(json.dumps({'status': 'ok', 'output': args.output, 'levels': len(rubric.get('levels', [])), 'dimensions': len(rubric.get('dimensions', []))}))
    else:
        print(output)


if __name__ == '__main__':
    main()
